import mongoose from "mongoose";

export const MAINTENANCE_STATUSES = Object.freeze([
    "open", // Chờ xử lý
    "in_progress", // Đang sửa
    "resolved", // Đã xong
]);

/**
 * ==============================================================================
 * MONGOOSE SCHEMA: MAINTENANCE_TICKET (BẢO TRÌ PHÒNG TRỌ - TỐI GIẢN)
 * ==============================================================================
 * Chỉ gồm: Khu vực, Phòng, Tên bảo trì (title), Mô tả (description), Trạng thái (status)
 */
const maintenanceTicketSchema = new mongoose.Schema(
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
        title: {
            type: String,
            required: [true, "Tên bảo trì là bắt buộc"],
            trim: true,
        },
        description: {
            type: String,
            default: "",
            trim: true,
        },
        status: {
            type: String,
            enum: MAINTENANCE_STATUSES,
            default: "open",
            index: true,
        },
    },
    {
        timestamps: true,
    },
);

maintenanceTicketSchema.index({ areaId: 1, status: 1, createdAt: -1 });

const MaintenanceTicket =
    mongoose.models.MaintenanceTicket ||
    mongoose.model("MaintenanceTicket", maintenanceTicketSchema);

export default MaintenanceTicket;
