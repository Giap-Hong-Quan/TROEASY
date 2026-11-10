import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, FilePlus2 } from "lucide-react";
import toast from "react-hot-toast";
import { createContract } from "../services/contractService.js";
import { addMonths, getId, toInputDate } from "../utils/contractHelpers.js";

const DURATION_OPTIONS = [3, 6, 12, 24];

const inputClass =
  "h-10 w-full rounded-[10px] border border-[#e5e6ee] bg-white px-3 text-[13px] text-[#20243c] outline-none placeholder:text-[#a0a5b8] focus:border-[#6756df] disabled:bg-[#f7f8fc] disabled:text-[#9298aa]";
const labelClass = "mb-1.5 block text-xs font-bold text-[#3e435b]";

function pickRepresentative(tenantList) {
  return tenantList.find((t) => t.isRepresentative) || tenantList[0] || null;
}

export default function CreateContractModal({
  isOpen,
  onClose,
  areas = [],
  rooms = [],
  tenants = [],
  busyRoomIds = new Set(),
}) {
  const queryClient = useQueryClient();
  const today = toInputDate();

  const [areaId, setAreaId] = useState(() => getId(areas[0]));
  const [roomId, setRoomId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [contractCode, setContractCode] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [duration, setDuration] = useState(12);
  const [endDate, setEndDate] = useState(() => addMonths(today, 12));
  const [rentalPrice, setRentalPrice] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [billingDay, setBillingDay] = useState("5");
  const [paymentCycle, setPaymentCycle] = useState("1");
  const [electricityPrice, setElectricityPrice] = useState("3500");
  const [waterPrice, setWaterPrice] = useState("20000");
  const [internetPrice, setInternetPrice] = useState("100000");
  const [garbagePrice, setGarbagePrice] = useState("30000");
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const areaRooms = useMemo(
    () => rooms.filter((r) => getId(r.areaId) === areaId),
    [rooms, areaId],
  );

  const roomTenants = useMemo(
    () => tenants.filter((t) => getId(t.roomId) === roomId && t.status !== "checkout"),
    [tenants, roomId],
  );

  const mutation = useMutation({
    mutationFn: createContract,
    onSuccess: (contract) => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success(`Đã tạo hợp đồng ${contract?.contractCode || ""}`);
      onClose();
    },
    onError: (error) => {
      const msg = error.response?.data?.message || "Tạo hợp đồng thất bại.";
      setErrorMessage(msg);
      toast.error(msg);
    },
  });

  if (!isOpen) return null;

  const handleAreaChange = (nextAreaId) => {
    setAreaId(nextAreaId);
    setRoomId("");
    setTenantId("");
  };

  const handleRoomChange = (nextRoomId) => {
    setRoomId(nextRoomId);
    const room = rooms.find((r) => getId(r) === nextRoomId);
    if (room && room.basePrice) {
      setRentalPrice(String(room.basePrice));
      if (!depositAmount) setDepositAmount(String(room.basePrice));
    }
    const matchingTenants = tenants.filter(
      (t) => getId(t.roomId) === nextRoomId && t.status !== "checkout",
    );
    const rep = pickRepresentative(matchingTenants);
    setTenantId(rep ? getId(rep) : "");
  };

  const handleDurationClick = (months) => {
    setDuration(months);
    if (startDate) {
      setEndDate(addMonths(startDate, months));
    }
  };

  const handleStartDateChange = (val) => {
    setStartDate(val);
    if (duration && val) {
      setEndDate(addMonths(val, duration));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!areaId) {
      setErrorMessage("Vui lòng chọn khu vực.");
      return;
    }
    if (!roomId) {
      setErrorMessage("Vui lòng chọn phòng thuê.");
      return;
    }
    if (!tenantId) {
      setErrorMessage("Vui lòng chọn người đại diện ký hợp đồng.");
      return;
    }
    if (!startDate || !endDate) {
      setErrorMessage("Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc.");
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setErrorMessage("Ngày kết thúc phải sau ngày bắt đầu.");
      return;
    }
    if (!rentalPrice || Number(rentalPrice) <= 0) {
      setErrorMessage("Giá thuê phòng phải lớn hơn 0.");
      return;
    }

    const payload = {
      areaId,
      roomId,
      tenantId,
      startDate,
      endDate,
      rentalPrice: Number(rentalPrice),
      depositAmount: Number(depositAmount || 0),
      billingDay: Number(billingDay || 5),
      paymentCycle: Number(paymentCycle || 1),
      serviceFees: {
        electricityPrice: Number(electricityPrice || 0),
        waterPrice: Number(waterPrice || 0),
        internetPrice: Number(internetPrice || 0),
        garbagePrice: Number(garbagePrice || 0),
      },
      notes: notes.trim(),
    };
    if (contractCode.trim()) payload.contractCode = contractCode.trim();

    mutation.mutate(payload);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#181b2e]/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[20px] border border-[#e7e7ef] bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#eeeff6] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#f1effe] text-[#6756df]">
              <FilePlus2 size={18} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#20243c]">Tạo hợp đồng mới</h2>
              <p className="mt-0.5 text-xs text-[#9298aa]">Lập hợp đồng thuê phòng cho khách</p>
            </div>
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {/* Khu vực & Phòng */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>
                Khu vực <span className="text-red-500">*</span>
              </label>
              <select value={areaId} onChange={(e) => handleAreaChange(e.target.value)} className={inputClass}>
                <option value="">-- Chọn khu vực --</option>
                {areas.map((a) => (
                  <option key={getId(a)} value={getId(a)}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>
                Phòng <span className="text-red-500">*</span>
              </label>
              <select
                value={roomId}
                onChange={(e) => handleRoomChange(e.target.value)}
                disabled={!areaId}
                className={inputClass}
              >
                <option value="">-- Chọn phòng --</option>
                {areaRooms.map((r) => {
                  const busy = busyRoomIds.has(getId(r));
                  return (
                    <option key={getId(r)} value={getId(r)} disabled={busy}>
                      {r.code}
                      {r.row ? ` · ${r.row}` : ""}
                      {busy ? " (đã có HĐ)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Người đại diện & Mã HĐ */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>
                Người đại diện ký <span className="text-red-500">*</span>
              </label>
              <select
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                disabled={!roomId}
                className={inputClass}
              >
                <option value="">
                  {roomId && roomTenants.length === 0 ? "Phòng chưa có người thuê" : "-- Chọn người thuê --"}
                </option>
                {roomTenants.map((t) => (
                  <option key={getId(t)} value={getId(t)}>
                    {t.fullName}
                    {t.isRepresentative ? " (Đại diện)" : ""}
                  </option>
                ))}
              </select>
              {roomId && roomTenants.length === 0 && (
                <p className="mt-1 text-[11px] text-[#d4515e]">
                  Thêm người thuê vào phòng ở Sơ đồ phòng trước khi lập hợp đồng.
                </p>
              )}
            </div>
            <div>
              <label className={labelClass}>Mã hợp đồng</label>
              <input
                value={contractCode}
                onChange={(e) => setContractCode(e.target.value)}
                placeholder="Để trống để tự sinh mã"
                className={`${inputClass} uppercase placeholder:normal-case`}
              />
            </div>
          </div>

          {/* Thời hạn */}
          <div>
            <label className={labelClass}>Thời hạn thuê</label>
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {DURATION_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleDurationClick(m)}
                  className={`rounded-full border px-3 py-1 text-[11.5px] font-semibold transition ${
                    duration === m
                      ? "border-[#6756df] bg-[#6756df] text-white"
                      : "border-[#e5e6ee] bg-white text-[#66697c] hover:border-[#c7befb] hover:text-[#6756df]"
                  }`}
                >
                  {m} tháng
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <span className="mb-1 block text-[11px] font-semibold text-[#8c92a6]">Ngày bắt đầu</span>
                <input type="date" value={startDate} onChange={(e) => handleStartDateChange(e.target.value)} className={inputClass} />
              </div>
              <div>
                <span className="mb-1 block text-[11px] font-semibold text-[#8c92a6]">Ngày kết thúc</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDuration(null);
                  }}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Giá thuê & Tiền cọc */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>
                Giá thuê / tháng (VNĐ) <span className="text-red-500">*</span>
              </label>
              <input type="number" min="0" step="50000" value={rentalPrice} onChange={(e) => setRentalPrice(e.target.value)} placeholder="VD: 3500000" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Tiền đặt cọc (VNĐ)</label>
              <input type="number" min="0" step="50000" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="VD: 3500000" className={inputClass} />
            </div>
          </div>

          {/* Thanh toán */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Ngày thu tiền hàng tháng</label>
              <input type="number" min="1" max="31" value={billingDay} onChange={(e) => setBillingDay(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Chu kỳ thanh toán</label>
              <select value={paymentCycle} onChange={(e) => setPaymentCycle(e.target.value)} className={inputClass}>
                <option value="1">1 tháng / lần</option>
                <option value="2">2 tháng / lần</option>
                <option value="3">3 tháng / lần</option>
                <option value="6">6 tháng / lần</option>
              </select>
            </div>
          </div>

          {/* Phí dịch vụ */}
          <div>
            <label className={labelClass}>Đơn giá dịch vụ</label>
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-[#eeeff6] bg-[#fafafd] p-3 sm:grid-cols-4">
              {[
                ["Điện (đ/kWh)", electricityPrice, setElectricityPrice],
                ["Nước (đ/m³)", waterPrice, setWaterPrice],
                ["Internet (đ/th)", internetPrice, setInternetPrice],
                ["Rác (đ/th)", garbagePrice, setGarbagePrice],
              ].map(([label, value, setter]) => (
                <div key={label}>
                  <span className="mb-1 block text-[10.5px] font-semibold text-[#8c92a6]">{label}</span>
                  <input
                    type="number"
                    min="0"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#e5e6ee] bg-white px-2.5 text-[12.5px] text-[#20243c] outline-none focus:border-[#6756df]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className={labelClass}>Điều khoản / ghi chú</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Không nuôi thú cưng, báo trước 30 ngày khi trả phòng..."
              className="w-full rounded-[10px] border border-[#e5e6ee] bg-white px-3 py-2 text-[13px] text-[#20243c] outline-none placeholder:text-[#a0a5b8] focus:border-[#6756df]"
            />
          </div>

          {errorMessage && (
            <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600">{errorMessage}</p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-[#eeeff6] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="inline-flex h-8 items-center justify-center rounded-[8px] border border-[#e5e6ee] bg-white px-3 text-[11.5px] font-semibold text-[#54596e] transition-colors hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex h-8 items-center justify-center gap-1 rounded-[8px] bg-[#6756df] px-3 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#5b4bc7] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FilePlus2 size={13} />
              {mutation.isPending ? "Đang tạo..." : "Tạo hợp đồng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
