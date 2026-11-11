import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Zap,
  Droplets,
  CheckCircle2,
  Calculator,
  Loader2,
  Trash2,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import AreaSearchDropdown from "../components/AreaSearchDropdown.jsx";
import AreaUtilityModal from "../components/AreaUtilityModal.jsx";
import CustomSelect from "../components/CustomSelect.jsx";
import { getAreas } from "../services/ereaService.js";
import {
  deleteUtilityReading,
  getUtilitySheet,
} from "../services/utilityService.js";

function formatVnd(value) {
  return `${Math.round(Number(value) || 0).toLocaleString("vi-VN")} đ`;
}

function StatCard({ icon: Icon, label, value, subtext, tone }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#ebeaf3] bg-white p-3.5 shadow-[0_2px_12px_rgba(31,33,87,0.02)]">
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-[#8c92a6]">{label}</p>
        <p className="truncate text-lg font-extrabold leading-tight text-[#20243c]">
          {value}
        </p>
        {subtext && (
          <p className="mt-0.5 truncate text-[11px] text-[#9298aa]">{subtext}</p>
        )}
      </div>
    </div>
  );
}

export default function UtilitiesPage() {
  const queryClient = useQueryClient();
  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => now.getMonth() + 1);
  const [year, setYear] = useState(() => now.getFullYear());
  const [selectedArea, setSelectedArea] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);

  const { data: areas = [] } = useQuery({
    queryKey: ["areas"],
    queryFn: getAreas,
  });

  const {
    data: sheetData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["utilitySheet", selectedArea || "all", month, year],
    queryFn: () =>
      getUtilitySheet({
        areaId: selectedArea || undefined,
        month,
        year,
      }),
  });

  // Tất cả phòng đang thuê (để tính tổng số phòng cần chốt trong kỳ)
  const rentingItems = useMemo(
    () =>
      (sheetData?.items ?? []).filter((item) => {
        if (item.roomStatus !== "renting") return false;
        if (selectedArea && String(item.areaId) !== String(selectedArea)) {
          return false;
        }
        return true;
      }),
    [sheetData, selectedArea]
  );

  // Chỉ hiển thị những bản ghi ĐÃ NHẬP của đúng tháng/năm đang chọn
  const recordedItems = useMemo(
    () => rentingItems.filter((item) => item.isRecorded),
    [rentingItems]
  );

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase("vi");
    if (!query) return recordedItems;
    return recordedItems.filter((item) => {
      const text = `${item.roomCode} ${item.areaName} ${item.tenantName}`.toLocaleLowerCase(
        "vi"
      );
      return text.includes(query);
    });
  }, [recordedItems, searchTerm]);

  const stats = useMemo(() => {
    let elecUsage = 0;
    let elecMoney = 0;
    let waterUsage = 0;
    let waterMoney = 0;

    for (const item of recordedItems) {
      elecUsage += Number(item.electricity?.usage) || 0;
      elecMoney += Number(item.electricity?.amount) || 0;
      waterUsage += Number(item.water?.usage) || 0;
      waterMoney += Number(item.water?.amount) || 0;
    }

    return {
      recordedCount: recordedItems.length,
      rentingCount: rentingItems.length,
      elecUsage,
      elecMoney,
      waterUsage,
      waterMoney,
      totalMoney: elecMoney + waterMoney,
    };
  }, [recordedItems, rentingItems]);

  const deleteMutation = useMutation({
    mutationFn: deleteUtilityReading,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utilitySheet"] });
      queryClient.invalidateQueries({ queryKey: ["utilities"] });
      toast.success(`Đã xóa bản ghi điện nước Tháng ${month}/${year}.`);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Xóa bản ghi điện nước thất bại."
      );
    },
  });

  const handleOpenInputModal = () => {
    setIsInputModalOpen(true);
  };

  return (
    <div className="w-full space-y-4 px-2 py-3 lg:px-4 lg:py-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-tight text-[#20243c] sm:text-[22px]">
            Điện & nước
          </h1>
          <p className="mt-0.5 text-xs text-[#8c92a6]">
            Quản lý và tra cứu lịch sử chỉ số điện, nước đã chốt theo từng tháng
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Chọn Tháng / Năm */}
          <CustomSelect
            size="sm"
            value={month}
            onChange={(val) => setMonth(Number(val))}
            options={Array.from({ length: 12 }, (_, i) => ({
              value: i + 1,
              label: `Tháng ${i + 1}`,
            }))}
            className="w-[108px]"
          />
          <CustomSelect
            size="sm"
            value={year}
            onChange={(val) => setYear(Number(val))}
            options={[2025, 2026, 2027].map((y) => ({
              value: y,
              label: `Năm ${y}`,
            }))}
            className="w-[108px]"
          />

          <button
            type="button"
            onClick={handleOpenInputModal}
            className="inline-flex h-8 items-center justify-center gap-1 rounded-[8px] bg-[#6756df] px-3 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#5b4bc7]"
          >
            <Plus size={13} />
            Nhập điện nước T{month}/{year}
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={CheckCircle2}
          label={`Đã chốt Tháng ${month}/${year}`}
          value={`${stats.recordedCount}/${stats.rentingCount} phòng`}
          subtext="Số phòng đang thuê đã ghi chỉ số"
          tone="bg-[#e3f8f0] text-[#159878]"
        />
        <StatCard
          icon={Zap}
          label="Tổng điện tiêu thụ"
          value={`${stats.elecUsage} kWh`}
          subtext={formatVnd(stats.elecMoney)}
          tone="bg-[#fff2de] text-[#d97706]"
        />
        <StatCard
          icon={Droplets}
          label="Tổng nước tiêu thụ"
          value={`${stats.waterUsage} m³`}
          subtext={formatVnd(stats.waterMoney)}
          tone="bg-[#e0f2fe] text-[#0284c7]"
        />
        <StatCard
          icon={Calculator}
          label="Tổng tiền điện + nước"
          value={formatVnd(stats.totalMoney)}
          subtext={`Kỳ tháng ${month}/${year}`}
          tone="bg-[#f1effe] text-[#6756df]"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-2.5 rounded-2xl border border-[#ebeaf3] bg-white p-2.5 shadow-[0_2px_12px_rgba(31,33,87,0.02)] sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9da2b4]"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã phòng, tên khách thuê, khu vực..."
            className="h-9 w-full rounded-[10px] border border-[#e5e6ef] bg-[#fafafe] pl-9 pr-3 text-xs text-[#20243c] outline-none placeholder:text-[#9da2b4] focus:border-[#6756df] focus:bg-white"
          />
        </div>

        <AreaSearchDropdown
          areas={areas}
          selectedAreaId={selectedArea}
          onSelectArea={(areaId) => setSelectedArea(areaId)}
        />
      </div>

      {/* Table: Chỉ hiển thị bản ghi đã chốt của Tháng/Năm đang chọn */}
      <div className="overflow-hidden rounded-2xl border border-[#ebeaf3] bg-white shadow-[0_2px_12px_rgba(31,33,87,0.02)]">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-xs text-[#8c92a6]">
            <Loader2 size={16} className="animate-spin text-[#6756df]" />
            Đang tải dữ liệu điện nước Tháng {month}/{year}...
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-xs text-red-500">
            Không thể tải dữ liệu điện nước.
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2.5 py-12 text-center">
            <p className="text-xs font-semibold text-[#54596e]">
              Chưa có dữ liệu điện nước nào được ghi nhận trong Tháng {month}/
              {year}.
            </p>
            <p className="text-[11px] text-[#9298aa]">
              Khi nhập Tháng {month}/{year}, chỉ số cũ sẽ tự động lấy từ chỉ số
              mới của tháng trước.
            </p>
            <button
              type="button"
              onClick={handleOpenInputModal}
              className="mt-1 inline-flex h-8 items-center justify-center gap-1 rounded-[8px] border border-[#d9d4ff] bg-[#f5f3ff] px-3 text-[11.5px] font-semibold text-[#6756df] transition-colors hover:bg-[#ece8ff]"
            >
              <Zap size={13} className="text-amber-500" />
              Nhập điện nước Tháng {month}/{year}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#eeeff6] bg-[#fafafd] text-[10.5px] font-bold uppercase tracking-wider text-[#8c92a6]">
                  <th className="px-4 py-3">Phòng & Khu</th>
                  <th className="px-3 py-3">Khách đại diện</th>
                  <th
                    colSpan={4}
                    className="border-l border-[#eeeff6] bg-amber-50/40 px-3 py-2 text-center text-amber-700"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Zap size={12} className="text-amber-500" />
                      Điện (kWh) — Kỳ {month}/{year}
                    </span>
                  </th>
                  <th
                    colSpan={4}
                    className="border-l border-[#eeeff6] bg-sky-50/40 px-3 py-2 text-center text-sky-700"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Droplets size={12} className="text-sky-500" />
                      Nước (m³) — Kỳ {month}/{year}
                    </span>
                  </th>
                  <th className="border-l border-[#eeeff6] px-4 py-3 text-right">
                    Tổng cộng
                  </th>
                </tr>
                <tr className="border-b border-[#eeeff6] bg-[#fcfcfe] text-[10.5px] font-semibold text-[#8c92a6]">
                  <th className="px-4 py-1.5">Mã phòng</th>
                  <th className="px-3 py-1.5">Người thuê</th>
                  {/* Điện */}
                  <th className="border-l border-[#eeeff6] px-2.5 py-1.5 text-center">
                    Số cũ
                  </th>
                  <th className="px-2.5 py-1.5 text-center">Số mới</th>
                  <th className="px-2.5 py-1.5 text-center">Tiêu thụ</th>
                  <th className="px-2.5 py-1.5 text-right">Tiền điện</th>
                  {/* Nước */}
                  <th className="border-l border-[#eeeff6] px-2.5 py-1.5 text-center">
                    Số cũ
                  </th>
                  <th className="px-2.5 py-1.5 text-center">Số mới</th>
                  <th className="px-2.5 py-1.5 text-center">Tiêu thụ</th>
                  <th className="px-2.5 py-1.5 text-right">Tiền nước</th>
                  {/* Tổng */}
                  <th className="border-l border-[#eeeff6] px-4 py-1.5 text-right">
                    Điện + Nước
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f2f7]">
                {filteredItems.map((item) => (
                  <tr
                    key={item.roomId}
                    className="transition-colors hover:bg-[#fafafd]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-[#20243c]">
                          {item.roomCode}
                        </span>
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-700">
                          T{month}/{year}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#9298aa]">
                        {item.areaName}
                        {item.row ? ` · ${item.row}` : ""}
                      </p>
                    </td>

                    <td className="px-3 py-3">
                      {item.tenantName ? (
                        <span className="font-semibold text-[#20243c]">
                          {item.tenantName}
                        </span>
                      ) : (
                        <span className="text-[#a0a5b8]">—</span>
                      )}
                    </td>

                    {/* Điện */}
                    <td className="border-l border-[#eeeff6] px-2.5 py-3 text-center font-semibold text-[#54596e]">
                      {item.electricity.oldIndex}
                    </td>
                    <td className="px-2.5 py-3 text-center font-extrabold text-[#20243c]">
                      {item.electricity.newIndex}
                    </td>
                    <td className="px-2.5 py-3 text-center font-bold text-amber-600">
                      {item.electricity.usage} kWh
                    </td>
                    <td className="px-2.5 py-3 text-right font-semibold text-[#20243c]">
                      {formatVnd(item.electricity.amount)}
                    </td>

                    {/* Nước */}
                    <td className="border-l border-[#eeeff6] px-2.5 py-3 text-center font-semibold text-[#54596e]">
                      {item.water.oldIndex}
                    </td>
                    <td className="px-2.5 py-3 text-center font-extrabold text-[#20243c]">
                      {item.water.newIndex}
                    </td>
                    <td className="px-2.5 py-3 text-center font-bold text-sky-600">
                      {item.water.usage} m³
                    </td>
                    <td className="px-2.5 py-3 text-right font-semibold text-[#20243c]">
                      {formatVnd(item.water.amount)}
                    </td>

                    {/* Tổng cộng */}
                    <td className="border-l border-[#eeeff6] px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[13px] font-extrabold text-[#6756df]">
                          {formatVnd(item.totalAmount)}
                        </span>
                        {item.readingId && (
                          <button
                            type="button"
                            title="Xóa bản ghi này"
                            onClick={() =>
                              deleteMutation.mutate(item.readingId)
                            }
                            className="grid h-7 w-7 place-items-center rounded-lg text-[#9da2b4] transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal nhập / chỉnh sửa chỉ số */}
      <AreaUtilityModal
        isOpen={isInputModalOpen}
        onClose={() => setIsInputModalOpen(false)}
        areas={areas}
        defaultAreaId={selectedArea}
        defaultMonth={month}
        defaultYear={year}
      />
    </div>
  );
}
