import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wrench,
} from "lucide-react";
import toast from "react-hot-toast";
import AreaSearchDropdown from "../components/AreaSearchDropdown.jsx";
import CreateMaintenanceModal from "../components/CreateMaintenanceModal.jsx";
import { getAreas } from "../services/ereaService.js";
import {
  deleteMaintenance,
  getMaintenances,
  updateMaintenance,
} from "../services/maintenanceService.js";
import { getRooms } from "../services/roomService.js";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const STATUS_META = {
  open: {
    label: "Chờ xử lý",
    dot: "bg-[#df606d]",
    badge: "border-[#f8d9dd] bg-[#fff0f0] text-[#df606d]",
    activeBtn: "border-[#df606d] bg-[#fff0f0] text-[#df606d]",
  },
  in_progress: {
    label: "Đang sửa",
    dot: "bg-[#d98218]",
    badge: "border-[#f6dfbd] bg-[#fff3e4] text-[#bb833c]",
    activeBtn: "border-[#d98218] bg-[#fff3e4] text-[#bb833c]",
  },
  resolved: {
    label: "Đã xong",
    dot: "bg-[#168e70]",
    badge: "border-[#b8e7d9] bg-[#e4f8f0] text-[#168e70]",
    activeBtn: "border-[#168e70] bg-[#e4f8f0] text-[#168e70]",
  },
};

export default function MaintenancePage() {
  const queryClient = useQueryClient();
  const [selectedArea, setSelectedArea] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);

  const { data: areas = [] } = useQuery({
    queryKey: ["areas"],
    queryFn: getAreas,
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => getRooms(),
  });

  const {
    data: maintenanceData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["maintenances", selectedArea || "all", statusFilter || "all"],
    queryFn: () =>
      getMaintenances({
        areaId: selectedArea || undefined,
        status: statusFilter || undefined,
      }),
  });

  const tickets = useMemo(
    () => maintenanceData?.tickets ?? [],
    [maintenanceData]
  );
  const summary = maintenanceData?.summary ?? {
    totalCount: 0,
    openCount: 0,
    inProgressCount: 0,
    resolvedCount: 0,
  };

  const filteredTickets = useMemo(() => {
    const q = searchTerm.trim().toLocaleLowerCase("vi");
    if (!q) return tickets;
    return tickets.filter((t) => {
      const text = `${t.roomCode} ${t.areaName} ${t.title} ${t.description}`.toLocaleLowerCase(
        "vi"
      );
      return text.includes(q);
    });
  }, [tickets, searchTerm]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateMaintenance({ id, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenances"] });
      toast.success("Đã cập nhật trạng thái bảo trì!");
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message || "Cập nhật trạng thái thất bại."
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMaintenance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenances"] });
      toast.success("Đã xóa mục bảo trì.");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Xóa bảo trì thất bại.");
    },
  });

  const handleOpenCreate = () => {
    setEditingTicket(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ticket) => {
    setEditingTicket(ticket);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full space-y-4 px-2 py-3 lg:px-4 lg:py-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-tight text-[#20243c] sm:text-[22px]">
            Bảo trì
          </h1>
          <p className="mt-0.5 text-xs text-[#8c92a6]">
            Theo dõi các công việc sửa chữa, bảo trì phòng trọ ·{" "}
            <span className="font-semibold text-[#6756df]">
              {summary.totalCount}
            </span>{" "}
            mục
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex h-8 items-center justify-center gap-1 rounded-[8px] bg-[#6756df] px-3 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#5b4bc7]"
        >
          <Plus size={13} />
          Thêm bảo trì
        </button>
      </div>

      {/* Thanh tìm kiếm & lọc */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-[#ebeaf3] bg-white p-2.5 shadow-[0_2px_12px_rgba(31,33,87,0.02)]">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9da2b4]"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên bảo trì, mô tả, mã phòng..."
              className="h-9 w-full rounded-xl border border-[#e5e6ee] bg-[#f9f9fc] pl-9 pr-3 text-[12px] text-[#20243c] outline-none placeholder:text-[#9da2b4] focus:border-[#6756df] focus:bg-white"
            />
          </div>

          <AreaSearchDropdown
            areas={areas}
            selectedAreaId={selectedArea}
            onSelectArea={(areaId) => setSelectedArea(areaId)}
          />
        </div>

        {/* Bộ lọc trạng thái */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { value: "", label: `Tất cả (${summary.totalCount})` },
            { value: "open", label: `Chờ xử lý (${summary.openCount})` },
            {
              value: "in_progress",
              label: `Đang sửa (${summary.inProgressCount})`,
            },
            { value: "resolved", label: `Đã xong (${summary.resolvedCount})` },
          ].map((tab) => {
            const active = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`h-8 rounded-[8px] border px-2.5 text-[11.5px] font-semibold transition ${
                  active
                    ? "border-[#c7befb] bg-[#f1effe] text-[#5b4bc7]"
                    : "border-[#ececf3] bg-white text-[#6b7086] hover:border-[#d5d0f5]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Card Grid */}
      {isLoading ? (
        <div className="flex h-56 items-center justify-center rounded-2xl border border-[#ebeaf3] bg-white text-xs text-[#8c92a6]">
          <Loader2 size={18} className="mr-2 animate-spin text-[#6756df]" />
          Đang tải danh sách bảo trì...
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-xs text-rose-600">
          Không tải được dữ liệu bảo trì. Vui lòng thử lại.
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#dfe1eb] bg-white py-14 text-center">
          <div className="mb-2.5 grid h-11 w-11 place-items-center rounded-2xl bg-[#f4f3fd] text-[#6756df]">
            <Wrench size={20} />
          </div>
          <p className="text-xs font-bold text-[#20243c]">
            Chưa có mục bảo trì nào
          </p>
          <p className="mt-1 text-[11px] text-[#9095aa]">
            Bấm &ldquo;Thêm bảo trì&rdquo; để ghi nhận công việc cần sửa chữa.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTickets.map((item) => {
            const meta = STATUS_META[item.status] || STATUS_META.open;

            return (
              <article
                key={item.id}
                className="flex flex-col justify-between rounded-[18px] border border-[#e7e7ef] bg-white p-4 shadow-[0_3px_14px_rgba(31,33,87,0.03)] transition hover:border-[#d3cef7] hover:shadow-[0_6px_20px_rgba(103,86,223,0.07)]"
              >
                <div>
                  {/* Card Top: Phòng/Khu + Badge Trạng thái */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center rounded-lg bg-[#f0effd] px-2.5 py-1 text-xs font-extrabold text-[#5644d8]">
                        {item.roomCode || "Phòng"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#7c8298]">
                        <MapPin size={11} className="text-[#9ea4b8]" />
                        {item.areaName}
                        {item.row ? ` · ${item.row}` : ""}
                      </span>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold ${meta.badge}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                  </div>

                  {/* Tên bảo trì */}
                  <h3 className="mt-3 text-[14px] font-extrabold leading-snug text-[#20243c]">
                    {item.title}
                  </h3>

                  {/* Mô tả */}
                  <p className="mt-1.5 line-clamp-3 min-h-[34px] text-xs leading-relaxed text-[#6b7086]">
                    {item.description || (
                      <span className="italic text-[#a4a9bc]">
                        Không có mô tả chi tiết.
                      </span>
                    )}
                  </p>
                </div>

                {/* Card Footer: Đổi nhanh trạng thái + Sửa / Xóa */}
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#f1f2f8] pt-3">
                  <div className="flex items-center gap-1">
                    {[
                      { key: "open", label: "Chờ xử lý" },
                      { key: "in_progress", label: "Đang sửa" },
                      { key: "resolved", label: "Đã xong" },
                    ].map((st) => {
                      const isCurrent = item.status === st.key;
                      return (
                        <button
                          key={st.key}
                          type="button"
                          disabled={statusMutation.isPending}
                          onClick={() => {
                            if (!isCurrent) {
                              statusMutation.mutate({
                                id: item.id,
                                status: st.key,
                              });
                            }
                          }}
                          className={`h-7 rounded-[7px] border px-2 text-[10.5px] font-semibold transition ${
                            isCurrent
                              ? STATUS_META[st.key].activeBtn
                              : "border-[#e6e7f0] bg-white text-[#7b8196] hover:bg-[#f6f7fb]"
                          }`}
                        >
                          {st.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="mr-1 hidden text-[10.5px] text-[#9aa0b4] xl:inline">
                      {formatDate(item.createdAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      title="Sửa bảo trì"
                      className="grid h-7 w-7 place-items-center rounded-[7px] border border-[#e5e6ee] bg-white text-[#676d85] transition hover:border-[#c7befb] hover:text-[#6756df]"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(item.id)}
                      title="Xóa bảo trì"
                      className="grid h-7 w-7 place-items-center rounded-[7px] border border-[#f2d8dc] bg-[#fff5f6] text-[#df606d] transition hover:bg-[#ffe8eb]"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal Thêm / Sửa bảo trì */}
      <CreateMaintenanceModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTicket(null);
        }}
        areas={areas}
        rooms={rooms}
        defaultAreaId={selectedArea}
        editingTicket={editingTicket}
      />
    </div>
  );
}
