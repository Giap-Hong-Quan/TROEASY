import mongoose from "mongoose";

export const ROOM_STATUSES = Object.freeze([
    "vacant", // Phòng trống, sẵn sàng cho thuê
    "renting", // Đang có người thuê
    "deposit", // Đã đặt cọc, chờ nhận phòng
    "repair", // Đang sửa chữa
    "stop", // Tạm ngừng cho thuê
]);

const roomSchema = new mongoose.Schema(
    {
        areaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Area",
        },
        code: {
            type: String,
            trim: true,
            uppercase: true,
        },
        floor: {
            type: Number,
        },
        basePrice: {
            type: Number,
        },
        status: {
            type: String,
            enum: ROOM_STATUSES,
            default: "vacant",
            index: true,
        },
        currentContractId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Contract",
            default: null,
        },
        qrAccessToken: {
            type: String,
            trim: true,
        },
        assets: {
            type: [String],
            default: [],
        },
    },
);

roomSchema.index({ areaId: 1, code: 1 }, { unique: true });
roomSchema.index({ qrAccessToken: 1 }, { unique: true, sparse: true });

const Room = mongoose.models.Room || mongoose.model("Room", roomSchema);

export default Room;
