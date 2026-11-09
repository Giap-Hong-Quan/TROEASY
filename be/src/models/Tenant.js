import mongoose from "mongoose";

/**
 * ==============================================================================
 * DANH SÁCH TRẠNG THÁI KHÁCH THUÊ
 * ==============================================================================
 */
export const TENANT_STATUSES = Object.freeze([
    "active",   // Đang thuê / đang ở
    "checkout", // Đã trả phòng
]);

/**
 * ==============================================================================
 * MONGOOSE SCHEMA: TENANT (KHÁCH THUÊ - BẢN GỌN CƠ BẢN)
 * ==============================================================================
 * Chỉ giữ lại các thông tin thiết yếu nhất để quản lý khách thuê phòng trọ.
 */
const tenantSchema = new mongoose.Schema(
    {
        // 1. LIÊN KẾT PHÒNG & KHU VỰC
        // Khách này đang ở phòng nào? (Có thể null nếu đã dọn đi)
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            default: null,
            index: true,
        },
        // Thuộc khu trọ nào?
        areaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Area",
            required: [true, "Khu vực là bắt buộc"],
            index: true,
        },

        // 2. THÔNG TIN CÁ NHÂN CƠ BẢN
        // Họ và tên khách thuê
        fullName: {
            type: String,
            required: [true, "Họ và tên là bắt buộc"],
            trim: true,
        },
        // Số điện thoại liên lạc chính
        phone: {
            type: String,
            required: [true, "Số điện thoại là bắt buộc"],
            trim: true,
            index: true,
        },
        // Số CCCD / CMND (dùng để quản lý thông tin cư trú)
        citizenId: {
            type: String,
            trim: true,
            default: "",
        },

        // 3. THÔNG TIN THUÊ PHÒNG
        // Khách có phải là người đại diện đứng tên chính cho phòng không?
        isRepresentative: {
            type: Boolean,
            default: true,
        },
        // Trạng thái: active (đang ở) hoặc checkout (đã rời đi)
        status: {
            type: String,
            enum: TENANT_STATUSES,
            default: "active",
            index: true,
        },
        // Ngày bắt đầu vào ở
        startDate: {
            type: Date,
            default: Date.now,
        },
        // Tiền đặt cọc của phòng / khách
        depositAmount: {
            type: Number,
            default: 0,
            min: [0, "Tiền cọc không được âm"],
        },

        // Ghi chú thêm (nếu có)
        notes: {
            type: String,
            default: "",
        },
    },
    {
        // Tự động tạo createdAt (ngày tạo) và updatedAt (ngày cập nhật)
        timestamps: true,
    }
);

// Index hỗ trợ tìm kiếm khách theo khu vực và trạng thái
tenantSchema.index({ areaId: 1, status: 1 });

const Tenant = mongoose.models.Tenant || mongoose.model("Tenant", tenantSchema);

export default Tenant;
