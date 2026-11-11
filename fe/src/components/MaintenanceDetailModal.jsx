import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Wrench, X } from "lucide-react";
import toast from "react-hot-toast";
import CustomSelect from "./CustomSelect.jsx";
import { updateMaintenance } from "../services/maintenanceService.js";

const STATUS_OPTIONS = [
  { value: "open", label: "Mới tiếp nhận (Chờ xử lý)" },
  { value: "in_progress", label: "Đang xử lý / Đang sửa" },
  { value: "resolved", label: "Đã hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Thấp" },
  { value: "medium", label: "Trung bình" },
  { value: "high", label: "Khẩn cấp" },
];

export default function MaintenanceDetailModal({ open, ticket, onClose }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("open");
  const [priority, setPriority] = useState("medium");
  const [repairCost, setRepairCost] = useState("0");
  const [technicianNote, setTechnicianNote] = useState("");

  useEffect(() => {
    if (open && ticket) {
      setStatus(ticket.status || "open");
      setPriority(ticket.priority || "medium");
      setRepairCost(String(ticket.repairCost ?? 0));
      setTechnicianNote(ticket.technicianNote || "");
    }
  }, [open, ticket]);

  const updateMutation = useMutation({
    mutationFn: updateMaintenance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenances"] });
      toast.success(`Đã cập nhật phiếu bảo trì ${ticket?.ticketCode}!`);
      onClose?.();
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          err.message ||
          "Cập nhật phiếu bảo trì thất bại."
      );
    },
  });

  if (!open || !ticket) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      id: ticket.id,
      status,
      priority,
      repairCost: Number(repairCost) || 0,
      technicianNote: technicianNote.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={() => !updateMutation.isPending && onClose?.()}
        className="absolute inset-0 bg-[#1c1f37]/45 backdrop-blur-[2px]"
      />
      <section
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-[520px] overflow-visible rounded-[20px] border border-[#e7e7ef] bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#eeeff6] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#f1effe] text-[#6756df]">
              <Wrench size={18} />
            </div>
            <div>
              <h2 className="text-[17px] font-extrabold text-[#20243c]">
                Xử lý bảo trì — {ticket.roomCode}
              </h2>
              <p className="mt-0.5 text-xs text-[#878da1]">
                {ticket.areaName} · Mã phiếu: {ticket.ticketCode}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={updateMutation.isPending}
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-[#7c8197] hover:bg-[#f4f4fb]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* Thông tin sự cố */}
          <div className="space-y-1.5 rounded-[14px] border border-[#ececf4] bg-[#fafafe] p-3.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#6b7086]">Sự cố báo cáo:</span>
              <strong className="text-[#20243c]">{ticket.title}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6b7086]">Khách thuê phòng:</span>
              <strong className="text-[#20243c]">
                {ticket.tenantName || "Chưa có người đại diện"}
                {ticket.tenantPhone ? ` (${ticket.tenantPhone})` : ""}
              </strong>
            </div>
            {ticket.description && (
              <div className="border-t border-[#e8e9f2] pt-2 text-[#4b5168]">
                <span className="font-semibold text-[#6b7086]">Mô tả: </span>
                {ticket.description}
              </div>
            )}
          </div>

          {/* Trạng thái & Mức độ ưu tiên */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#3e435b]">
                Trạng thái xử lý
              </label>
              <CustomSelect
                size="lg"
                value={status}
                onChange={(val) => setStatus(val)}
                options={STATUS_OPTIONS}
                className="w-full"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#3e435b]">
                Mức độ ưu tiên
              </label>
              <CustomSelect
                size="lg"
                value={priority}
                onChange={(val) => setPriority(val)}
                options={PRIORITY_OPTIONS}
                className="w-full"
              />
            </div>
          </div>

          {/* Chi phí sửa chữa thực tế */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#3e435b]">
              Chi phí sửa chữa thực tế (VNĐ)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={repairCost}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || /^\d*$/.test(v)) setRepairCost(v);
              }}
              placeholder="Nhập chi phí sửa chữa..."
              className="h-10 w-full rounded-[10px] border border-[#e5e6ee] bg-white px-3 text-[13px] font-bold text-[#20243c] outline-none focus:border-[#6756df]"
            />
          </div>

          {/* Ghi chú xử lý / kết quả */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#3e435b]">
              Ghi chú xử lý / Thợ sửa chữa
            </label>
            <textarea
              rows={2}
              value={technicianNote}
              onChange={(e) => setTechnicianNote(e.target.value)}
              placeholder="VD: Đã thay vòi nước mới, bảo hành 6 tháng..."
              className="w-full rounded-[10px] border border-[#e5e6ee] bg-white px-3 py-2 text-[13px] text-[#20243c] outline-none placeholder:text-[#a0a5b8] focus:border-[#6756df]"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-[#eeeff6] pt-4">
            <button
              type="button"
              disabled={updateMutation.isPending}
              onClick={onClose}
              className="h-8 rounded-[8px] border border-[#e1e2ee] bg-white px-3 text-[11.5px] font-semibold text-[#5d637a] hover:bg-[#f6f6fb]"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-[#6756df] px-3 text-[11.5px] font-semibold text-white hover:bg-[#5b4bc7] disabled:opacity-60"
            >
              {updateMutation.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Check size={13} />
              )}
              Lưu cập nhật
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

