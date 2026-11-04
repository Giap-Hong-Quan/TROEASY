import mongoose from "mongoose";

const areaSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Tên khu là bắt buộc"],
            trim: true,
            maxlength: 120,
        },
        code: {
            type: String,
            required: [true, "Mã khu là bắt buộc"],
            trim: true,
            uppercase: true,
            maxlength: 32,
        },
        address: {
            type: String,
            required: [true, "Địa chỉ khu là bắt buộc"],
            trim: true,
            maxlength: 300,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true },
);

areaSchema.index({ code: 1 }, { unique: true });

const Area = mongoose.models.Area || mongoose.model("Area", areaSchema);

export default Area;
