import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "antd";
import { X, UserPlus, Phone, User, CreditCard, Calendar, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { createTenant } from "../services/tenantService.js";

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function CreateTenantForm({ area, room, onClose }) {
  const queryClient = useQueryClient();

  const areaId = area?._id || area?.id || "";
  const areaName = area?.name || "Khu vực";
  const roomId = room?._id || room?.id || "";
  const roomCode = room?.code || room?.number || "";
  const roomPrice = room?.basePrice || 0;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [depositAmount, setDepositAmount] = useState(() => (roomPrice ? String(roomPrice) : ""));
  const [startDate, setStartDate] = useState(getTodayString);
  const [isRepresentative, setIsRepresentative] = useState(true);
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const createTenantMutation = useMutation({
    mutationFn: (payload) => createTenant(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["room", roomId] });
      toast.success(`Đã thêm khách thuê vào phòng P.${roomCode}!`);
      onClose();
    },
    onError: (error) => {
      const msg =
        error.response?.data?.message ||
        "Không thể thêm khách thuê. Vui lòng thử lại.";
      setErrorMessage(msg);
      toast.error(msg);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!areaId) {
      setErrorMessage("Không xác định được khu vực của phòng.");
      return;
    }
    if (!roomId) {
      setErrorMessage("Không xác định được phòng.");
      return;
    }
    if (!fullName.trim()) {
      setErrorMessage("Vui lòng nhập họ và tên khách thuê.");
      return;
    }
    if (!phone.trim()) {
      setErrorMessage("Vui lòng nhập số điện thoại.");
      return;
    }

    const payload = {
      areaId: String(areaId),
      roomId: String(roomId),
      fullName: fullName.trim(),
      phone: phone.trim(),
      citizenId: citizenId.trim() || undefined,
      depositAmount: depositAmount ? Number(depositAmount) : 0,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      isRepresentative,
      status: "active",
      notes: notes.trim(),
    };

    createTenantMutation.mutate(payload);
  };

  return (
    <div className="relative overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#f0f0f6] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f4f3fd] text-[#6756df]">
            <UserPlus size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#20243c]">
              Thêm khách vào phòng P.{roomCode}
            </h2>
            <p className="text-[11px] text-[#8c92a6]">
              {areaName} · Nhập thông tin người thuê
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-[#8c92a6] hover:bg-[#f6f7fb] hover:text-[#20243c]"
        >
          <X size={18} />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="max-h-[calc(90vh-130px)] space-y-4 overflow-y-auto p-5 text-xs">
        {errorMessage && (
          <div className="rounded-xl border border-[#ffd0d6] bg-[#fff5f6] p-3 text-xs text-[#dd5262]">
            {errorMessage}
          </div>
        )}

        {/* Thông tin cố định: Khu & Phòng */}
        <div className="rounded-xl border border-[#e6e4fa] bg-[#f8f7ff] p-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#6c63b5]">
                Khu vực &amp; Phòng chỉ định
              </span>
              <p className="mt-0.5 text-xs font-bold text-[#20243c]">
                {areaName} &gt; <span className="text-[#6756df]">Phòng P.{roomCode}</span>
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-[#6756df]">
              <ShieldCheck size={14} />
              <span>Tự động gán</span>
            </div>
          </div>
        </div>

        {/* Họ tên & SĐT */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-bold text-[#42485e]">
              Họ và tên khách <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9da2b4]" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Nguyễn Văn A"
                className="w-full rounded-xl border border-[#e5e6ee] bg-[#fcfcff] py-2 pl-9 pr-3 text-xs text-[#20243c] focus:border-[#6756df] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-bold text-[#42485e]">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9da2b4]" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0901234567"
                className="w-full rounded-xl border border-[#e5e6ee] bg-[#fcfcff] py-2 pl-9 pr-3 text-xs text-[#20243c] focus:border-[#6756df] focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* CCCD & Tiền cọc */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-bold text-[#42485e]">
              Số CCCD / CMND
            </label>
            <div className="relative">
              <CreditCard size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9da2b4]" />
              <input
                type="text"
                value={citizenId}
                onChange={(e) => setCitizenId(e.target.value)}
                placeholder="VD: 07920100xxxx"
                className="w-full rounded-xl border border-[#e5e6ee] bg-[#fcfcff] py-2 pl-9 pr-3 text-xs text-[#20243c] focus:border-[#6756df] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-bold text-[#42485e]">
              Tiền đặt cọc (VNĐ)
            </label>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="VD: 3000000"
              min="0"
              step="50000"
              className="w-full rounded-xl border border-[#e5e6ee] bg-[#fcfcff] px-3 py-2 text-xs text-[#20243c] focus:border-[#6756df] focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Ngày bắt đầu dọn vào & Đại diện */}
        <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-bold text-[#42485e]">
              Ngày vào ở
            </label>
            <div className="relative">
              <Calendar size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9da2b4]" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-[#e5e6ee] bg-[#fcfcff] py-2 pl-9 pr-3 text-xs text-[#20243c] focus:border-[#6756df] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={isRepresentative}
                onChange={(e) => setIsRepresentative(e.target.checked)}
                className="h-4 w-4 rounded border-[#d1d5db] text-[#6756df] focus:ring-[#6756df]"
              />
              <span className="font-semibold text-[#373c52]">
                Đại diện ký hợp đồng chính
              </span>
            </label>
          </div>
        </div>

        {/* Ghi chú */}
        <div>
          <label className="mb-1 block font-bold text-[#42485e]">
            Ghi chú thêm
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="VD: Xe máy SH biển số 59X..., nuôi thú cưng..."
            className="w-full rounded-xl border border-[#e5e6ee] bg-[#fcfcff] p-2.5 text-xs text-[#20243c] focus:border-[#6756df] focus:bg-white focus:outline-none"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-[#f0f0f6] pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#e5e6ee] bg-white px-4 py-2 font-semibold text-[#54596e] hover:bg-[#f6f7fb]"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={createTenantMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#6756df] px-5 py-2 font-bold text-white shadow-sm hover:bg-[#5745c8] disabled:opacity-50"
          >
            {createTenantMutation.isPending ? "Đang lưu..." : "Lưu khách thuê"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CreateTenantModal({
  isOpen,
  onClose,
  area,
  room,
}) {
  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      closable={false}
      centered
      width={520}
      zIndex={1200}
      destroyOnHidden
      styles={{ content: { padding: 0, overflow: "hidden", borderRadius: 20 } }}
    >
      {isOpen && (
        <CreateTenantForm
          area={area}
          room={room}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}
