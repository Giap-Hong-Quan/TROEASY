import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "antd";
import { Plus, Zap, Layers, X, Trash2, AlertTriangle, Lock, ReceiptText } from "lucide-react";
import toast from "react-hot-toast";
import { DELETE_PASSWORD } from "../constants/security.js";
import AreaExpenseModal from "./AreaExpenseModal.jsx";
import { deleteArea } from "../services/ereaService.js";
import { createRow, deleteRow } from "../services/rowService.js";

const ROOM_STATUS = {
  vacant: {
    name: "Trống",
    dot: "bg-[#ed7780]",
    room: "border-[#f8d9dd] bg-[#fff0f0] text-[#df606d]",
    activeBadge: "border-[#df606d] bg-[#fff0f0] text-[#df606d] ring-2 ring-[#df606d]/15",
  },
  renting: {
    name: "Đang thuê",
    dot: "bg-[#27b093]",
    room: "border-[#b8e7d9] bg-[#e4f8f0] text-[#168e70]",
    activeBadge: "border-[#168e70] bg-[#e4f8f0] text-[#168e70] ring-2 ring-[#168e70]/15",
  },
  deposit: {
    name: "Đã cọc",
    dot: "bg-[#8173ed]",
    room: "border-[#dad4ff] bg-[#efedff] text-[#6d5ed4]",
    activeBadge: "border-[#6d5ed4] bg-[#efedff] text-[#6d5ed4] ring-2 ring-[#6d5ed4]/15",
  },
  repair: {
    name: "Đang sửa",
    dot: "bg-[#e5ac52]",
    room: "border-[#f6dfbd] bg-[#fff3e4] text-[#bb833c]",
    activeBadge: "border-[#bb833c] bg-[#fff3e4] text-[#bb833c] ring-2 ring-[#bb833c]/15",
  },
  stop: {
    name: "Tạm ngưng",
    dot: "bg-[#aab0bd]",
    room: "border-[#e3e5ed] bg-[#f2f3f6] text-[#999eac]",
    activeBadge: "border-[#7d8496] bg-[#f2f3f6] text-[#5e6475] ring-2 ring-[#999eac]/20",
  },
};

const statusItems = Object.entries(ROOM_STATUS);

const formatRowLabel = (rowValue) => {
  if (!rowValue) return "Chưa phân dãy";
  const trimmed = String(rowValue).trim();
  if (/^dãy\s+/i.test(trimmed)) return trimmed;
  return `Dãy ${trimmed}`;
};

export default function AreaRoomCard({ area, onAddRoom, onSelectRoom }) {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isCreatingRow, setIsCreatingRow] = useState(false);
  const [newRowName, setNewRowName] = useState("");
  const [rowPendingDelete, setRowPendingDelete] = useState(null);
  const [deleteRowPassword, setDeleteRowPassword] = useState("");
  const [rowPasswordError, setRowPasswordError] = useState("");

  // State xác nhận xóa khu trọ
  const [isConfirmDeleteAreaOpen, setIsConfirmDeleteAreaOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // State modal khoản chi của khu
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const deleteAreaMutation = useMutation({
    mutationFn: deleteArea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["rows"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success(`Đã xóa khu trọ "${area.name}" thành công!`);
      setIsConfirmDeleteAreaOpen(false);
      setDeletePassword("");
      setPasswordError("");
    },
    onError: (error) => {
      const msg = error.response?.data?.message || error.message || "Xóa khu trọ thất bại.";
      toast.error(msg);
    },
  });

  const createRowMutation = useMutation({
    mutationFn: createRow,
    onSuccess: (createdRow) => {
      queryClient.invalidateQueries({ queryKey: ["rows"] });
      toast.success(`Đã tạo "${createdRow.name}" cho ${area.name}!`);
      setNewRowName("");
      setIsCreatingRow(false);
    },
    onError: (error) => {
      const msg = error.response?.data?.message || error.message || "Tạo dãy thất bại.";
      toast.error(msg);
    },
  });

  const deleteRowMutation = useMutation({
    mutationFn: deleteRow,
    onSuccess: (_data, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["rows"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      const deletedLabel = rowPendingDelete?.label || "dãy phòng";
      toast.success(`Đã xóa ${deletedLabel} và các phòng thuộc dãy!`);
      setRowPendingDelete(null);
      setDeleteRowPassword("");
      setRowPasswordError("");
    },
    onError: (error) => {
      const msg = error.response?.data?.message || error.message || "Xóa dãy thất bại.";
      toast.error(msg);
    },
  });

  const statusCounts = useMemo(() => {
    const counts = {};
    for (const [key] of statusItems) counts[key] = 0;
    for (const room of area.rooms) {
      if (counts[room.status] !== undefined) {
        counts[room.status] += 1;
      }
    }
    return counts;
  }, [area.rooms]);

  const filteredRooms = useMemo(() => {
    if (!selectedStatus) return area.rooms;
    return area.rooms.filter((room) => room.status === selectedStatus);
  }, [area.rooms, selectedStatus]);

  const rowGroups = useMemo(() => {
    const map = new Map();
    const rowById = new Map();

    // Count total rooms per row across all statuses (for delete confirmation)
    const totalRoomsByRowLabel = new Map();
    for (const r of area.rows || []) {
      rowById.set(String(r.id), r);
      totalRoomsByRowLabel.set(r.name, 0);
      if (!selectedStatus) {
        map.set(r.name, { id: r.id, label: r.name, rooms: [], totalRoomsCount: 0 });
      }
    }

    for (const room of area.rooms) {
      const matchedRow = room.rowId ? rowById.get(String(room.rowId)) : null;
      const label = matchedRow ? matchedRow.name : formatRowLabel(room.row);
      totalRoomsByRowLabel.set(label, (totalRoomsByRowLabel.get(label) || 0) + 1);
    }

    for (const room of filteredRooms) {
      const matchedRow = room.rowId ? rowById.get(String(room.rowId)) : null;
      const label = matchedRow ? matchedRow.name : formatRowLabel(room.row);
      if (!map.has(label)) {
        map.set(label, {
          id: matchedRow?.id || "",
          label,
          rooms: [],
          totalRoomsCount: totalRoomsByRowLabel.get(label) || 0,
        });
      }
      map.get(label).rooms.push(room);
    }

    for (const group of map.values()) {
      group.totalRoomsCount = totalRoomsByRowLabel.get(group.label) || 0;
      group.rooms.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA !== timeB) return timeA - timeB;
        return String(a.id || "").localeCompare(String(b.id || ""));
      });
    }

    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label, "vi", { numeric: true }),
    );
  }, [area.rows, area.rooms, filteredRooms, selectedStatus]);

  const handleToggleStatus = (statusKey) => {
    setSelectedStatus((prev) => (prev === statusKey ? "" : statusKey));
  };

  const handleOpenCreateRow = () => {
    const nextIndex = (area.rows?.length || 0) + 1;
    setNewRowName(`Dãy ${nextIndex}`);
    setIsCreatingRow(true);
  };

  const handleCreateRowSubmit = (event) => {
    event.preventDefault();
    const trimmed = newRowName.trim();
    if (!trimmed) {
      toast.error("Vui lòng nhập tên dãy.");
      return;
    }
    createRowMutation.mutate({ areaId: area.id, name: trimmed });
  };

  return (
    <section className="overflow-hidden rounded-[14px] border border-[#e7e7ef] bg-white p-3.5 sm:p-4">
      <div className="mb-3.5 flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-[14px] font-bold text-[#20243c]">{area.name}</h2>
          <p className="mt-0.5 break-words text-[11.5px] leading-4 text-[#9298aa]">{area.address}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                area.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${area.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
              {area.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
            </span>
            <span className="text-[11px] text-[#9298aa]">
              {statusCounts.renting ?? 0}/{area.rooms.length} phòng đang thuê
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0">
          <button
            type="button"
            onClick={() => setIsExpenseModalOpen(true)}
            className="inline-flex h-8 items-center justify-center gap-1 rounded-[8px] border border-[#e5e6ef] bg-white px-2.5 text-[11.5px] font-semibold text-[#66697c] transition-colors hover:bg-slate-50"
          >
            <ReceiptText size={12} className="text-amber-600" /> Khoản chi
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center gap-1 rounded-[8px] border border-[#e5e6ef] bg-white px-2.5 text-[11.5px] font-semibold text-[#66697c] transition-colors hover:bg-slate-50"
          >
            <Zap size={12} className="text-orange-500" /> Nhập điện nước
          </button>
          <button
            type="button"
            onClick={handleOpenCreateRow}
            className="inline-flex h-8 items-center justify-center gap-1 rounded-[8px] border border-[#d9d4ff] bg-[#f5f3ff] px-2.5 text-[11.5px] font-semibold text-[#6756df] transition-colors hover:bg-[#ece8ff]"
          >
            <Layers size={12} /> Tạo dãy
          </button>
          <button
            type="button"
            onClick={() => onAddRoom?.(area.id)}
            className="inline-flex h-8 items-center justify-center gap-1 rounded-[8px] bg-[#6756df] px-2.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#5b4bc7]"
          >
            <Plus size={12} /> Thêm phòng
          </button>
          <button
            type="button"
            onClick={() => {
              setDeletePassword("");
              setPasswordError("");
              setIsConfirmDeleteAreaOpen(true);
            }}
            className="inline-flex h-8 items-center justify-center gap-1 rounded-[8px] border border-[#ffd0d6] bg-[#fff5f6] px-2.5 text-[11.5px] font-semibold text-[#dd5262] transition-colors hover:bg-[#ffebee] hover:border-[#fca5af]"
            title={`Xóa khu trọ ${area.name}`}
          >
            <Trash2 size={12} /> Xóa khu
          </button>
        </div>
      </div>

      {/* Inline form tạo dãy nhanh cho khu */}
      {isCreatingRow && (
        <form
          onSubmit={handleCreateRowSubmit}
          className="mb-3.5 flex flex-wrap items-center gap-2 rounded-lg border border-[#ded9ff] bg-[#faf9ff] p-2.5"
        >
          <span className="text-[11.5px] font-bold text-[#4a3fb5]">Tạo dãy mới ({area.name}):</span>
          <input
            type="text"
            autoFocus
            value={newRowName}
            onChange={(event) => setNewRowName(event.target.value)}
            placeholder="Nhập tên dãy (VD: Dãy 5, Dãy A...)"
            className="h-8 min-w-[180px] flex-1 rounded-md border border-[#d8d5f2] bg-white px-2.5 text-[11.5px] text-[#20243c] outline-none focus:border-[#6756df]"
          />
          <button
            type="submit"
            disabled={createRowMutation.isPending}
            className="inline-flex h-8 items-center gap-1 rounded-md bg-[#6756df] px-3 text-[11.5px] font-bold text-white transition-colors hover:bg-[#5b4bc7] disabled:opacity-60"
          >
            <Plus size={12} />
            {createRowMutation.isPending ? "Đang tạo..." : "Lưu dãy"}
          </button>
          <button
            type="button"
            onClick={() => setIsCreatingRow(false)}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-[#e5e6ef] bg-white px-2 text-[11.5px] font-semibold text-[#66697c] hover:bg-slate-50"
          >
            <X size={12} /> Hủy
          </button>
        </form>
      )}

      {/* Clickable status filters per area */}
      <div className="mb-3.5 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          aria-pressed={!selectedStatus}
          onClick={() => setSelectedStatus("")}
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-[10.5px] transition-all ${
            !selectedStatus
              ? "border-[#6756df] bg-[#efedff] font-semibold text-[#6756df] ring-2 ring-[#6756df]/15"
              : "border-[#ececf2] bg-[#fafaff] text-[#70778d] hover:border-[#dcdce8] hover:bg-[#f3f3fb]"
          }`}
        >
          <span>Tất cả</span>
          <span className={`font-bold ${!selectedStatus ? "text-current" : "text-[#3e435b]"}`}>
            {area.rooms.length}
          </span>
        </button>

        {statusItems.map(([key, item]) => {
          const isActive = selectedStatus === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={isActive}
              onClick={() => handleToggleStatus(key)}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-[10.5px] transition-all ${
                isActive
                  ? item.activeBadge
                  : "border-[#ececf2] bg-[#fafaff] text-[#70778d] hover:border-[#dcdce8] hover:bg-[#f3f3fb]"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />
              <span className={isActive ? "font-semibold" : ""}>{item.name}</span>
              <span className={`font-bold ${isActive ? "text-current" : "text-[#3e435b]"}`}>
                {statusCounts[key] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {rowGroups.length > 0 ? (
        <div className="space-y-3">
          {rowGroups.map((group) => (
            <div key={group.label}>
              <div className="mb-1.5 flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#9da2b4]">
                  {group.label}
                </span>
                {group.id && (
                  <>
                    <button
                      type="button"
                      onClick={() => onAddRoom?.(area.id, group.id)}
                      className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold text-[#6756df] transition-colors hover:bg-[#f3f1ff]"
                    >
                      <Plus size={10} /> Thêm phòng
                    </button>
                    <button
                      type="button"
                      title={`Xóa ${group.label}`}
                      onClick={() => {
                        setRowPendingDelete({
                          id: group.id,
                          label: group.label,
                          totalRoomsCount: group.totalRoomsCount,
                        });
                        setDeleteRowPassword("");
                        setRowPasswordError("");
                      }}
                      className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium text-[#9fa4b8] transition-colors hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 size={10} /> Xóa dãy
                    </button>
                  </>
                )}
              </div>
              {group.rooms.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {group.rooms.map((room) => {
                    const statusCfg = ROOM_STATUS[room.status] || ROOM_STATUS.vacant;
                    const displayCode = room.code || room.number;
                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => onSelectRoom?.(room, area, group.label)}
                        title={`Phòng ${displayCode} · ${statusCfg.name}`}
                        className={`flex h-[48px] w-[60px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[10px] border text-[11.5px] font-bold transition-all hover:scale-[1.03] hover:brightness-[0.97] ${statusCfg.room}`}
                      >
                        <span>{displayCode}</span>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] italic text-[#a2a7b8]">
                  Chưa có phòng trong {group.label}.
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-[#dfe1eb] bg-[#fafaff] px-3 py-4 text-center text-[11.5px] text-[#858ba0]">
          {selectedStatus
            ? `Không có phòng nào ở trạng thái "${ROOM_STATUS[selectedStatus]?.name}" trong khu vực này.`
            : "Chưa có dãy hoặc phòng nào trong khu vực này."}
        </p>
      )}

      {/* Modal xác nhận xóa dãy & các phòng thuộc dãy với mật khẩu bảo mật */}
      <Modal
        open={Boolean(rowPendingDelete)}
        onCancel={() => {
          if (!deleteRowMutation.isPending) {
            setRowPendingDelete(null);
            setDeleteRowPassword("");
            setRowPasswordError("");
          }
        }}
        footer={null}
        closable={false}
        centered
        width={420}
        destroyOnHidden
        zIndex={1200}
        styles={{ content: { borderRadius: 20, padding: 24 } }}
      >
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
            <AlertTriangle size={24} />
          </div>

          <h3 className="mt-3.5 text-base font-extrabold text-[#20243c]">
            Xóa {rowPendingDelete?.label} thuộc &quot;{area.name}&quot;?
          </h3>

          <p className="mt-1.5 text-xs leading-relaxed text-[#7d8398]">
            {rowPendingDelete?.totalRoomsCount > 0 ? (
              <>
                Toàn bộ <span className="font-bold text-[#20243c]">{rowPendingDelete.totalRoomsCount} phòng</span> thuộc {rowPendingDelete.label} sẽ bị xóa vĩnh viễn. Hồ sơ khách thuê vẫn được bảo toàn.
              </>
            ) : (
              <>Dãy này hiện chưa có phòng nào và sẽ bị xóa vĩnh viễn khỏi {area.name}.</>
            )}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (deleteRowPassword !== DELETE_PASSWORD) {
                setRowPasswordError(`Mật khẩu không chính xác! Vui lòng nhập đúng ${DELETE_PASSWORD}.`);
                return;
              }
              deleteRowMutation.mutate(rowPendingDelete.id);
            }}
            className="mt-4 text-left"
          >
            <label className="block text-[11px] font-bold text-[#4b5168]">
              Nhập mật khẩu xác nhận ({DELETE_PASSWORD}) để xóa dãy:
            </label>
            <div className="relative mt-1.5">
              <Lock
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9da2b4]"
              />
              <input
                type="password"
                autoFocus
                value={deleteRowPassword}
                onChange={(e) => {
                  setDeleteRowPassword(e.target.value);
                  if (rowPasswordError) setRowPasswordError("");
                }}
                placeholder={`Nhập ${DELETE_PASSWORD}`}
                className={`h-9 w-full rounded-xl border bg-[#f9f9fc] pl-9 pr-3 text-xs font-bold tracking-wider text-[#20243c] outline-none transition focus:bg-white ${
                  rowPasswordError
                    ? "border-rose-400 focus:border-rose-500"
                    : "border-[#e5e6ee] focus:border-rose-500"
                }`}
              />
            </div>
            {rowPasswordError ? (
              <p className="mt-1 text-[11px] font-semibold text-rose-600">
                {rowPasswordError}
              </p>
            ) : (
              <p className="mt-1 text-[10.5px] text-[#9da2b4]">
                Mã xác nhận bảo mật: nhập chính xác <span className="font-bold text-[#20243c]">{DELETE_PASSWORD}</span>.
              </p>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                disabled={deleteRowMutation.isPending}
                onClick={() => {
                  setRowPendingDelete(null);
                  setDeleteRowPassword("");
                  setRowPasswordError("");
                }}
                className="inline-flex h-8 flex-1 items-center justify-center rounded-[8px] border border-[#e5e6ee] bg-white text-[11.5px] font-semibold text-[#54596e] transition-colors hover:bg-[#f6f7fb] disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={deleteRowMutation.isPending || deleteRowPassword !== DELETE_PASSWORD}
                className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-[8px] bg-rose-600 text-[11.5px] font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={13} />
                {deleteRowMutation.isPending
                  ? "Đang xóa..."
                  : rowPendingDelete?.totalRoomsCount > 0
                    ? `Xóa dãy & ${rowPendingDelete.totalRoomsCount} phòng`
                    : "Xóa dãy"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal xác nhận xóa khu với mật khẩu bảo mật */}
      <Modal
        open={isConfirmDeleteAreaOpen}
        onCancel={() => {
          if (!deleteAreaMutation.isPending) {
            setIsConfirmDeleteAreaOpen(false);
            setDeletePassword("");
            setPasswordError("");
          }
        }}
        footer={null}
        closable={false}
        centered
        width={420}
        destroyOnHidden
        zIndex={1200}
        styles={{ content: { borderRadius: 20, padding: 24 } }}
      >
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
            <AlertTriangle size={24} />
          </div>

          <h3 className="mt-3.5 text-base font-extrabold text-[#20243c]">
            Xóa khu trọ &quot;{area.name}&quot;?
          </h3>

          <p className="mt-1.5 text-xs leading-relaxed text-[#7d8398]">
            Hành động này sẽ xóa vĩnh viễn khu trọ cùng toàn bộ{" "}
            <span className="font-bold text-[#20243c]">{area.rooms.length} phòng</span> và các dãy thuộc khu này.
            Hồ sơ khách thuê vẫn được bảo toàn trong hệ thống.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (deletePassword !== DELETE_PASSWORD) {
                setPasswordError(`Mật khẩu không chính xác! Vui lòng nhập đúng ${DELETE_PASSWORD}.`);
                return;
              }
              deleteAreaMutation.mutate(area.id);
            }}
            className="mt-4 text-left"
          >
            <label className="block text-[11px] font-bold text-[#4b5168]">
              Nhập mật khẩu xác nhận ({DELETE_PASSWORD}) để xóa:
            </label>
            <div className="relative mt-1.5">
              <Lock
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9da2b4]"
              />
              <input
                type="password"
                autoFocus
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
                placeholder={`Nhập ${DELETE_PASSWORD}`}
                className={`h-9 w-full rounded-xl border bg-[#f9f9fc] pl-9 pr-3 text-xs font-bold tracking-wider text-[#20243c] outline-none transition focus:bg-white ${
                  passwordError
                    ? "border-rose-400 focus:border-rose-500"
                    : "border-[#e5e6ee] focus:border-rose-500"
                }`}
              />
            </div>
            {passwordError ? (
              <p className="mt-1 text-[11px] font-semibold text-rose-600">
                {passwordError}
              </p>
            ) : (
              <p className="mt-1 text-[10.5px] text-[#9da2b4]">
                Mã xác nhận bảo mật: nhập chính xác <span className="font-bold text-[#20243c]">{DELETE_PASSWORD}</span>.
              </p>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                disabled={deleteAreaMutation.isPending}
                onClick={() => {
                  setIsConfirmDeleteAreaOpen(false);
                  setDeletePassword("");
                  setPasswordError("");
                }}
                className="inline-flex h-8 flex-1 items-center justify-center rounded-[8px] border border-[#e5e6ee] bg-white text-[11.5px] font-semibold text-[#54596e] transition-colors hover:bg-[#f6f7fb] disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={deleteAreaMutation.isPending || deletePassword !== DELETE_PASSWORD}
                className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-[8px] bg-rose-600 text-[11.5px] font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={13} />
                {deleteAreaMutation.isPending ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal quản lý khoản chi theo khu */}
      <AreaExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        area={area}
      />
    </section>
  );
}
