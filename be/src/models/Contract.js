import mongoose from "mongoose";

/**
 * ==============================================================================
 * DANH SÁCH TRẠNG THÁI HỢP ĐỒNG THUÊ TRỌ
 * ==============================================================================
 * - draft: Hợp đồng nháp, đang soạn thảo hoặc chờ khách ký
 * - active: Đang có hiệu lực (khách đang ở và đóng tiền theo kỳ)
 * - expired: Hợp đồng đã đến ngày hết hạn nhưng chưa tái ký
 * - terminated: Đã thanh lý / chấm dứt trước hạn (khách trả phòng sớm)
 */
export const CONTRACT_STATUSES = Object.freeze([
    "draft",
    "active",
    "expired",
    "terminated",
]);

/**
 * ==============================================================================
 * MONGOOSE SCHEMA: CONTRACT (HỢP ĐỒNG THUÊ PHÒNG)
 * ==============================================================================
 * Quản lý thời hạn thuê, giá thuê, tiền cọc, chi phí dịch vụ điện/nước
 * và liên kết giữa Phòng trọ với Người đại diện đứng tên hợp đồng.
 */
const contractSchema = new mongoose.Schema(
    {
        // 1. MÃ HỢP ĐỒNG
        // Mã hiển thị nhận diện (VD: "HD-P101-2026", "HD20261101")
        contractCode: {
            type: String,
            required: [true, "Mã hợp đồng là bắt buộc"],
            unique: true,
            trim: true,
            uppercase: true,
        },

        // 2. LIÊN KẾT ĐỐI TƯỢNG (RELATIONSHIPS)
        // Khu trọ diễn ra hợp đồng
        areaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Area",
            required: [true, "Khu vực là bắt buộc"],
            index: true,
        },
        // Phòng được thuê
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: [true, "Phòng thuê là bắt buộc"],
            index: true,
        },
        // Khách thuê đại diện đứng tên trên hợp đồng (Chủ phòng)
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tenant",
            required: [true, "Người đại diện hợp đồng là bắt buộc"],
            index: true,
        },

        // 3. THỜI HẠN THUÊ PHÒNG
        // Ngày bắt đầu tính tiền / bắt đầu ở
        startDate: {
            type: Date,
            required: [true, "Ngày bắt đầu hợp đồng là bắt buộc"],
            default: Date.now,
        },
        // Ngày kết thúc hợp đồng (hạn thuê: 6 tháng, 1 năm...)
        endDate: {
            type: Date,
            required: [true, "Ngày kết thúc hợp đồng là bắt buộc"],
        },

        // 4. TIỀN NÔNG & THANH TOÁN
        // Giá thuê phòng mỗi tháng (thỏa thuận cố định trong suốt hợp đồng)
        rentalPrice: {
            type: Number,
            required: [true, "Giá thuê phòng là bắt buộc"],
            min: [0, "Giá thuê không được âm"],
        },
        // Tiền đặt cọc giữ phòng
        depositAmount: {
            type: Number,
            default: 0,
            min: [0, "Tiền cọc không được âm"],
        },
        // Ngày chốt hóa đơn / thu tiền hàng tháng (ví dụ: ngày 5 hàng tháng)
        billingDay: {
            type: Number,
            default: 5,
            min: [1, "Ngày thu tiền từ 1 đến 31"],
            max: [31, "Ngày thu tiền từ 1 đến 31"],
        },
        // Chu kỳ thu tiền (tính theo tháng, mặc định 1 tháng thu 1 lần)
        paymentCycle: {
            type: Number,
            default: 1,
            min: [1, "Chu kỳ thanh toán tối thiểu 1 tháng"],
        },

        // 5. ĐƠN GIÁ DỊCH VỤ THỎA THUẬN KHI KÝ HỢP ĐỒNG
        // Giúp cố định biểu phí dịch vụ cho phòng này theo đúng hợp đồng đã ký
        serviceFees: {
            // Giá điện (VNĐ/kWh hoặc khoán)
            electricityPrice: { type: Number, default: 3500 },
            // Giá nước (VNĐ/m3 hoặc VNĐ/người/tháng)
            waterPrice: { type: Number, default: 20000 },
            // Tiền mạng Internet / Wifi (VNĐ/tháng)
            internetPrice: { type: Number, default: 100000 },
            // Tiền rác / vệ sinh (VNĐ/tháng)
            garbagePrice: { type: Number, default: 30000 },
        },

        // 6. TRẠNG THÁI HỢP ĐỒNG
        status: {
            type: String,
            enum: CONTRACT_STATUSES,
            default: "active",
            index: true,
        },

        // 7. HÌNH ẢNH HỢP ĐỒNG & GHI CHÚ
        // Ảnh chụp bản hợp đồng giấy có chữ ký (nếu có lưu trữ file)
        contractImages: {
            type: [String],
            default: [],
        },
        // Điều khoản riêng hoặc ghi chú bổ sung của chủ nhà
        notes: {
            type: String,
            default: "",
            trim: true,
        },
    },
    {
        // Tự động thêm trường createdAt (ngày tạo) và updatedAt (ngày cập nhật)
        timestamps: true,
    }
);

// Index hỗ trợ truy vấn nhanh các hợp đồng đang hiệu lực của 1 phòng
contractSchema.index({ roomId: 1, status: 1 });

// Index hỗ trợ tìm nhanh hợp đồng theo khu vực
contractSchema.index({ areaId: 1, status: 1 });

const Contract = mongoose.models.Contract || mongoose.model("Contract", contractSchema);

export default Contract;

