import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Modal, Spin } from "antd";
import {
  X,
  Phone,
  Copy,
  Check,
  Crown,
} from "lucide-react";
import toast from "react-hot-toast";
import { getTenantById } from "../services/tenantService.js";

const STATUS_CONFIG = {
  active: { label: "Đang thuê", badgeClass: "bg-[#e3f8f0] text-[#159878] border-[#a8edd8]", dotClass: "bg-[#159878]" },
  checkout: { label: "Đã trả phòng", badgeClass: "bg-[#edf0f4] text-[#8d95a1] border-[#d8dce2]", dotClass: "bg-[#8d95a1]" },
};

function formatCurrency(value) {
  if (value === undefined || value === null || value === "") return "0 đ";
  return `${Number(value).toLocaleString("vi-VN")} đ`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function TenantDetailModal({ isOpen, onClose, tenant, zIndex = 1250 }) {
  const tenantId = tenant?._id || tenant?.id;
  const [copied, setCopied] = useState(false);

  const { data: fetchedTenant, isFetching } = useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: () => getTenantById(tenantId),
    enabled: Boolean(isOpen && tenantId),
    initialData: tenant,
  });

  const currentTenant = fetchedTenant || tenant;

  if (!currentTenant && !isOpen) return null;

  const status = STATUS_CONFIG[currentTenant?.status] || STATUS_CONFIG.active;
  const room = currentTenant?.roomId;
  const roomCode = room?.code || currentTenant?.roomCode || "";
  const rowName = room?.row ? ` (${room.row})` : "";
  const area = currentTenant?.areaId;
  const areaName = area?.name || currentTenant?.areaName || "Chưa xác định";

  const handleCopyPhone = () => {
    if (!currentTenant?.phone) return;
    navigator.clipboard.writeText(currentTenant.phone);
    setCopied(true);
    toast.success("Đã sao chép số điện thoại!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      closable={false}
      centered
      width={560}
      zIndex={zIndex}
      destroyOnHidden
      styles={{
        content: {
          padding: 0,
          overflow: "hidden",
          borderRadius: 20,
          border: "1px solid #e7e7ef",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        },
      }}
    >
      {currentTenant && (
        <Spin spinning={isFetching}>
          <div className="bg-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#eeeff6] px-6 py-4">
              <div>
                <h2 className="text-lg font-extrabold text-[#20243c]">
                  Thông tin khách thuê
                </h2>
                <p className="mt-0.5 text-xs text-[#9298aa]">
                  Chi tiết hồ sơ lưu trú và hợp đồng thuê phòng
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

            {/* Modal Content */}
            <div className="space-y-4 px-6 py-5">
              {/* Khu vực & Phòng thuê */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#3e435b]">
                    Khu vực
                  </label>
                  <div className="flex h-10 w-full items-center rounded-[10px] border border-[#e5e6ee] bg-[#f7f8fc] px-3 text-[13px] font-semibold text-[#20243c]">
                    {areaName}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#3e435b]">
                    Phòng thuê
                  </label>
                  <div className="flex h-10 w-full items-center rounded-[10px] border border-[#e5e6ee] bg-[#f7f8fc] px-3 text-[13px] font-semibold text-[#6756df]">
                    {roomCode ? `Phòng P.${roomCode}${rowName}` : "Chưa phân phòng"}
                  </div>
                </div>
              </div>

              {/* Họ tên & Số điện thoại */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-bold text-[#3e435b]">
                      Họ và tên khách
                    </label>
                    {currentTenant.isRepresentative ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#fff4dc] px-1.5 py-0.5 text-[10.5px] font-bold text-[#b9822f]">
                        <Crown size={11} />
                        Đại diện hợp đồng
                      </span>
                    ) : (
                      <span className="rounded-md bg-[#f1f2f6] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#66697c]">
                        Ở cùng
                      </span>
                    )}
                  </div>
                  <div className="flex h-10 w-full items-center rounded-[10px] border border-[#e5e6ee] bg-white px-3 text-[13px] font-bold text-[#20243c]">
                    {currentTenant.fullName}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#3e435b]">
                    Số điện thoại
                  </label>
                  <div className="flex h-10 w-full items-center justify-between rounded-[10px] border border-[#e5e6ee] bg-white px-3 text-[13px] font-semibold text-[#20243c]">
                    <span className="font-mono">{currentTenant.phone || "—"}</span>
                    {currentTenant.phone && (
                      <button
                        type="button"
                        onClick={handleCopyPhone}
                        title="Sao chép số điện thoại"
                        className="rounded-md p-1 text-[#8c92a6] hover:bg-[#f4f5fa] hover:text-[#6756df]"
                      >
                        {copied ? <Check size={14} className="text-[#159878]" /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* CCCD / CMND & Trạng thái */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#3e435b]">
                    Số CCCD / CMND
                  </label>
                  <div className="flex h-10 w-full items-center rounded-[10px] border border-[#e5e6ee] bg-white px-3 text-[13px] font-mono text-[#20243c]">
                    {currentTenant.citizenId || "Chưa cập nhật"}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#3e435b]">
                    Trạng thái
                  </label>
                  <div className="flex h-10 w-full items-center justify-between rounded-[10px] border border-[#e5e6ee] bg-white px-3 text-[13px]">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${status.badgeClass}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                      {status.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tiền đặt cọc & Ngày vào ở */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#3e435b]">
                    Tiền đặt cọc
                  </label>
                  <div className="flex h-10 w-full items-center rounded-[10px] border border-[#e5e6ee] bg-[#fdfcff] px-3 text-[13px] font-extrabold text-[#6756df]">
                    {formatCurrency(currentTenant.depositAmount)}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#3e435b]">
                    Ngày vào ở
                  </label>
                  <div className="flex h-10 w-full items-center rounded-[10px] border border-[#e5e6ee] bg-white px-3 text-[13px] font-semibold text-[#20243c]">
                    {formatDate(currentTenant.startDate)}
                  </div>
                </div>
              </div>

              {/* Ghi chú thêm */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#3e435b]">
                  Ghi chú của chủ trọ
                </label>
                <div className="min-h-[58px] w-full rounded-[10px] border border-[#e5e6ee] bg-[#f7f8fc] p-3 text-xs leading-relaxed text-[#454a5e]">
                  {currentTenant.notes ? (
                    currentTenant.notes
                  ) : (
                    <span className="italic text-[#a0a5b8]">Không có ghi chú nào.</span>
                  )}
                </div>
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
                {currentTenant.phone && (
                  <a
                    href={`tel:${currentTenant.phone}`}
                    className="inline-flex h-8 items-center justify-center gap-1 rounded-[8px] bg-[#6756df] px-3 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#5b4bc7]"
                  >
                    <Phone size={13} />
                    Gọi điện
                  </a>
                )}
              </div>
            </div>
          </div>
        </Spin>
      )}
    </Modal>
  );
}
