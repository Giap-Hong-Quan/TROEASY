import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal, Spin } from "antd";
import { X, FileText, CalendarPlus, FileX2, Trash2, TriangleAlert, Crown } from "lucide-react";
import toast from "react-hot-toast";
import { deleteContract, getContractById, updateContract } from "../services/contractService.js";
import { CONTRACT_STATUS, addMonths, daysUntil, formatDate, formatMoney, getId } from "../utils/contractHelpers.js";

const fieldClass =
  "flex h-10 w-full items-center rounded-[10px] border border-[#e5e6ee] bg-white px-3 text-[13px] font-semibold text-[#20243c]";
const mutedFieldClass =
  "flex h-10 w-full items-center rounded-[10px] border border-[#e5e6ee] bg-[#f7f8fc] px-3 text-[13px] font-semibold text-[#20243c]";
const labelClass = "mb-1.5 block text-xs font-bold text-[#3e435b]";

const CONFIRM_TEXT = {
  terminate: {
    title: "Thanh lý hợp đồng?",
    desc: "Hợp đồng sẽ chuyển sang trạng thái Đã thanh lý và phòng không còn gắn với hợp đồng này.",
    button: "Thanh lý",
  },
  delete: {
    title: "Xóa hợp đồng?",
    desc: "Hợp đồng sẽ bị xóa vĩnh viễn khỏi hệ thống. Thông tin phòng và khách thuê vẫn được giữ nguyên.",
    button: "Xóa hợp đồng",
  },
};

export default function ContractDetailModal({ isOpen, onClose, contract }) {
  const queryClient = useQueryClient();
  const contractId = getId(contract);
  const [confirmAction, setConfirmAction] = useState(null);

  const { data: fetched, isFetching } = useQuery({
    queryKey: ["contract", contractId],
    queryFn: () => getContractById(contractId),
    enabled: Boolean(isOpen && contractId),
    initialData: contract,
  });

  const current = fetched || contract;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["contracts"] });
    queryClient.invalidateQueries({ queryKey: ["contract", contractId] });
    queryClient.invalidateQueries({ queryKey: ["rooms"] });
  };

  const updateMutation = useMutation({
    mutationFn: (payload) => updateContract(contractId, payload),
    onSuccess: (_, payload) => {
      refresh();
      toast.success(payload.status === "terminated" ? "Đã thanh lý hợp đồng." : "Đã gia hạn hợp đồng.");
      setConfirmAction(null);
    },
    onError: (error) => toast.error(error.response?.data?.message || "Cập nhật hợp đồng thất bại."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteContract(contractId),
    onSuccess: () => {
      refresh();
      toast.success("Đã xóa hợp đồng.");
      setConfirmAction(null);
      onClose();
    },
    onError: (error) => toast.error(error.response?.data?.message || "Xóa hợp đồng thất bại."),
  });

  const isBusy = updateMutation.isPending || deleteMutation.isPending;

  if (!current) return null;

  const status = CONTRACT_STATUS[current.status] || CONTRACT_STATUS.active;
  const remain = daysUntil(current.endDate);
  const fees = current.serviceFees || {};
  const canExtend = current.status === "active" || current.status === "expired";

  const handleExtend = (months) => {
    updateMutation.mutate({ endDate: addMonths(current.endDate, months), status: "active" });
  };

  const handleConfirm = () => {
    if (confirmAction === "terminate") updateMutation.mutate({ status: "terminated" });
    if (confirmAction === "delete") deleteMutation.mutate();
  };

  return (
    <>
      <Modal
        open={isOpen}
        onCancel={onClose}
        footer={null}
        closable={false}
        centered
        width={620}
        destroyOnHidden
        styles={{ content: { padding: 0, overflow: "hidden", borderRadius: 20 } }}
      >
        <Spin spinning={isFetching}>
          <div className="bg-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#eeeff6] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#f1effe] text-[#6756df]">
                  <FileText size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-[#20243c]">{current.contractCode}</h2>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${status.badgeClass}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                      {status.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#9298aa]">Chi tiết hợp đồng thuê phòng</p>
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

            <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
              {/* Cảnh báo sắp hết hạn */}
              {current.status === "active" && remain !== null && remain <= 30 && (
                <div className={`rounded-xl border px-3.5 py-2.5 text-xs font-semibold ${
                  remain < 0 ? "border-[#ffd0d6] bg-[#fff5f6] text-[#d4515e]" : "border-[#fae0b8] bg-[#fff8ec] text-[#b9822f]"
                }`}>
                  {remain < 0
                    ? `Hợp đồng đã quá hạn ${Math.abs(remain)} ngày. Hãy gia hạn hoặc thanh lý.`
                    : `Hợp đồng sẽ hết hạn sau ${remain} ngày.`}
                </div>
              )}

              {/* Khu vực & Phòng */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Khu vực</label>
                  <div className={mutedFieldClass}>{current.areaId?.name || "—"}</div>
                </div>
                <div>
                  <label className={labelClass}>Phòng</label>
                  <div className={`${mutedFieldClass} text-[#6756df]`}>
                    {current.roomId?.code ? `Phòng ${current.roomId.code}${current.roomId.row ? ` · ${current.roomId.row}` : ""}` : "Phòng đã bị xóa"}
                  </div>
                </div>
              </div>

              {/* Người đại diện */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Người đại diện ký</label>
                  <div className={`${fieldClass} gap-1.5`}>
                    <Crown size={13} className="text-[#b9822f]" />
                    {current.tenantId?.fullName || "—"}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Số điện thoại</label>
                  <div className={`${fieldClass} font-mono`}>{current.tenantId?.phone || "—"}</div>
                </div>
              </div>

              {/* Thời hạn */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Ngày bắt đầu</label>
                  <div className={fieldClass}>{formatDate(current.startDate)}</div>
                </div>
                <div>
                  <label className={labelClass}>Ngày kết thúc</label>
                  <div className={`${fieldClass} justify-between`}>
                    <span>{formatDate(current.endDate)}</span>
                    {current.status === "active" && remain !== null && remain >= 0 && (
                      <span className="text-[11px] font-medium text-[#8c92a6]">còn {remain} ngày</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tiền */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Giá thuê / tháng</label>
                  <div className={`${fieldClass} font-extrabold text-[#6756df]`}>{formatMoney(current.rentalPrice)}</div>
                </div>
                <div>
                  <label className={labelClass}>Tiền đặt cọc</label>
                  <div className={fieldClass}>{formatMoney(current.depositAmount)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Ngày thu tiền</label>
                  <div className={fieldClass}>Ngày {current.billingDay || 5} hàng tháng</div>
                </div>
                <div>
                  <label className={labelClass}>Chu kỳ thanh toán</label>
                  <div className={fieldClass}>{current.paymentCycle || 1} tháng / lần</div>
                </div>
              </div>

              {/* Dịch vụ */}
              <div>
                <label className={labelClass}>Đơn giá dịch vụ</label>
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-[#eeeff6] bg-[#fafafd] p-3 sm:grid-cols-4">
                  {[
                    ["Điện", fees.electricityPrice, "/kWh"],
                    ["Nước", fees.waterPrice, "/m³"],
                    ["Internet", fees.internetPrice, "/tháng"],
                    ["Rác", fees.garbagePrice, "/tháng"],
                  ].map(([label, value, unit]) => (
                    <div key={label}>
                      <p className="text-[10.5px] font-semibold text-[#8c92a6]">{label}</p>
                      <p className="mt-0.5 text-[12.5px] font-bold text-[#20243c]">
                        {formatMoney(value)}
                        <span className="text-[10px] font-medium text-[#9298aa]"> {unit}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className={labelClass}>Điều khoản / ghi chú</label>
                <div className="min-h-[52px] rounded-[10px] border border-[#e5e6ee] bg-[#f7f8fc] p-3 text-xs leading-relaxed text-[#454a5e]">
                  {current.notes || <span className="italic text-[#a0a5b8]">Không có ghi chú.</span>}
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-[#eeeff6] pt-4">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => setConfirmAction("delete")}
                  className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-[#ffd0d6] bg-white px-3.5 text-xs font-bold text-[#dd5262] transition hover:bg-[#fff1f3] disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Xóa
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  {current.status === "active" && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => setConfirmAction("terminate")}
                      className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-[#e5e6ee] bg-white px-3.5 text-xs font-bold text-[#66697c] transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      <FileX2 size={14} />
                      Thanh lý
                    </button>
                  )}
                  {canExtend && (
                    <>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleExtend(6)}
                        className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-[#dcd6fb] bg-[#f8f7ff] px-3.5 text-xs font-bold text-[#6756df] transition hover:bg-[#efecff] disabled:opacity-50"
                      >
                        <CalendarPlus size={14} />
                        +6 tháng
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleExtend(12)}
                        className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#6756df] px-4 text-xs font-bold text-white shadow-[0_6px_15px_rgba(103,86,223,0.18)] transition hover:bg-[#5b4bc7] disabled:opacity-50"
                      >
                        <CalendarPlus size={14} />
                        Gia hạn 12 tháng
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Spin>
      </Modal>

      {/* Xác nhận thanh lý / xóa */}
      <Modal
        open={Boolean(confirmAction)}
        onCancel={() => !isBusy && setConfirmAction(null)}
        footer={null}
        closable={false}
        centered
        width={400}
        zIndex={1100}
        styles={{ content: { borderRadius: 18, padding: 24 } }}
      >
        {confirmAction && (
          <div className="text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#ffedf0] text-[#dd5262]">
              <TriangleAlert size={24} />
            </div>
            <h3 className="mt-3 text-base font-extrabold text-[#20243c]">{CONFIRM_TEXT[confirmAction].title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[#7d8398]">{CONFIRM_TEXT[confirmAction].desc}</p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setConfirmAction(null)}
                className="flex-1 rounded-xl border border-[#e5e6ee] bg-white py-2 text-xs font-semibold text-[#54596e] transition hover:bg-[#f6f7fb] disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={handleConfirm}
                className="flex-1 rounded-xl bg-[#e0566a] py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#cc4459] disabled:opacity-60"
              >
                {isBusy ? "Đang xử lý..." : CONFIRM_TEXT[confirmAction].button}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

