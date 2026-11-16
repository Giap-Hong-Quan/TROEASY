import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "antd";
import { Check, Crown, TriangleAlert, X } from "lucide-react";
import toast from "react-hot-toast";
import { updateTenant } from "../services/tenantService.js";

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function SelectRepresentativeModal({
  isOpen,
  onClose,
  candidates = [],
  roomCode = "",
  zIndex = 1350,
}) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    if (isOpen && candidates.length > 0) {
      const firstId = candidates[0]._id || candidates[0].id || "";
      setSelectedId(String(firstId));
    } else if (!isOpen) {
      setSelectedId("");
    }
  }, [isOpen, candidates]);

  const mutation = useMutation({
    mutationFn: () => updateTenant(selectedId, { isRepresentative: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Đã cập nhật người đại diện mới!");
      onClose?.();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Không thể cập nhật người đại diện.");
    },
  });

  return (
    <Modal
      open={isOpen}
      onCancel={() => !mutation.isPending && onClose?.()}
      footer={null}
      closable={false}
      centered
      width={460}
      zIndex={zIndex}
      destroyOnHidden
      styles={{ content: { padding: 0, overflow: "hidden", borderRadius: 20 } }}
    >
      <div className="bg-gradient-to-r from-[#6756df] to-[#8f74ee] px-5 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <Crown size={18} />
            </div>
            <div>
              <h3 className="text-[15px] font-extrabold leading-tight">Chọn người đại diện mới</h3>
              <p className="text-[11px] text-white/80">
                {roomCode ? `Phòng ${roomCode}` : "Mỗi phòng cần 1 người đại diện"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !mutation.isPending && onClose?.()}
            className="rounded-lg p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-3.5 bg-white p-5">
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <TriangleAlert size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <span>
            Người đại diện cũ đã trả phòng. Vui lòng chọn 1 khách đang ở bên dưới làm đại diện mới cho phòng.
          </span>
        </div>

        <div className="max-h-[260px] space-y-2 overflow-y-auto pr-0.5">
          {candidates.map((c) => {
            const cid = String(c._id || c.id);
            const active = cid === selectedId;
            return (
              <button
                key={cid}
                type="button"
                onClick={() => setSelectedId(cid)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                  active
                    ? "border-[#6756df] bg-[#f5f3ff] shadow-sm"
                    : "border-[#eceef5] bg-white hover:border-[#d5cffb] hover:bg-[#faf9ff]"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    active ? "bg-[#6756df] text-white" : "bg-[#ece8fd] text-[#6756df]"
                  }`}
                >
                  {getInitials(c.fullName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-[#20243c]">{c.fullName}</p>
                  <p className="text-[11.5px] text-[#7d8398]">{c.phone}</p>
                </div>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    active
                      ? "border-[#6756df] bg-[#6756df] text-white"
                      : "border-[#d4d8e4] bg-white text-transparent"
                  }`}
                >
                  <Check size={12} />
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#f0f0f6] pt-3">
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={onClose}
            className="inline-flex h-8 items-center justify-center rounded-[8px] border border-[#e5e6ee] bg-white px-3 text-[11.5px] font-semibold text-[#54596e] transition-colors hover:bg-slate-50"
          >
            Để sau
          </button>
          <button
            type="button"
            disabled={!selectedId || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="inline-flex h-8 items-center justify-center gap-1 rounded-[8px] bg-[#6756df] px-3.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#5b4bc7] disabled:opacity-60"
          >
            <Crown size={13} />
            {mutation.isPending ? "Đang lưu..." : "Xác nhận đại diện"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

