import mongoose from "mongoose";

/**
 * ==============================================================================
 * DANH SÁCH TRẠNG THÁI BẢN GHI ĐIỆN NƯỚC
 * ==============================================================================
 * - recorded: Đã ghi chỉ số, chưa lên hóa đơn (vẫn cho phép sửa)
 * - invoiced: Đã được đưa vào hóa đơn tháng
 * - paid:     Đã thu tiền xong
 */
export const UTILITY_READING_STATUSES = Object.freeze([
    "recorded",
    "invoiced",
    "paid",
]);

/**
 * ==============================================================================
 * SUB-SCHEMA: CHỈ SỐ 1 LOẠI ĐỒNG HỒ (ĐIỆN HOẶC NƯỚC)
 * ==============================================================================
 * Dùng chung cho cả điện (kWh) và nước (m³).
 * Luồng tính: usage = newIndex - oldIndex ; amount = usage * unitPrice
 */
const meterSchema = new mongoose.Schema(
    {
        // Chỉ số cũ: lấy từ newIndex của kỳ trước (hoặc nhập tay ở kỳ đầu tiên)
        oldIndex: {
            type: Number,
            default: 0,
            min: [0, "Chỉ số cũ không được âm"],
        },
        // Chỉ số mới: chủ trọ đọc trên đồng hồ ở kỳ chốt này
        newIndex: {
            type: Number,
            required: [true, "Chỉ số mới là bắt buộc"],
            min: [0, "Chỉ số mới không được âm"],
        },
        // Đơn giá áp dụng tại thời điểm ghi (snapshot từ Contract.serviceFees)
        unitPrice: {
            type: Number,
            default: 0,
            min: [0, "Đơn giá không được âm"],
        },
        // Lượng tiêu thụ trong kỳ (tự tính)
        usage: {
            type: Number,
            default: 0,
        },
        // Thành tiền của loại này trong kỳ (tự tính)
        amount: {
            type: Number,
            default: 0,
        },
    },
    { _id: false },
);

/**
 * ==============================================================================
 * MONGOOSE SCHEMA: UTILITY_READING (CHỈ SỐ ĐIỆN NƯỚC THEO PHÒNG / THÁNG)
 * ==============================================================================
 */
const utilityReadingSchema = new mongoose.Schema(
    {
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
        month: {
            type: Number,
            required: [true, "Tháng là bắt buộc"],
            min: [1, "Tháng từ 1 đến 12"],
            max: [12, "Tháng từ 1 đến 12"],
        },
        year: {
            type: Number,
            required: [true, "Năm là bắt buộc"],
            min: [2000, "Năm không hợp lệ"],
        },
        readingDate: {
            type: Date,
            default: Date.now,
        },
        electricity: {
            type: meterSchema,
            required: [true, "Chỉ số điện là bắt buộc"],
        },
        water: {
            type: meterSchema,
            required: [true, "Chỉ số nước là bắt buộc"],
        },
        totalAmount: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: UTILITY_READING_STATUSES,
            default: "recorded",
            index: true,
        },
        notes: {
            type: String,
            trim: true,
            default: "",
        },
    },
    { timestamps: true },
);

utilityReadingSchema.index({ roomId: 1, year: 1, month: 1 }, { unique: true });
utilityReadingSchema.index({ areaId: 1, year: 1, month: 1 });

function calcMeter(meter, label) {
    if (!meter) return null;
    const oldIndex = Number(meter.oldIndex) || 0;
    const newIndex = Number(meter.newIndex) || 0;

    if (newIndex < oldIndex) {
        return `Chỉ số ${label} mới (${newIndex}) không được nhỏ hơn chỉ số cũ (${oldIndex}).`;
    }

    meter.usage = newIndex - oldIndex;
    meter.amount = meter.usage * (Number(meter.unitPrice) || 0);
    return null;
}

utilityReadingSchema.pre("validate", function () {
    const elecError = calcMeter(this.electricity, "điện");
    if (elecError) this.invalidate("electricity.newIndex", elecError);

    const waterError = calcMeter(this.water, "nước");
    if (waterError) this.invalidate("water.newIndex", waterError);

    this.totalAmount =
        (this.electricity?.amount || 0) + (this.water?.amount || 0);
});

const UtilityReading = mongoose.model("UtilityReading", utilityReadingSchema);

export default UtilityReading;

