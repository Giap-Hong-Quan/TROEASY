import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Plus, Wrench, X } from "lucide-react";
import toast from "react-hot-toast";
import CustomSelect from "./CustomSelect.jsx";
import {
  createMaintenance,
  updateMaintenance,
} from "../services/maintenanceService.js";

const STATUS_OPTIONS = [
  { value: "open", label: "Chờ xử lý" },
  { value: "in_progress", label: "Đang sửa" },
  { value: "resolved", label: "Đã xong" },
];

export default function CreateMaintenanceModal({
  open,
  onClose,
  areas = [],
  rooms = [],
  defaultAreaId = "",
  editingTicket = null,
}) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(editingTicket);

  const [areaId, setAreaId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("open");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editingTicket) {
      setAreaId(String(editingTicket.areaId || ""));
      setRoomId(String(editingTicket.roomId || ""));
      setTitle(editingTicket.title || "");
      setDescription(editingTicket.description || "");
      setStatus(editingTicket.status || "open");
    } else {
      const nextArea =
        defaultAreaId || String(areas[0]?.id || areas[0]?._id || "");
      setAreaId(nextArea);
      setRoomId("");
      setTitle("");
      setDescription("");
      setStatus("open");
    }
    setErrorMessage("");
  }, [open, editingTicket, defaultAreaId, areas]);

  const areaRooms = useMemo(() => {
    if (!areaId) return rooms;
    return rooms.filter(
      (r) =>
        String(r.areaId?._id || r.areaId?.id || r.areaId) === String(areaId)
    );
  }, [rooms, areaId]);

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      isEdit
        ? updateMaintenance({ id: editingTicket.id, ...payload })
        : createMaintenance(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenances"] });
      toast.success(
        isEdit ? "Đã cập nhật phiếu bảo trì!" : "Đã thêm phiếu bảo trì mới!"
      );
      onClose?.();
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Lưu phiếu bảo trì thất bại.";
      setErrorMessage(msg);
      toast.error(msg);
    },
  });

  if (!open) return null;

  const handleAreaChange = (nextAreaId) => {
    setAreaId(nextAreaId);
    setRoomId("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!areaId) {
      setErrorMessage("Vui lòng chọn khu vực.");
      return;
    }
    if (!roomId) {
      setErrorMessage("Vui lòng chọn phòng.");
      return;
    }
    if (!title.trim()) {
      setErrorMessage("Vui lòng nhập tên bảo trì / sự cố.");
      return;
    }

    saveMutation.mutate({
      areaId,
      roomId,
      title: title.trim(),
      description: description.trim(),
      status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={() => !saveMutation.isPending && onClose?.()}
        className="absolute inset-0 bg-[#181b2e]/45 backdrop-blur-[2px]"
      />
      <section
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md overflow-visible rounded-[20px] border border-[#e7e7ef] bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#eeeff6] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#f1effe] text-[#6756df]">
              <Wrench size={18} />
            </div>
            <div>
              <h2 className="text-[17px] font-extrabold text-[#20243c]">
                {isEdit ? "Cập nhật bảo trì" : "Thêm bảo trì mới"}
              </h2>
              <p className="mt-0.5 text-xs text-[#9298aa]">
                Nhập tên sự cố, mô tả và trạng thái xử lý
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-[#8c92a6] hover:bg-[#f4f5fa] hover:text-[#20243c]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {errorMessage && (
            <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600">
              {errorMessage}
            </div>
          )}

          {/* Khu vực & Phòng */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#3e435b]">
                Khu vực <span className="text-red-500">*</span>
              </label>
              <CustomSelect
                size="lg"
                value={areaId}
                onChange={handleAreaChange}
                placeholder="-- Chọn khu --"
                options={areas.map((a) => ({
                  value: String(a.id || a._id),
                  label: a.name,
                }))}
                className="w-full"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#3e435b]">
                Phòng <span className="text-red-500">*</span>
              </label>
              <CustomSelect
                size="lg"
                value={roomId}
                onChange={(val) => setRoomId(val)}
                disabled={!areaId}
                placeholder="-- Chọn phòng --"
                options={areaRooms.map((r) => ({
                  value: String(r.id || r._id),
                  label: `${r.code}${r.row ? ` · ${r.row}` : ""}`,
                }))}
                className="w-full"
              />
            </div>
          </div>

          {/* Tên bảo trì */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#3e435b]">
              Tên bảo trì / sự cố <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Hỏng vòi nước, Điều hòa không lạnh..."
              className="h-10 w-full rounded-[10px] border border-[#e5e6ee] bg-white px-3 text-[13px] text-[#20243c] outline-none placeholder:text-[#a0a5b8] focus:border-[#6756df]"
            />
          </div>

          {/* Mô tả */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#3e435b]">
              Mô tả
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn gọn tình trạng cần sửa chữa..."
              className="w-full rounded-[10px] border border-[#e5e6ee] bg-white px-3 py-2 text-[13px] text-[#20243c] outline-none placeholder:text-[#a0a5b8] focus:border-[#6756df]"
            />
          </div>

          {/* Trạng thái */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#3e435b]">
              Trạng thái
            </label>
            <CustomSelect
              size="lg"
              value={status}
              onChange={(val) => setStatus(val)}
              options={STATUS_OPTIONS}
              className="w-full"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-[#eeeff6] pt-4">
            <button
              type="button"
              disabled={saveMutation.isPending}
              onClick={onClose}
              className="inline-flex h-8 items-center justify-center rounded-[8px] border border-[#e5e6ee] bg-white px-3 text-[11.5px] font-semibold text-[#54596e] hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="inline-flex h-8 items-center justify-center gap-1 rounded-[8px] bg-[#6756df] px-3 text-[11.5px] font-semibold text-white hover:bg-[#5b4bc7] disabled:opacity-60"
            >
              {saveMutation.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : isEdit ? (
                <Check size={13} />
              ) : (
                <Plus size={13} />
              )}
              {isEdit ? "Lưu thay đổi" : "Tạo bảo trì"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
