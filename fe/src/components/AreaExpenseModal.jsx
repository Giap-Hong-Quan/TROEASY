import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  createExpense,
  deleteExpense,
  getExpenses,
} from "../services/expenseService.js";

function formatVnd(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function AreaExpenseModal({ isOpen, onClose, area }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses", area?.id],
    queryFn: () => getExpenses({ areaId: area.id }),
    enabled: Boolean(isOpen && area?.id),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createExpense(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", area?.id] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Đã ghi nhận khoản chi thành công!");
      setName("");
      setAmount("");
      setErrorMessage("");
    },
    onError: (error) => {
      const msg =
        error.response?.data?.message ||
        "Không thể tạo khoản chi. Vui lòng thử lại.";
      setErrorMessage(msg);
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", area?.id] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Đã xóa khoản chi.");
    },
    onError: (error) => {
      const msg =
        error.response?.data?.message || "Xóa khoản chi thất bại.";
      toast.error(msg);
    },
  });

  const totalAmount = useMemo(
    () => expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [expenses]
  );

  if (!isOpen || !area) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage("Vui lòng nhập tên khoản chi.");
      return;
    }

    const numericAmount = Number(String(amount).replace(/[^\d]/g, ""));
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage("Vui lòng nhập số tiền hợp lệ lớn hơn 0.");
      return;
    }

    createMutation.mutate({
      areaId: area.id,
      name: trimmedName,
      amount: numericAmount,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#181b2e]/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-visible rounded-[20px] border border-[#e7e7ef] bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#eeeff6] px-6 py-4">
          <div>
            <h2 className="text-lg font-extrabold text-[#20243c]">
              Khoản chi — {area.name}
            </h2>
            <p className="mt-0.5 text-xs text-[#9298aa]">
              Ghi nhận các khoản chi phát sinh cho khu trọ
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="grid h-8 w-8 place-items-center rounded-lg text-[#8c92a6] transition-colors hover:bg-[#f4f5fa] hover:text-[#20243c]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {errorMessage && (
            <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600">
              {errorMessage}
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Tên khoản chi */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#3e435b]">
                Tên khoản chi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Sửa máy bơm, Tiền rác..."
                className="h-10 w-full rounded-[10px] border border-[#e5e6ee] bg-white px-3 text-[13px] text-[#20243c] outline-none placeholder:text-[#a0a5b8] focus:border-[#6756df]"
              />
            </div>

            {/* Số tiền */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#3e435b]">
                Số tiền (VNĐ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="VD: 250000"
                className="h-10 w-full rounded-[10px] border border-[#e5e6ee] bg-white px-3 text-[13px] text-[#20243c] outline-none placeholder:text-[#a0a5b8] focus:border-[#6756df]"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex h-8 items-center justify-center gap-1 rounded-[8px] bg-[#6756df] px-3 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#5b4bc7] active:scale-[0.98] disabled:opacity-60"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Plus size={13} />
                  Thêm khoản chi
                </>
              )}
            </button>
          </div>

          {/* Danh sách khoản chi */}
          <div className="border-t border-[#eeeff6] pt-4">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-bold text-[#3e435b]">
                Lịch sử khoản chi ({expenses.length})
              </span>
              <span className="text-xs font-bold text-[#20243c]">
                Tổng chi:{" "}
                <span className="text-rose-600">{formatVnd(totalAmount)}</span>
              </span>
            </div>

            {isLoading ? (
              <div className="py-6 text-center text-xs text-[#9298aa]">
                Đang tải danh sách khoản chi...
              </div>
            ) : expenses.length === 0 ? (
              <div className="rounded-[10px] border border-dashed border-[#dfe1eb] bg-[#fafaff] py-6 text-center text-xs text-[#8c92a6]">
                Chưa có khoản chi nào được ghi nhận cho khu này.
              </div>
            ) : (
              <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                {expenses.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-[10px] border border-[#e5e6ee] bg-[#f7f8fc] px-3.5 py-2.5 transition-colors hover:border-[#d9dbee]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-[#20243c]">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#9298aa]">
                        {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[13px] font-extrabold text-rose-600">
                        -{formatVnd(item.amount)}
                      </span>
                      <button
                        type="button"
                        title="Xóa khoản chi"
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(item.id)}
                        className="grid h-7 w-7 place-items-center rounded-lg text-[#8c92a6] transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-[#eeeff6] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 items-center justify-center rounded-[8px] border border-[#e5e6ee] bg-white px-3 text-[11.5px] font-semibold text-[#54596e] transition-colors hover:bg-slate-50"
            >
              Đóng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
