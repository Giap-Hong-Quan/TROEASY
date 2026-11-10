import { useMemo, useState } from "react";
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
  ChevronRight,
  Pencil,
  Check,
  Plus,
} from "lucide-react";
import CreateTenantModal from "./CreateTenantModal.jsx";
import TenantDetailModal from "./TenantDetailModal.jsx";
import { deleteRoom, getRoomById, updateRoom } from "../services/roomService.js";
import { getTenants } from "../services/tenantService.js";

const STATUS_CONFIG = {
  vacant: { name: "Trống", dot: "bg-[#e0636f]", badge: "bg-[#ffedf0] text-[#d4515e]" },
  renting: { name: "Đang thuê", dot: "bg-[#1aa37f]", badge: "bg-[#e3f8f0] text-[#159878]" },
  deposit: { name: "Đã cọc", dot: "bg-[#6b59da]", badge: "bg-[#efedff] text-[#6b59da]" },
  repair: { name: "Đang sửa", dot: "bg-[#d39a3c]", badge: "bg-[#fff2de] text-[#b9822f]" },
  stop: { name: "Tạm ngưng", dot: "bg-[#9aa1ad]", badge: "bg-[#edf0f4] text-[#7f8794]" },
};

const SUGGESTED_ASSETS = [
  "Điều hòa",
  "Bình nóng lạnh",
  "Tủ lạnh",
  "Gác lửng",
  "Kệ bếp",
  "Giường nệm",
  "Tủ quần áo",
  "Wifi",
];

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

export default function RoomDetailModal({
  isOpen,
  onClose,
  room,
  area,
  rowLabel,
  rows = [],
}) {
  const roomId = room?.id || room?._id;
  const queryClient = useQueryClient();

  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [selectedTenantDetail, setSelectedTenantDetail] = useState(null);

  // State chế độ chỉnh sửa trực tiếp
  const [isEditing, setIsEditing] = useState(false);
  const [editCode, setEditCode] = useState("");
  const [editRowId, setEditRowId] = useState("");
  const [editBasePrice, setEditBasePrice] = useState("");
  const [editStatus, setEditStatus] = useState("vacant");
  const [editAssets, setEditAssets] = useState([]);
  const [customAssetInput, setCustomAssetInput] = useState("");

  const deleteRoomMutation = useMutation({
    mutationFn: () => deleteRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.removeQueries({ queryKey: ["room", roomId] });
      toast.success(`Đã xóa phòng ${room?.code || ""}.`);
      setIsConfirmDeleteOpen(false);
      handleModalClose();
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

  // Lấy danh sách các dãy thuộc khu vực hiện tại
  const currentAreaId = area?.id || area?._id || currentRoom?.areaId;
  const areaRows = useMemo(() => {
    if (!currentAreaId || !Array.isArray(rows)) return [];
    return rows
      .filter((r) => String(r.areaId) === String(currentAreaId) && r.isActive !== false)
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", "vi", { numeric: true }));
  }, [rows, currentAreaId]);

  // Mutation cập nhật thông tin phòng
  const updateRoomMutation = useMutation({
    mutationFn: (payload) => updateRoom(roomId, payload),
    onSuccess: (updatedRoom) => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["room", roomId] });
      toast.success(`Đã cập nhật thông tin phòng ${updatedRoom?.code || editCode}!`);
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Không thể cập nhật phòng. Vui lòng thử lại.");
    },
  });

  // Khởi tạo form khi chuyển sang chế độ sửa
  const handleStartEditing = () => {
    setEditCode(currentRoom?.code || "");
    setEditRowId(currentRoom?.rowId?._id || currentRoom?.rowId || "");
    setEditBasePrice(
      currentRoom?.basePrice !== undefined && currentRoom?.basePrice !== null
        ? String(currentRoom.basePrice)
        : ""
    );
    setEditStatus(currentRoom?.status || "vacant");
    setEditAssets(Array.isArray(currentRoom?.assets) ? [...currentRoom.assets] : []);
    setCustomAssetInput("");
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
  };

  const handleToggleAsset = (asset) => {
    setEditAssets((prev) =>
      prev.includes(asset) ? prev.filter((a) => a !== asset) : [...prev, asset]
    );
  };

  const handleAddCustomAsset = () => {
    const trimmed = customAssetInput.trim();
    if (!trimmed) return;
    if (!editAssets.includes(trimmed)) {
      setEditAssets((prev) => [...prev, trimmed]);
    }
    setCustomAssetInput("");
  };

  const handleSaveEdit = () => {
    const trimmedCode = editCode.trim().toUpperCase();
    if (!trimmedCode) {
      toast.error("Mã phòng không được để trống.");
      return;
    }
    const priceNum = editBasePrice === "" ? 0 : Number(editBasePrice);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      toast.error("Giá thuê không hợp lệ.");
      return;
    }

    const payload = {
      code: trimmedCode,
      basePrice: priceNum,
      status: editStatus,
      assets: editAssets,
    };

    if (editRowId) {
      payload.rowId = editRowId;
      const foundRow = areaRows.find((r) => String(r.id || r._id) === String(editRowId));
      if (foundRow) payload.row = foundRow.name;
    } else {
      payload.rowId = null;
    }

    updateRoomMutation.mutate(payload);
  };

  const handleModalClose = () => {
    setIsEditing(false);
    onClose?.();
  };

  // Đại diện hợp đồng luôn đứng đầu danh sách
  const sortedTenants = [...tenants].sort(
    (a, b) => Number(b.isRepresentative) - Number(a.isRepresentative)
  );

  return (
    <>
      <Modal
        open={isOpen}
        onCancel={handleModalClose}
        footer={null}
        closable={false}
        centered
        width={860}
        destroyOnHidden
        styles={{ content: { padding: 0, overflow: "hidden", borderRadius: 20 } }}
      >
        {currentRoom && (
          <Spin spinning={isFetchingRoom || isFetchingTenants || updateRoomMutation.isPending}>
            {/* ===== HEADER ===== */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#6756df] via-[#7a63e6] to-[#9c75f0] px-6 pb-5 pt-5 text-white">
              <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -bottom-16 right-24 h-32 w-32 rounded-full bg-white/10" />

              <button
                type="button"
                onClick={handleModalClose}
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
                        Phòng {isEditing ? editCode || code : code}
                      </h2>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#20243c]">
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                        {isEditing ? STATUS_CONFIG[editStatus]?.name || editStatus : status.name}
                      </span>
                      {isEditing && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/90 px-2.5 py-0.5 text-[10.5px] font-extrabold text-amber-950 shadow-sm">
                          <Pencil size={11} /> Đang chỉnh sửa
                        </span>
                      )}
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
                      {formatMoney(isEditing ? editBasePrice : currentRoom.basePrice)}
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
              {/* LEFT: Người thuê (chiếm 3 cột) */}
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
                    className="inline-flex h-8 items-center justify-center gap-1 rounded-[8px] bg-[#6756df] px-2.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#5b4bc7]"
                  >
                    <UserPlus size={13} />
                    Thêm người
                  </button>
                </div>

                {sortedTenants.length > 0 ? (
                  <div className="space-y-2">
                    {sortedTenants.map((tenant) => (
                      <div
                        key={tenant._id}
                        onClick={() => setSelectedTenantDetail(tenant)}
                        className={`group flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition hover:shadow-md hover:border-[#aa9cf5] ${
                          tenant.isRepresentative
                            ? "border-[#dcd6fb] bg-[#faf9ff] hover:bg-[#f5f2fe]"
                            : "border-[#f0f0f6] bg-white hover:bg-[#fbfaff]"
                        }`}
                        title="Bấm để xem chi tiết người thuê này"
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm transition group-hover:scale-105 ${
                            tenant.isRepresentative
                              ? "bg-gradient-to-tr from-[#6756df] to-[#9c75f0]"
                              : "bg-gradient-to-tr from-[#94a3b8] to-[#b6c0cf]"
                          }`}
                        >
                          {getInitials(tenant.fullName)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-[13px] font-bold text-[#20243c] group-hover:text-[#6756df] transition-colors">
                              {tenant.fullName}
                            </p>
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

                        <div className="flex items-center gap-2">
                          {tenant.depositAmount > 0 && (
                            <div className="shrink-0 text-right">
                              <p className="text-[10px] text-[#9da2b4]">Tiền cọc</p>
                              <p className="text-xs font-bold text-[#6756df]">
                                {formatMoney(tenant.depositAmount)}
                              </p>
                            </div>
                          )}
                          <ChevronRight
                            size={15}
                            className="text-[#a4a9bc] transition group-hover:translate-x-0.5 group-hover:text-[#6756df]"
                          />
                        </div>
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
                      className="mt-3 inline-flex h-8 items-center justify-center gap-1 rounded-[8px] border border-[#d9d4ff] bg-[#f5f3ff] px-2.5 text-[11.5px] font-semibold text-[#6756df] transition-colors hover:bg-[#ece8ff]"
                    >
                      <UserPlus size={13} /> Thêm người thuê
                    </button>
                  </div>
                )}
              </section>

              {/* RIGHT: Thông tin phòng & Chỉnh sửa (chiếm 2 cột) */}
              <aside className="space-y-4 md:col-span-2">
                {isEditing ? (
                  /* ================= FORM CHỈNH SỬA TRỰC TIẾP ================= */
                  <div className="space-y-3 rounded-2xl border border-[#dcd6fb] bg-[#fbfaff] p-3.5 shadow-sm">
                    <div className="flex items-center justify-between border-b border-[#ece8fd] pb-2">
                      <h3 className="flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-[0.6px] text-[#6756df]">
                        <Pencil size={13} />
                        Chỉnh sửa thông tin
                      </h3>
                      <button
                        type="button"
                        onClick={handleCancelEditing}
                        className="text-[11px] font-semibold text-[#8c92a6] hover:text-[#20243c]"
                      >
                        Hủy
                      </button>
                    </div>

                    {/* Mã phòng */}
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-[#4b5168]">
                        Mã phòng <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                        placeholder="VD: P101"
                        className="h-8 w-full rounded-xl border border-[#e5e6ee] bg-white px-3 text-xs font-bold text-[#20243c] outline-none transition focus:border-[#6756df]"
                      />
                    </div>

                    {/* Dãy phòng */}
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-[#4b5168]">
                        Dãy phòng
                      </label>
                      <select
                        value={editRowId}
                        onChange={(e) => setEditRowId(e.target.value)}
                        className="h-8 w-full cursor-pointer appearance-none rounded-xl border border-[#e5e6ee] bg-white px-3 text-xs font-semibold text-[#20243c] outline-none transition focus:border-[#6756df]"
                      >
                        <option value="">Chưa phân dãy</option>
                        {areaRows.map((r) => (
                          <option key={r.id || r._id} value={r.id || r._id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Giá thuê */}
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-[#4b5168]">
                        Giá thuê cơ bản (VNĐ)
                      </label>
                      <input
                        type="number"
                        value={editBasePrice}
                        onChange={(e) => setEditBasePrice(e.target.value)}
                        placeholder="VD: 3000000"
                        className="h-8 w-full rounded-xl border border-[#e5e6ee] bg-white px-3 text-xs font-bold text-[#20243c] outline-none transition focus:border-[#6756df]"
                      />
                    </div>

                    {/* Trạng thái phòng */}
                    <div>
                      <label className="mb-1 block text-[11px] font-bold text-[#4b5168]">
                        Trạng thái phòng
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="h-8 w-full cursor-pointer appearance-none rounded-xl border border-[#e5e6ee] bg-white px-3 text-xs font-semibold text-[#20243c] outline-none transition focus:border-[#6756df]"
                      >
                        <option value="vacant">Trống</option>
                        <option value="renting">Đang thuê</option>
                        <option value="deposit">Đã cọc</option>
                        <option value="repair">Đang sửa</option>
                        <option value="stop">Tạm ngưng</option>
                      </select>
                    </div>

                    {/* Tiện ích */}
                    <div className="pt-1">
                      <label className="mb-1.5 block text-[11px] font-bold text-[#4b5168]">
                        Tiện ích & nội thất ({editAssets.length})
                      </label>
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {SUGGESTED_ASSETS.map((asset) => {
                          const isSelected = editAssets.includes(asset);
                          return (
                            <button
                              key={asset}
                              type="button"
                              onClick={() => handleToggleAsset(asset)}
                              className={`rounded-lg border px-2 py-0.5 text-[10.5px] font-semibold transition ${
                                isSelected
                                  ? "border-[#6756df] bg-[#efedff] text-[#6756df]"
                                  : "border-[#e5e6ee] bg-white text-[#6b7280] hover:border-[#cfd3e4]"
                              }`}
                            >
                              {asset} {isSelected && "✓"}
                            </button>
                          );
                        })}
                      </div>

                      {/* Thêm tiện ích khác */}
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={customAssetInput}
                          onChange={(e) => setCustomAssetInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomAsset();
                            }
                          }}
                          placeholder="Thêm tiện ích khác..."
                          className="h-7 flex-1 rounded-lg border border-[#e5e6ee] bg-white px-2 text-[11px] outline-none focus:border-[#6756df]"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomAsset}
                          className="inline-flex h-7 items-center gap-1 rounded-lg border border-[#dcd6fb] bg-[#f8f7ff] px-2 text-[11px] font-bold text-[#6756df] transition hover:bg-[#efeaff]"
                        >
                          <Plus size={11} /> Thêm
                        </button>
                      </div>

                      {/* Tiện ích tùy chỉnh đã thêm */}
                      {editAssets.filter((a) => !SUGGESTED_ASSETS.includes(a)).length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {editAssets
                            .filter((a) => !SUGGESTED_ASSETS.includes(a))
                            .map((asset) => (
                              <span
                                key={asset}
                                className="inline-flex items-center gap-1 rounded-md border border-[#6756df] bg-[#efedff] px-1.5 py-0.5 text-[10px] font-semibold text-[#6756df]"
                              >
                                {asset}
                                <button
                                  type="button"
                                  onClick={() => handleToggleAsset(asset)}
                                  className="text-[#6756df] hover:text-red-500"
                                >
                                  <X size={10} />
                                </button>
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* ================= CHẾ ĐỘ XEM CHI TIẾT ================= */
                  <>
                    <div>
                      <h3 className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.8px] text-[#9da2b4]">
                        Thông tin phòng
                      </h3>
                      <div className="space-y-2">
                        <InfoItem
                          icon={Banknote}
                          label="Giá thuê cơ bản"
                          value={`${formatMoney(currentRoom.basePrice)} / tháng`}
                        />
                        <InfoItem icon={Layers} label="Dãy phòng" value={rowName} />
                        <InfoItem
                          icon={MapPin}
                          label="Địa chỉ"
                          value={area?.address || area?.name || "—"}
                        />
                        <InfoItem
                          icon={CalendarClock}
                          label="Cập nhật cuối"
                          value={formatDate(currentRoom.updatedAt, true)}
                        />
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
                            <Tag
                              key={item}
                              className="m-0 rounded-lg border-[#e4e1f8] bg-[#f8f7ff] px-2.5 py-0.5 text-[11px] font-semibold text-[#5644d8]"
                            >
                              {item}
                            </Tag>
                          ))}
                        </div>
                      ) : (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description="Chưa có tiện ích"
                          className="my-1"
                        />
                      )}
                    </div>
                  </>
                )}
              </aside>
            </div>

            {/* ===== FOOTER ===== */}
            <div className="flex items-center justify-between gap-3 border-t border-[#f0f0f6] bg-[#fafafc] px-6 py-3">
              <div>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsConfirmDeleteOpen(true)}
                    className="inline-flex h-8 items-center justify-center gap-1 rounded-[8px] border border-[#ffd0d6] bg-[#fff5f6] px-2.5 text-[11.5px] font-semibold text-[#dd5262] transition-colors hover:bg-[#ffebee] hover:border-[#fca5af]"
                  >
                    <Trash2 size={13} />
                    Xóa phòng
                  </button>
                ) : (
                  <span className="text-[11px] font-medium text-[#8c92a6]">
                    * Nhấn Lưu thay đổi để hoàn tất cập nhật thông tin phòng.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleStartEditing}
                      className="inline-flex h-8 items-center justify-center gap-1 rounded-[8px] border border-[#d9d4ff] bg-[#f5f3ff] px-2.5 text-[11.5px] font-semibold text-[#6756df] transition-colors hover:bg-[#ece8ff]"
                    >
                      <Pencil size={12} />
                      Chỉnh sửa
                    </button>
                    <button
                      type="button"
                      onClick={handleModalClose}
                      className="inline-flex h-8 items-center justify-center rounded-[8px] border border-[#e5e6ee] bg-white px-3 text-[11.5px] font-semibold text-[#54596e] transition-colors hover:bg-[#f3f4f8]"
                    >
                      Đóng
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleCancelEditing}
                      className="inline-flex h-8 items-center justify-center rounded-[8px] border border-[#e5e6ee] bg-white px-3 text-[11.5px] font-semibold text-[#54596e] transition-colors hover:bg-[#f3f4f8]"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      disabled={updateRoomMutation.isPending}
                      onClick={handleSaveEdit}
                      className="inline-flex h-8 items-center justify-center gap-1 rounded-[8px] bg-[#6756df] px-3 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#5b4bc7] active:scale-[0.98] disabled:opacity-60"
                    >
                      <Check size={13} />
                      {updateRoomMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </>
                )}
              </div>
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
              className="inline-flex h-8 flex-1 items-center justify-center rounded-[8px] border border-[#e5e6ee] bg-white text-[11.5px] font-semibold text-[#54596e] transition-colors hover:bg-[#f6f7fb] disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={deleteRoomMutation.isPending}
              onClick={() => deleteRoomMutation.mutate()}
              className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-[8px] bg-rose-600 text-[11.5px] font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:opacity-60"
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

      <TenantDetailModal
        isOpen={Boolean(selectedTenantDetail)}
        onClose={() => setSelectedTenantDetail(null)}
        tenant={selectedTenantDetail}
        zIndex={1300}
      />
    </>
  );
}
