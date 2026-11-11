import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, CreditCard, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import { payInvoice } from "../services/invoiceService.js";

function formatVnd(value) {
  return `${Math.round(Number(value) || 0).toLocaleString("vi-VN")} đ`;
}

export default function InvoicePaymentModal({ open, invoice, onClose }) {
  const queryClient = useQueryClient();
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("transfer");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open && invoice) {
      setPaidAmount(String(invoice.totalAmount ?? 0));
      setPaymentMethod(invoice.paymentMethod || "transfer");
      setNotes(invoice.notes || "");
    }
  }, [open, invoice]);

  const payMutation = useMutation({
    mutationFn: payInvoice,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoiceSheet"] });
      queryClient.invalidateQueries({ queryKey: ["utilitySheet"] });
      toast.success(
        updated?.status === "paid"
          ? `Đã thu đủ tiền phòng ${invoice?.roomCode}!`
          : `Đã cập nhật số tiền thu cho phòng ${invoice?.roomCode}!`
      );
      onClose?.();
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message || err.message || "Cập nhật thu tiền thất bại."
      );
    },
  });

  if (!open || !invoice) return null;

  const numPaid = Math.max(0, Number(paidAmount) || 0);
  const remainingAfter = Math.max(0, (Number(invoice.totalAmount) || 0) - numPaid);

  const handleSubmit = (e) => {
    e.preventDefault();
    payMutation.mutate({
      id: invoice.id,
      paidAmount: numPaid,
      paymentMethod,
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={() => !payMutation.isPending && onClose?.()}
        className="absolute inset-0 bg-[#1c1f37]/45 backdrop-blur-[2px]"
      />
      <section
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-[500px] overflow-hidden rounded-[20px] border border-[#e7e7ef] bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#eeeff6] px-6 py-4">
          <div>
            <h2 className="text-[17px] font-extrabold text-[#20243c]">
              Thu tiền hóa đơn — {invoice.roomCode}
            </h2>
            <p className="mt-0.5 text-xs text-[#878da1]">
              {invoice.areaName} · Kỳ Tháng {invoice.month}/{invoice.year} ·{" "}
              {invoice.invoiceCode}
            </p>
          </div>
          <button
            type="button"
            disabled={payMutation.isPending}
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-[#7c8197] hover:bg-[#f4f4fb]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* Chi tiết các khoản */}
          <div className="space-y-2 rounded-[14px] border border-[#ececf4] bg-[#fafafe] p-3.5 text-xs">
            <div className="flex items-center justify-between text-[#5d637a]">
              <span>Khách đại diện</span>
              <strong className="text-[#20243c]">
                {invoice.tenantName || "Chưa cập nhật"}
              </strong>
            </div>
            <div className="flex items-center justify-between text-[#5d637a]">
              <span>Tiền thuê phòng</span>
              <strong className="text-[#20243c]">
                {formatVnd(invoice.roomPrice)}
              </strong>
            </div>
            <div className="flex items-center justify-between text-[#5d637a]">
              <span>
                Tiền điện ({invoice.electricity?.oldIndex ?? 0} →{" "}
                {invoice.electricity?.newIndex ?? 0} ={" "}
                {invoice.electricity?.usage ?? 0} kWh)
              </span>
              <strong className="text-[#d48217]">
                {formatVnd(invoice.electricity?.amount)}
              </strong>
            </div>
            <div className="flex items-center justify-between text-[#5d637a]">
              <span>
                Tiền nước ({invoice.water?.oldIndex ?? 0} →{" "}
                {invoice.water?.newIndex ?? 0} = {invoice.water?.usage ?? 0} m³)
              </span>
              <strong className="text-[#1a78b0]">
                {formatVnd(invoice.water?.amount)}
              </strong>
            </div>
            <div className="flex items-center justify-between text-[#5d637a]">
              <span>Phí dịch vụ (Mạng + Rác + Phụ phí)</span>
              <strong className="text-[#20243c]">
                {formatVnd(invoice.serviceAmount)}
              </strong>
            </div>
            {invoice.discount > 0 && (
              <div className="flex items-center justify-between text-[#168e70]">
                <span>Giảm trừ</span>
                <strong>-{formatVnd(invoice.discount)}</strong>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-[#e5e6f0] pt-2 text-[13px]">
              <span className="font-bold text-[#20243c]">Tổng phải thu</span>
              <strong className="text-[15px] font-extrabold text-[#5e4bd5]">
                {formatVnd(invoice.totalAmount)}
              </strong>
            </div>
          </div>

          {/* Tổng số tiền khách đã đóng */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-xs font-bold text-[#333752]">
                Số tiền khách thanh toán (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaidAmount(String(invoice.totalAmount || 0))}
                  className="rounded-md bg-[#efecff] px-2 py-0.5 text-[11px] font-bold text-[#5e4bd5] hover:bg-[#e3ddff]"
                >
                  Thu đủ 100%
                </button>
                <button
                  type="button"
                  onClick={() => setPaidAmount("0")}
                  className="rounded-md bg-[#f3f4f8] px-2 py-0.5 text-[11px] font-semibold text-[#676d85] hover:bg-[#e7e8f0]"
                >
                  Chưa thu (0 đ)
                </button>
              </div>
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={paidAmount}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || /^\d*$/.test(v)) setPaidAmount(v);
              }}
              placeholder="Nhập số tiền đã thu..."
              className="h-10 w-full rounded-[10px] border border-[#e2e3ef] bg-[#fafafe] px-3.5 text-sm font-bold text-[#20243c] outline-none transition focus:border-[#6e5ce8] focus:bg-white"
            />
            <p className="mt-1 text-[11px] text-[#7c8298]">
              Còn nợ sau khi thu:{" "}
              <strong
                className={
                  remainingAfter > 0 ? "text-[#df606d]" : "text-[#168e70]"
                }
              >
                {formatVnd(remainingAfter)}
              </strong>
            </p>
          </div>

          {/* Hình thức thanh toán */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#333752]">
              Hình thức thanh toán
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("transfer")}
                className={`h-9 rounded-[10px] border text-xs font-bold transition ${
                  paymentMethod === "transfer"
                    ? "border-[#6e5ce8] bg-[#efecff] text-[#5e4bd5]"
                    : "border-[#e2e3ef] bg-[#fafafe] text-[#5d637a] hover:bg-white"
                }`}
              >
                Chuyển khoản
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`h-9 rounded-[10px] border text-xs font-bold transition ${
                  paymentMethod === "cash"
                    ? "border-[#6e5ce8] bg-[#efecff] text-[#5e4bd5]"
                    : "border-[#e2e3ef] bg-[#fafafe] text-[#5d637a] hover:bg-white"
                }`}
              >
                Tiền mặt
              </button>
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#333752]">
              Ghi chú thu tiền
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Khách chuyển khoản Vietcombank..."
              className="h-10 w-full rounded-[10px] border border-[#e2e3ef] bg-[#fafafe] px-3.5 text-sm text-[#20243c] outline-none transition focus:border-[#6e5ce8] focus:bg-white"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-[#eeeff6] pt-3">
            <button
              type="button"
              disabled={payMutation.isPending}
              onClick={onClose}
              className="h-8 rounded-[8px] border border-[#e1e2ee] bg-white px-3 text-[11.5px] font-semibold text-[#5d637a] hover:bg-[#f6f6fb]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={payMutation.isPending}
              className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-[#6e5ce8] px-3 text-[11.5px] font-semibold text-white shadow-sm hover:bg-[#5b49d6] disabled:opacity-60"
            >
              {payMutation.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Check size={13} />
              )}
              Xác nhận thu tiền
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

