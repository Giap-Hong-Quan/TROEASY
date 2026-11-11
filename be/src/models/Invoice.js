import mongoose from "mongoose";

/**
 * ==============================================================================
 * DANH SÁCH TRẠNG THÁI HÓA ĐƠN THU TIỀN
 * ==============================================================================
 * - unpaid:  Chưa thanh toán (paidAmount === 0)
 * - partial: Đã thu một phần (0 < paidAmount < totalAmount)
 * - paid:    Đã thu đủ (paidAmount >= totalAmount)
 */
export const INVOICE_STATUSES = Object.freeze(["unpaid", "partial", "paid"]);

export const PAYMENT_METHODS = Object.freeze(["", "cash", "transfer"]);

const meterSnapshotSchema = new mongoose.Schema(
    {
        oldIndex: { type: Number, default: 0, min: 0 },
        newIndex: { type: Number, default: 0, min: 0 },
        usage: { type: Number, default: 0, min: 0 },
        unitPrice: { type: Number, default: 0, min: 0 },
        amount: { type: Number, default: 0, min: 0 },
    },
    { _id: false },
);

/**
 * ==============================================================================
 * MONGOOSE SCHEMA: INVOICE (HÓA ĐƠN TIỀN TRỌ & THU TIỀN ĐỊNH KỲ)
 * ==============================================================================
 * Tổng hợp tiền thuê phòng + tiền điện nước (từ UtilityReading) + phí dịch vụ
 * (mạng, rác, phụ phí khác) theo từng phòng mỗi tháng.
 */
const invoiceSchema = new mongoose.Schema(
    {
        invoiceCode: {
            type: String,
            required: [true, "Mã hóa đơn là bắt buộc"],
            unique: true,
            trim: true,
            uppercase: true,
        },
        areaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Area",
            required: [true, "Khu vực là bắt buộc"],
            index: true,
        },
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: [true, "Phòng là bắt buộc"],
            index: true,
        },
        contractId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Contract",
            default: null,
        },
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            default: null,
        },
        utilityReadingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UtilityReading",
            default: null,
        },
        month: {
            type: Number,
            required: [true, "Tháng lập hóa đơn là bắt buộc"],
            min: [1, "Tháng từ 1 đến 12"],
            max: [12, "Tháng từ 1 đến 12"],
        },
        year: {
            type: Number,
            required: [true, "Năm lập hóa đơn là bắt buộc"],
            min: [2000, "Năm không hợp lệ"],
        },

        // Các khoản cấu thành hóa đơn
        roomPrice: {
            type: Number,
            default: 0,
            min: [0, "Tiền thuê phòng không được âm"],
        },
        electricity: {
            type: meterSnapshotSchema,
            default: () => ({}),
        },
        water: {
            type: meterSnapshotSchema,
            default: () => ({}),
        },
        internetFee: {
            type: Number,
            default: 0,
            min: [0, "Tiền mạng không được âm"],
        },
        garbageFee: {
            type: Number,
            default: 0,
            min: [0, "Tiền rác không được âm"],
        },
        otherFee: {
            type: Number,
            default: 0,
            min: [0, "Phụ phí khác không được âm"],
        },
        discount: {
            type: Number,
            default: 0,
            min: [0, "Giảm trừ không được âm"],
        },

        // Tổng hợp thanh toán
        totalAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        paidAmount: {
            type: Number,
            default: 0,
            min: [0, "Số tiền đã thu không được âm"],
        },
        remainingAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        status: {
            type: String,
            enum: INVOICE_STATUSES,
            default: "unpaid",
            index: true,
        },
        paymentMethod: {
            type: String,
            enum: PAYMENT_METHODS,
            default: "",
        },
        dueDate: {
            type: Date,
            default: null,
        },
        paidAt: {
            type: Date,
            default: null,
        },
        notes: {
            type: String,
            default: "",
            trim: true,
        },
    },
    {
        timestamps: true,
    },
);

// Mỗi phòng chỉ có 1 hóa đơn định kỳ trong 1 tháng/năm
invoiceSchema.index({ roomId: 1, month: 1, year: 1 }, { unique: true });
invoiceSchema.index({ areaId: 1, year: -1, month: -1 });

// Tự động tính toán tổng tiền, còn nợ và trạng thái thanh toán (Mongoose 9 sync hook)
invoiceSchema.pre("validate", function () {
    if (this.electricity) {
        const eUsage = Math.max(
            0,
            (Number(this.electricity.newIndex) || 0) -
                (Number(this.electricity.oldIndex) || 0),
        );
        this.electricity.usage = eUsage;
        this.electricity.amount = Math.round(
            eUsage * (Number(this.electricity.unitPrice) || 0),
        );
    }

    if (this.water) {
        const wUsage = Math.max(
            0,
            (Number(this.water.newIndex) || 0) -
                (Number(this.water.oldIndex) || 0),
        );
        this.water.usage = wUsage;
        this.water.amount = Math.round(
            wUsage * (Number(this.water.unitPrice) || 0),
        );
    }

    const gross =
        (Number(this.roomPrice) || 0) +
        (Number(this.electricity?.amount) || 0) +
        (Number(this.water?.amount) || 0) +
        (Number(this.internetFee) || 0) +
        (Number(this.garbageFee) || 0) +
        (Number(this.otherFee) || 0) -
        (Number(this.discount) || 0);

    this.totalAmount = Math.max(0, Math.round(gross));
    this.paidAmount = Math.max(0, Math.round(Number(this.paidAmount) || 0));
    this.remainingAmount = Math.max(0, this.totalAmount - this.paidAmount);

    if (this.paidAmount <= 0) {
        this.status = "unpaid";
        this.paidAt = null;
    } else if (this.paidAmount >= this.totalAmount) {
        this.status = "paid";
        if (!this.paidAt) this.paidAt = new Date();
    } else {
        this.status = "partial";
        if (!this.paidAt) this.paidAt = new Date();
    }
});

const Invoice =
    mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);

export default Invoice;

