import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal, Spin, Tag, Empty } from "antd";
import toast from "react-hot-toast";
import {
  X,
  Banknote,
  Sparkles,
  UserPlus,
  Users,
  Phone,
  CreditCard,
  MapPin,
  Layers,
  CalendarClock,
  Crown,
  DoorOpen,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import CreateTenantModal from "./CreateTenantModal.jsx";
import { deleteRoom, getRoomById } from "../services/roomService.js";
import { getTenants } from "../services/tenantService.js";

const STATUS_CONFIG = {
  vacant: { name: "Trống", dot: "bg-[#e0636f]", badge: "bg-[#ffedf0] text-[#d4515e]" },
  renting: { name: "Đang thuê", dot: "bg-[#1aa37f]", badge: "bg-[#e3f8f0] text-[#159878]" },
  deposit: { name: "Đã cọc", dot: "bg-[#6b59da]", badge: "bg-[#efedff] text-[#6b59da]" },
  repair: { name: "Đang sửa", dot: "bg-[#d39a3c]", badge: "bg-[#fff2de] text-[#b9822f]" },
  stop: { name: "Tạm ngưng", dot: "bg-[#9aa1ad]", badge: "bg-[#edf0f4] text-[#7f8794]" },
};

const formatMoney = (value) => {
  if (value === undefined || value === null || value === "") return "Chưa cập nhật";
  return `${Number(value).toLocaleString("vi-VN")} đ`;
};

const formatDate = (dateStr, withTime = false) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(-2).map((p) => p[0]).join("").toUpperCase();
};

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-[#f0f0f6] bg-[#fcfcfe] px-3 py-2.5">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f1effe] text-[#6756df]">
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-wide text-[#9da2b4]">{label}</p>
        <p className="mt-0.5 break-words text-xs font-semibold text-[#20243c]">{value}</p>
      </div>
    </div>
  );
}

export default function RoomDetailModal({ isOpen, onClose, room, area, rowLabel }) {
  const roomId = room?.id || room?._id;
  const queryClient = useQueryClient();
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const deleteRoomMutation = useMutation({
    mutationFn: () => deleteRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.removeQueries({ queryKey: ["room", roomId] });
      toast.success(`Đã xóa phòng ${room?.code || ""}.`);
      setIsConfirmDeleteOpen(false);
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Không thể xóa phòng. Vui lòng thử lại.");
    },
  });

  const { data: fetchedRoom, isFetching: isFetchingRoom } = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => getRoomById(roomId),
    enabled: Boolean(isOpen && roomId),
    initialData: room,
  });

  const { data: tenants = [], isFetching: isFetchingTenants } = useQuery({
    queryKey: ["tenants", { roomId }],
    queryFn: () => getTenants({ roomId }),
    enabled: Boolean(isOpen && roomId),
  });

  const currentRoom = fetchedRoom || room;
  const code = currentRoom?.code || currentRoom?.number || "—";
  const status = STATUS_CONFIG[currentRoom?.status] || STATUS_CONFIG.vacant;
  const rowName = rowLabel || currentRoom?.row || "Chưa phân dãy";
  const assets = Array.isArray(currentRoom?.assets) ? currentRoom.assets : [];
  const totalDeposit = tenants.reduce((sum, t) => sum + (Number(t.depositAmount) || 0), 0);

  // Đại diện hợp đồng luôn đứng đầu danh sách
  const sortedTenants = [...tenants].sort(
    (a, b) => Number(b.isRepresentative) - Number(a.isRepresentative)
  );

  return (
    <>
      <Modal
        open={isOpen}
        onCancel={onClose}
        footer={null}
        closable={false}
        centered
        width={860}
        destroyOnHidden
        styles={{ content: { padding: 0, overflow: "hidden", borderRadius: 20 } }}
      >
        {currentRoom && (
          <Spin spinning={isFetchingRoom || isFetchingTenants}>
            {/* ===== HEADER ===== */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#6756df] via-[#7a63e6] to-[#9c75f0] px-6 pb-5 pt-5 text-white">
              <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -bottom-16 right-24 h-32 w-32 rounded-full bg-white/10" />

              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng"
                className="absolute right-4 top-4 rounded-lg p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="relative flex flex-wrap items-end justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
                    <DoorOpen size={26} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-[22px] font-extrabold leading-tight tracking-tight">
                        Phòng {code}
                      </h2>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#20243c]">
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                        {status.name}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-white/85">
                      <MapPin size={12} />
                      {area?.name || "Khu trọ"} · {rowName}
                    </p>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="flex gap-2">
                  <div className="rounded-xl bg-white/15 px-3.5 py-2 ring-1 ring-white/20 backdrop-blur">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-white/75">Giá thuê</p>
                    <p className="text-sm font-extrabold">
                      {formatMoney(currentRoom.basePrice)}
                      <span className="text-[10px] font-medium text-white/75"> /tháng</span>
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/15 px-3.5 py-2 ring-1 ring-white/20 backdrop-blur">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-white/75">Người ở</p>
                    <p className="text-sm font-extrabold">{tenants.length} người</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== BODY ===== */}
            <div className="grid max-h-[65vh] grid-cols-1 gap-5 overflow-y-auto bg-white p-6 md:grid-cols-5">
              {/* LEFT: Người thuê */}
              <section className="md:col-span-3">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-[#20243c]">
                    <Users size={16} className="text-[#6756df]" />
                    Người thuê phòng
                    <span className="rounded-md bg-[#f1effe] px-1.5 py-0.5 text-[11px] font-bold text-[#6756df]">
                      {tenants.length}
                    </span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddTenantOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#6756df] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#5645ce] active:scale-[0.98]"
                  >
                    <UserPlus size={14} />
                    Thêm người
                  </button>
                </div>

                {sortedTenants.length > 0 ? (
                  <div className="space-y-2">
                    {sortedTenants.map((tenant) => (
                      <div
                        key={tenant._id}
                        className={`group flex items-center gap-3 rounded-xl border p-3 transition hover:shadow-sm ${
                          tenant.isRepresentative
                            ? "border-[#dcd6fb] bg-[#faf9ff]"
                            : "border-[#f0f0f6] bg-white hover:border-[#e4e1f8]"
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                            tenant.isRepresentative
                              ? "bg-gradient-to-tr from-[#6756df] to-[#9c75f0]"
                              : "bg-gradient-to-tr from-[#94a3b8] to-[#b6c0cf]"
                          }`}
                        >
                          {getInitials(tenant.fullName)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-[13px] font-bold text-[#20243c]">{tenant.fullName}</p>
                            {tenant.isRepresentative && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-[#fff4dc] px-1.5 py-0.5 text-[10px] font-bold text-[#b9822f]">
                                <Crown size={10} />
                                Đại diện
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[#7d8398]">
                            <span className="inline-flex items-center gap-1">
                              <Phone size={11} /> {tenant.phone || "—"}
                            </span>
                            {tenant.citizenId && (
                              <span className="inline-flex items-center gap-1">
                                <CreditCard size={11} /> {tenant.citizenId}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <CalendarClock size={11} /> {formatDate(tenant.startDate)}
                            </span>
                          </div>
                        </div>

                        {tenant.depositAmount > 0 && (
                          <div className="shrink-0 text-right">
                            <p className="text-[10px] text-[#9da2b4]">Tiền cọc</p>
                            <p className="text-xs font-bold text-[#6756df]">{formatMoney(tenant.depositAmount)}</p>
                          </div>
                        )}
                      </div>
                    ))}

                    {totalDeposit > 0 && (
                      <div className="flex items-center justify-between rounded-xl bg-[#f6f7fb] px-3 py-2 text-xs">
                        <span className="font-semibold text-[#7d8398]">Tổng tiền cọc đang giữ</span>
                        <span className="font-extrabold text-[#20243c]">{formatMoney(totalDeposit)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#dfe1eb] bg-[#fcfcfe] px-4 py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1effe] text-[#6756df]">
                      <Users size={22} />
                    </div>
                    <p className="mt-3 text-xs font-semibold text-[#20243c]">Phòng chưa có người ở</p>
                    <p className="mt-0.5 text-[11px] text-[#9095aa]">Thêm người thuê để bắt đầu quản lý phòng này.</p>
                    <button
                      type="button"
                      onClick={() => setIsAddTenantOpen(true)}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#dcd6fb] bg-white px-3 py-1.5 text-xs font-bold text-[#6756df] transition hover:bg-[#f8f7ff]"
                    >
                      <UserPlus size={13} /> Thêm người thuê
                    </button>
                  </div>
                )}
              </section>

              {/* RIGHT: Thông tin phòng */}
              <aside className="space-y-4 md:col-span-2">
                <div>
                  <h3 className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.8px] text-[#9da2b4]">
                    Thông tin phòng
                  </h3>
                  <div className="space-y-2">
                    <InfoItem icon={Banknote} label="Giá thuê cơ bản" value={`${formatMoney(currentRoom.basePrice)} / tháng`} />
                    <InfoItem icon={Layers} label="Dãy phòng" value={rowName} />
                    <InfoItem icon={MapPin} label="Địa chỉ" value={area?.address || area?.name || "—"} />
                    <InfoItem icon={CalendarClock} label="Cập nhật cuối" value={formatDate(currentRoom.updatedAt, true)} />
                  </div>
                </div>

                <div>
                  <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.8px] text-[#9da2b4]">
                    <Sparkles size={13} className="text-[#6756df]" />
                    Tiện ích & nội thất ({assets.length})
                  </h3>
                  {assets.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {assets.map((item) => (
                        <Tag key={item} className="m-0 rounded-lg border-[#e4e1f8] bg-[#f8f7ff] px-2.5 py-0.5 text-[11px] font-semibold text-[#5644d8]">
                          {item}
                        </Tag>
                      ))}
                    </div>
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có tiện ích" className="my-1" />
                  )}
                </div>
              </aside>
            </div>

            {/* ===== FOOTER ===== */}
            <div className="flex items-center justify-between gap-3 border-t border-[#f0f0f6] bg-[#fafafc] px-6 py-3.5">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#ffd0d6] bg-white px-3 py-1.5 text-xs font-bold text-[#dd5262] transition hover:bg-[#fff1f3]"
              >
                <Trash2 size={14} />
                Xóa phòng
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#e5e6ee] bg-white px-4 py-1.5 text-xs font-semibold text-[#54596e] transition hover:bg-[#f3f4f8]"
              >
                Đóng
              </button>
            </div>
          </Spin>
        )}
      </Modal>

      {/* ===== XÁC NHẬN XÓA PHÒNG ===== */}
      <Modal
        open={isConfirmDeleteOpen}
        onCancel={() => !deleteRoomMutation.isPending && setIsConfirmDeleteOpen(false)}
        footer={null}
        closable={false}
        centered
        width={400}
        zIndex={1100}
        styles={{ content: { borderRadius: 18, padding: 24 } }}
      >
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#ffedf0] text-[#dd5262]">
            <TriangleAlert size={24} />
          </div>
          <h3 className="mt-3 text-base font-extrabold text-[#20243c]">Xóa phòng {code}?</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-[#7d8398]">
            Phòng sẽ bị xóa vĩnh viễn khỏi {area?.name || "khu trọ"}.
            {tenants.length > 0 && (
              <>
                {" "}Thông tin của <span className="font-bold text-[#6756df]">{tenants.length} người thuê</span> vẫn được giữ lại trong danh sách khách thuê (chuyển sang trạng thái chưa gán phòng).
              </>
            )}
          </p>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              disabled={deleteRoomMutation.isPending}
              onClick={() => setIsConfirmDeleteOpen(false)}
              className="flex-1 rounded-xl border border-[#e5e6ee] bg-white py-2 text-xs font-semibold text-[#54596e] transition hover:bg-[#f6f7fb] disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={deleteRoomMutation.isPending}
              onClick={() => deleteRoomMutation.mutate()}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#e0566a] py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#cc4459] disabled:opacity-60"
            >
              <Trash2 size={13} />
              {deleteRoomMutation.isPending ? "Đang xóa..." : "Xóa phòng"}
            </button>
          </div>
        </div>
      </Modal>

      <CreateTenantModal
        isOpen={isAddTenantOpen}
        onClose={() => setIsAddTenantOpen(false)}
        area={area}
        room={currentRoom}
      />
    </>
  );
}

