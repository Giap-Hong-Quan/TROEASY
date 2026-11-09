import mongoose from "mongoose";

const rowSchema = new mongoose.Schema(
    {
        areaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Area",
            required: [true, "Khu vực là bắt buộc"],
            index: true,
        },
        name: {
            type: String,
            required: [true, "Tên dãy là bắt buộc"],
            trim: true,
            maxlength: 80,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true },
);

rowSchema.index({ areaId: 1, name: 1 }, { unique: true });

const Row = mongoose.models.Row || mongoose.model("Row", rowSchema);

export default Row;

