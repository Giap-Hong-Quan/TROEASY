import mongoose from "mongoose";

/**
 * ==============================================================================
 * MONGOOSE SCHEMA: EXPENSE (KHOẢN CHI THEO KHU TRỌ)
 * ==============================================================================
 * Luồng nghiệp vụ:
 *   1. Phát sinh khoản chi ở khu nào -> ghi lại: tên khoản chi + số tiền.
 *   2. Mỗi khoản chi gắn với 1 khu (areaId) -> thống kê được chi phí riêng từng khu.
 *   3. Thời điểm ghi lấy từ createdAt (timestamps tự sinh) -> dùng để lọc theo tháng.
 *   4. Khi thống kê:  Lời = Tổng tiền thu - Tổng amount của các khoản chi.
 */
const expenseSchema = new mongoose.Schema(
    {
        // Khu trọ phát sinh khoản chi
        areaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Area",
            required: [true, "Khu vực là bắt buộc"],
        },
        // Tên khoản chi (VD: "Sửa máy bơm", "Tiền rác tháng 11")
        name: {
            type: String,
            required: [true, "Tên khoản chi là bắt buộc"],
            trim: true,
        },
        // Số tiền chi (VNĐ)
        amount: {
            type: Number,
            required: [true, "Số tiền là bắt buộc"],
            min: [0, "Số tiền không được âm"],
        },
    },
    // Tự sinh createdAt / updatedAt -> createdAt chính là ngày ghi khoản chi
    { timestamps: true },
);

// Index phục vụ thống kê: "tổng chi của khu X trong khoảng thời gian"
expenseSchema.index({ areaId: 1, createdAt: -1 });

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;
