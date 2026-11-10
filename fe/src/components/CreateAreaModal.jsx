import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "antd";
import { X, Building2, MapPin, Plus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { createArea } from "../services/ereaService.js";

function CreateAreaForm({ onClose }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const createAreaMutation = useMutation({
    mutationFn: (payload) => createArea(payload),
    onSuccess: (newArea) => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      toast.success(`Đã tạo khu trọ "${newArea?.name || name}" thành công!`);
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
    <div className="relative overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#f0f0f6] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f4f3fd] text-[#6756df]">
            <Building2 size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#20243c]">
              Thêm khu trọ mới
            </h2>
            <p className="text-[11px] text-[#8c92a6]">
              Tạo khu trọ để bắt đầu quản lý dãy phòng và khách thuê
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-[#9da2b4] transition hover:bg-[#f5f6fb] hover:text-[#20243c]"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body Form */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 px-5 py-4">
          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
              {errorMessage}
            </div>
          )}

          {/* Tên khu trọ */}
          <div>
            <label className="mb-1 block text-xs font-bold text-[#35394d]">
              Tên khu trọ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9da2b4]"
              />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Khu Quận 9, Tòa nhà Lê Văn Việt..."
                className="h-9 w-full rounded-xl border border-[#e5e6ee] bg-[#f9f9fc] pl-9 pr-3 text-xs text-[#20243c] placeholder-[#9da2b4] transition focus:border-[#6756df] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Địa chỉ khu trọ */}
          <div>
            <label className="mb-1 block text-xs font-bold text-[#35394d]">
              Địa chỉ khu trọ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin
                size={14}
                className="pointer-events-none absolute left-3 top-3 text-[#9da2b4]"
              />
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="VD: 45/8 Lê Văn Việt, Tăng Nhơn Phú A, TP. Thủ Đức, TP.HCM"
                className="w-full resize-none rounded-xl border border-[#e5e6ee] bg-[#f9f9fc] py-2 pl-9 pr-3 text-xs text-[#20243c] placeholder-[#9da2b4] transition focus:border-[#6756df] focus:bg-white focus:outline-none"
              />
            </div>
            <p className="mt-1 text-[11px] text-[#9095aa]">
              Địa chỉ sẽ được dùng làm thông tin hợp đồng và chỉ dẫn cho khách thuê.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[#f0f0f6] bg-[#fafafc] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 items-center justify-center rounded-[8px] border border-[#e5e6ee] bg-white px-3 text-[11.5px] font-semibold text-[#54596e] transition-colors hover:bg-[#f6f7fb]"
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
  );
}

export default function CreateAreaModal({ isOpen, onClose }) {
  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      closable={false}
      centered
      width={480}
      destroyOnHidden
      styles={{
        content: {
          padding: 0,
          borderRadius: 20,
          overflow: "hidden",
        },
      }}
    >
      <CreateAreaForm onClose={onClose} />
    </Modal>
  );
}

