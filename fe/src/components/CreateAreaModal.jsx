import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { createArea } from "../services/ereaService.js";

export default function CreateAreaModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const createAreaMutation = useMutation({
    mutationFn: (payload) => createArea(payload),
    onSuccess: (newArea) => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      toast.success(`Đã tạo khu trọ "${newArea?.name || name}" thành công!`);
      setName("");
      setAddress("");
      setErrorMessage("");
      onClose();
    },
    onError: (error) => {
      const msg =
        error.response?.data?.message ||
        "Không thể tạo khu trọ. Vui lòng thử lại.";
      setErrorMessage(msg);
      toast.error(msg);
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage("Vui lòng nhập tên khu trọ.");
      return;
    }

    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      setErrorMessage("Vui lòng nhập địa chỉ khu trọ.");
      return;
    }

    createAreaMutation.mutate({
      name: trimmedName,
      address: trimmedAddress,
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
              Thêm khu trọ mới
            </h2>
            <p className="mt-0.5 text-xs text-[#9298aa]">
              Tạo khu trọ để bắt đầu quản lý dãy phòng và khách thuê
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

          {/* Tên khu trọ */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#3e435b]">
              Tên khu trọ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Khu Quận 9, Tòa nhà Lê Văn Việt..."
              className="h-10 w-full rounded-[10px] border border-[#e5e6ee] bg-white px-3 text-[13px] text-[#20243c] outline-none placeholder:text-[#a0a5b8] focus:border-[#6756df]"
            />
          </div>

          {/* Địa chỉ khu trọ */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#3e435b]">
              Địa chỉ khu trọ <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="VD: 45/8 Lê Văn Việt, Tăng Nhơn Phú A, TP. Thủ Đức, TP.HCM"
              className="w-full rounded-[10px] border border-[#e5e6ee] bg-white px-3 py-2 text-[13px] text-[#20243c] outline-none placeholder:text-[#a0a5b8] focus:border-[#6756df]"
            />
            <p className="mt-1 text-[11px] text-[#9095aa]">
              Địa chỉ sẽ được dùng làm thông tin hợp đồng và chỉ dẫn cho khách thuê.
            </p>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-[#eeeff6] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={createAreaMutation.isPending}
              className="inline-flex h-8 items-center justify-center rounded-[8px] border border-[#e5e6ee] bg-white px-3 text-[11.5px] font-semibold text-[#54596e] transition-colors hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={createAreaMutation.isPending}
              className="inline-flex h-8 items-center justify-center gap-1 rounded-[8px] bg-[#6756df] px-3 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#5b4bc7] active:scale-[0.98] disabled:opacity-60"
            >
              {createAreaMutation.isPending ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Đang tạo khu...
                </>
              ) : (
                <>
                  <Plus size={13} />
                  Tạo khu trọ
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
