import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Zap,
  Droplets,
  Check,
  Loader2,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import AreaSearchDropdown from "./AreaSearchDropdown.jsx";
import CustomSelect from "./CustomSelect.jsx";
import {
  bulkSaveUtilityReadings,
  deleteUtilityReading,
  getUtilitySheet,
} from "../services/utilityService.js";

function formatVnd(value) {
  return `${Math.round(Number(value) || 0).toLocaleString("vi-VN")} đ`;
}

export default function AreaUtilityModal({
  isOpen,
  onClose,
  area = null,
  areas = [],
  defaultAreaId = "",
  defaultMonth,
  defaultYear,
}) {
  const queryClient = useQueryClient();
  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(() => defaultMonth || now.getMonth() + 1);
  const [year, setYear] = useState(() => defaultYear || now.getFullYear());
  const [selectedAreaId, setSelectedAreaId] = useState(
    () => area?.id || defaultAreaId || ""
  );
  const [filterStatus, setFilterStatus] = useState("");
  const [drafts, setDrafts] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

  // Nếu mở từ thẻ Khu cố định (area prop) thì dùng area.id, ngược lại dùng bộ lọc khu trong modal
  const activeAreaId = area?.id ? String(area.id) : selectedAreaId;

  const activeAreaName = useMemo(() => {
    if (area?.name) return area.name;
    if (!activeAreaId) return "Tất cả khu";
    const found = areas.find(
      (a) => String(a.id || a._id) === String(activeAreaId)
    );
    return found?.name || "Tất cả khu";
  }, [area, areas, activeAreaId]);

  const contextKey = `${ isOpen ? "open" : "closed"}-${area?.id || defaultAreaId}-${defaultMonth || ""}-${defaultYear || ""}`;
  const [lastContextKey, setLastContextKey] = useState(contextKey);
  if (contextKey !== lastContextKey) {
    setLastContextKey(contextKey);
    if (defaultMonth) setMonth(defaultMonth);
    if (defaultYear) setYear(defaultYear);
    setSelectedAreaId(area?.id || defaultAreaId || "");
    setDrafts({});
    setErrorMessage("");
  }

  const periodKey = `${activeAreaId}-${year}-${month}`;
  const [lastPeriodKey, setLastPeriodKey] = useState(periodKey);
  if (periodKey !== lastPeriodKey) {
    setLastPeriodKey(periodKey);
    setDrafts({});
    setErrorMessage("");
  }

  const { data: sheetData, isLoading } = useQuery({
    queryKey: ["utilitySheet", activeAreaId || "all", month, year],
    queryFn: () =>
      getUtilitySheet({
        areaId: activeAreaId || undefined,
        month,
        year,
      }),
    enabled: Boolean(isOpen),
  });

  const items = useMemo(
    () =>
      (sheetData?.items ?? []).filter((item) => {
        if (item.roomStatus !== "renting") return false;
        if (activeAreaId && String(item.areaId) !== String(activeAreaId)) {
          return false;
        }
        return true;
      }),
    [sheetData, activeAreaId]
  );

  const filteredItems = useMemo(() => {
    if (filterStatus === "recorded")
      return items.filter((item) => item.isRecorded);
    if (filterStatus === "unrecorded")
      return items.filter((item) => !item.isRecorded);
    return items;
  }, [items, filterStatus]);

  const getRowValues = (item) => {
    const d = drafts[item.roomId];
    return {
      elecOld:
        d?.elecOld !== undefined
          ? d.elecOld
          : String(item.electricity.oldIndex ?? 0),
      elecNew:
        d?.elecNew !== undefined
          ? d.elecNew
          : item.isRecorded &&
              item.electricity.newIndex !== null &&
              item.electricity.newIndex !== undefined
            ? String(item.electricity.newIndex)
            : "",
      elecPrice:
        d?.elecPrice !== undefined
          ? d.elecPrice
          : String(item.electricity.unitPrice ?? 3500),
      waterOld:
        d?.waterOld !== undefined
          ? d.waterOld
          : String(item.water.oldIndex ?? 0),
      waterNew:
        d?.waterNew !== undefined
          ? d.waterNew
          : item.isRecorded &&
              item.water.newIndex !== null &&
              item.water.newIndex !== undefined
            ? String(item.water.newIndex)
            : "",
      waterPrice:
        d?.waterPrice !== undefined
          ? d.waterPrice
          : String(item.water.unitPrice ?? 20000),
    };
  };

  const handleFieldChange = (item, field, value) => {
    setDrafts((prev) => {
      const current = getRowValues(item);
      return {
        ...prev,
        [item.roomId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const saveMutation = useMutation({
    mutationFn: bulkSaveUtilityReadings,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["utilitySheet"] });
      queryClient.invalidateQueries({ queryKey: ["utilities"] });
      toast.success(
        `Đã lưu chỉ số điện nước Tháng ${month}/${year} cho ${res?.savedCount || 0} phòng!`
      );
      setDrafts({});
      setErrorMessage("");
      onClose();
    },
    onError: (error) => {
      const msg =
        error.response?.data?.message ||
        "Lưu chỉ số điện nước thất bại. Vui lòng kiểm tra lại.";
      setErrorMessage(msg);
      toast.error(msg);
    },
  });

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

  const summary = useMemo(() => {
    let totalElecUsage = 0;
    let totalElecAmount = 0;
    let totalWaterUsage = 0;
    let totalWaterAmount = 0;

    for (const item of filteredItems) {
      const v = getRowValues(item);
      const eOld = Number(v.elecOld) || 0;
      const eNew = v.elecNew !== "" ? Number(v.elecNew) : null;
      const wOld = Number(v.waterOld) || 0;
      const wNew = v.waterNew !== "" ? Number(v.waterNew) : null;

      if (eNew !== null && eNew >= eOld) {
        const usage = eNew - eOld;
        totalElecUsage += usage;
        totalElecAmount += usage * (Number(v.elecPrice) || 0);
      }
      if (wNew !== null && wNew >= wOld) {
        const usage = wNew - wOld;
        totalWaterUsage += usage;
        totalWaterAmount += usage * (Number(v.waterPrice) || 0);
      }
    }

    return {
      totalElecUsage,
      totalElecAmount,
      totalWaterUsage,
      totalWaterAmount,
      totalAmount: totalElecAmount + totalWaterAmount,
    };
  }, [filteredItems, drafts]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setErrorMessage("");

    const readingsToSave = [];
    for (const item of filteredItems) {
      const v = getRowValues(item);
      const hasChanged = Boolean(drafts[item.roomId]);
      const hasBothNew = v.elecNew !== "" && v.waterNew !== "";

      if (!hasBothNew) {
        if (hasChanged && (v.elecNew !== "" || v.waterNew !== "")) {
          setErrorMessage(
            `Phòng ${item.roomCode}: Vui lòng nhập đủ cả chỉ số điện mới và nước mới.`
          );
          return;
        }
        continue;
      }

      const eOld = Number(v.elecOld) || 0;
      const eNew = Number(v.elecNew);
      const wOld = Number(v.waterOld) || 0;
      const wNew = Number(v.waterNew);

      if (eNew < eOld) {
        setErrorMessage(
          `Phòng ${item.roomCode}: Chỉ số điện mới (${eNew}) không được nhỏ hơn số cũ (${eOld}).`
        );
        return;
      }
      if (wNew < wOld) {
        setErrorMessage(
          `Phòng ${item.roomCode}: Chỉ số nước mới (${wNew}) không được nhỏ hơn số cũ (${wOld}).`
        );
        return;
      }

      if (hasChanged || !item.isRecorded) {
        readingsToSave.push({
          roomId: item.roomId,
          electricity: {
            oldIndex: eOld,
            newIndex: eNew,
            unitPrice: Number(v.elecPrice) || 0,
          },
          water: {
            oldIndex: wOld,
            newIndex: wNew,
            unitPrice: Number(v.waterPrice) || 0,
          },
        });
      }
    }

    if (readingsToSave.length === 0) {
      toast("Chưa có chỉ số mới hoặc thay đổi nào để lưu.");
      return;
    }

    saveMutation.mutate({
      month,
      year,
      readings: readingsToSave,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#181b2e]/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[20px] border border-[#e7e7ef] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#eeeff6] px-6 py-4">
          <div>
            <h2 className="text-lg font-extrabold text-[#20243c]">
              Nhập điện nước — {activeAreaName}
            </h2>
            <p className="mt-0.5 text-xs text-[#9298aa]">
              Chỉ số cũ tự động lấy từ chỉ số mới của tháng trước
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

        {/* Form Body */}
        <form
          onSubmit={handleSave}
          className="flex flex-1 flex-col overflow-hidden"
        >
          {/* Thanh chọn Kỳ chốt, Khu vực & Bộ lọc */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#eeeff6] bg-[#fafafd] px-6 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#3e435b]">Kỳ chốt:</span>
              <CustomSelect
                size="sm"
                value={month}
                onChange={(val) => setMonth(Number(val))}
                options={Array.from({ length: 12 }, (_, i) => ({
                  value: i + 1,
                  label: `Tháng ${i + 1}`,
                }))}
                className="w-[106px]"
              />
              <CustomSelect
                size="sm"
                value={year}
                onChange={(val) => setYear(Number(val))}
                options={[2025, 2026, 2027].map((y) => ({
                  value: y,
                  label: `Năm ${y}`,
                }))}
                className="w-[106px]"
              />

              {/* Nếu không khóa cứng 1 khu thì hiện bộ lọc chọn khu ngay trong modal */}
              {!area && areas.length > 0 && (
                <AreaSearchDropdown
                  areas={areas}
                  selectedAreaId={selectedAreaId}
                  onSelectArea={(aId) => setSelectedAreaId(aId)}
                  className="w-[200px]"
                />
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {[
                { value: "", label: `Tất cả (${items.length})` },
                {
                  value: "unrecorded",
                  label: `Chưa chốt (${items.filter((i) => !i.isRecorded).length})`,
                },
                {
                  value: "recorded",
                  label: `Đã chốt (${items.filter((i) => i.isRecorded).length})`,
                },
              ].map((tab) => {
                const active = filterStatus === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setFilterStatus(tab.value)}
                    className={`h-8 rounded-[8px] border px-2.5 text-[11.5px] font-semibold transition-colors ${
                      active
                        ? "border-[#6756df] bg-[#efedff] text-[#6756df]"
                        : "border-[#e5e6ee] bg-white text-[#66697c] hover:bg-slate-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nội dung bảng nhập */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {errorMessage && (
              <p className="mb-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600">
                {errorMessage}
              </p>
            )}

            {isLoading ? (
              <div className="py-12 text-center text-xs text-[#9298aa]">
                Đang tải bảng chỉ số điện nước...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="rounded-[12px] border border-dashed border-[#dfe1eb] bg-[#fafaff] py-10 text-center text-xs text-[#8c92a6]">
                Không có phòng nào trong danh sách này.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-[12px] border border-[#e5e6ee]">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#eeeff6] bg-[#f7f8fc] text-[11px] font-bold text-[#54596e]">
                      <th className="px-3.5 py-2.5">Phòng / Khách</th>
                      <th
                        colSpan={3}
                        className="border-l border-[#eeeff6] bg-amber-50/50 px-3 py-2 text-center text-amber-700"
                      >
                        <span className="inline-flex items-center gap-1">
                          <Zap size={12} className="text-amber-500" />
                          Điện (kWh)
                        </span>
                      </th>
                      <th
                        colSpan={3}
                        className="border-l border-[#eeeff6] bg-sky-50/50 px-3 py-2 text-center text-sky-700"
                      >
                        <span className="inline-flex items-center gap-1">
                          <Droplets size={12} className="text-sky-500" />
                          Nước (m³)
                        </span>
                      </th>
                      <th className="border-l border-[#eeeff6] px-3.5 py-2.5 text-right">
                        Thành tiền
                      </th>
                    </tr>
                    <tr className="border-b border-[#eeeff6] bg-[#fafafd] text-[10.5px] font-semibold text-[#8c92a6]">
                      <th className="px-3.5 py-1.5">Mã phòng</th>
                      <th className="w-24 border-l border-[#eeeff6] px-2 py-1.5 text-center">
                        Số cũ
                      </th>
                      <th className="w-28 px-2 py-1.5 text-center">
                        Số mới (T{month})
                      </th>
                      <th className="w-20 px-2 py-1.5 text-center">Tiêu thụ</th>
                      <th className="w-24 border-l border-[#eeeff6] px-2 py-1.5 text-center">
                        Số cũ
                      </th>
                      <th className="w-28 px-2 py-1.5 text-center">
                        Số mới (T{month})
                      </th>
                      <th className="w-20 px-2 py-1.5 text-center">Tiêu thụ</th>
                      <th className="w-32 border-l border-[#eeeff6] px-3.5 py-1.5 text-right">
                        Điện + Nước
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f1f7]">
                    {filteredItems.map((item) => {
                      const v = getRowValues(item);
                      const eOld = Number(v.elecOld) || 0;
                      const eNew =
                        v.elecNew !== "" ? Number(v.elecNew) : null;
                      const eInvalid = eNew !== null && eNew < eOld;
                      const eUsage =
                        eNew !== null && !eInvalid ? eNew - eOld : 0;
                      const eAmount = eUsage * (Number(v.elecPrice) || 0);

                      const wOld = Number(v.waterOld) || 0;
                      const wNew =
                        v.waterNew !== "" ? Number(v.waterNew) : null;
                      const wInvalid = wNew !== null && wNew < wOld;
                      const wUsage =
                        wNew !== null && !wInvalid ? wNew - wOld : 0;
                      const wAmount = wUsage * (Number(v.waterPrice) || 0);

                      const rowTotal = eAmount + wAmount;
                      const hasPrev = Boolean(item.prevPeriod);

                      return (
                        <tr
                          key={item.roomId}
                          className="transition-colors hover:bg-[#fafafd]"
                        >
                          {/* Phòng & Khách */}
                          <td className="px-3.5 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-[#20243c]">
                                {item.roomCode}
                              </span>
                              {item.isRecorded ? (
                                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-700">
                                  Đã chốt T{month}
                                </span>
                              ) : (
                                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-600">
                                  Chưa chốt
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-[11px] text-[#8c92a6]">
                              {!area && item.areaName ? `${item.areaName} · ` : ""}
                              {item.tenantName || "Chưa có người đại diện"}
                            </p>
                          </td>

                          {/* Điện: Số cũ */}
                          <td className="border-l border-[#eeeff6] px-2 py-2 text-center">
                            <input
                              type="number"
                              min="0"
                              readOnly={hasPrev}
                              title={
                                hasPrev
                                  ? `Tự động lấy từ số mới Tháng ${item.prevPeriod.month}/${item.prevPeriod.year}`
                                  : "Nhập chỉ số cũ ban đầu"
                              }
                              value={v.elecOld}
                              onChange={(e) =>
                                handleFieldChange(
                                  item,
                                  "elecOld",
                                  e.target.value
                                )
                              }
                              className={`h-8 w-20 rounded-[8px] border border-[#e5e6ee] px-2 text-center text-xs font-semibold outline-none ${
                                hasPrev
                                  ? "cursor-not-allowed bg-[#f2f3f8] text-[#6d7388]"
                                  : "bg-[#f7f8fc] text-[#54596e] focus:border-[#6756df] focus:bg-white"
                              }`}
                            />
                            {hasPrev && (
                              <p className="mt-0.5 text-[9.5px] text-[#9298aa]">
                                Từ T{item.prevPeriod.month}
                              </p>
                            )}
                          </td>

                          {/* Điện: Số mới */}
                          <td className="px-2 py-2 text-center">
                            <input
                              type="number"
                              min="0"
                              placeholder="Nhập mới..."
                              value={v.elecNew}
                              onChange={(e) =>
                                handleFieldChange(
                                  item,
                                  "elecNew",
                                  e.target.value
                                )
                              }
                              className={`h-8 w-24 rounded-[8px] border px-2 text-center text-xs font-bold outline-none placeholder:font-normal placeholder:text-[#b4b9c9] transition ${
                                eInvalid
                                  ? "border-rose-400 bg-rose-50 text-rose-600"
                                  : v.elecNew !== ""
                                    ? "border-[#6756df] bg-white text-[#20243c]"
                                    : "border-[#e5e6ee] bg-white text-[#20243c] focus:border-[#6756df]"
                              }`}
                            />
                          </td>

                          {/* Điện: Tiêu thụ */}
                          <td className="px-2 py-2 text-center font-bold text-amber-600">
                            {eInvalid ? (
                              <span className="text-[10.5px] text-rose-600">
                                Mới &lt; Cũ
                              </span>
                            ) : eNew === null ? (
                              <span className="text-[#b4b9c9]">—</span>
                            ) : (
                              <div>
                                <span>{eUsage}</span>
                                <p className="text-[10px] font-normal text-[#9298aa]">
                                  {formatVnd(eAmount)}
                                </p>
                              </div>
                            )}
                          </td>

                          {/* Nước: Số cũ */}
                          <td className="border-l border-[#eeeff6] px-2 py-2 text-center">
                            <input
                              type="number"
                              min="0"
                              readOnly={hasPrev}
                              title={
                                hasPrev
                                  ? `Tự động lấy từ số mới Tháng ${item.prevPeriod.month}/${item.prevPeriod.year}`
                                  : "Nhập chỉ số cũ ban đầu"
                              }
                              value={v.waterOld}
                              onChange={(e) =>
                                handleFieldChange(
                                  item,
                                  "waterOld",
                                  e.target.value
                                )
                              }
                              className={`h-8 w-20 rounded-[8px] border border-[#e5e6ee] px-2 text-center text-xs font-semibold outline-none ${
                                hasPrev
                                  ? "cursor-not-allowed bg-[#f2f3f8] text-[#6d7388]"
                                  : "bg-[#f7f8fc] text-[#54596e] focus:border-[#6756df] focus:bg-white"
                              }`}
                            />
                            {hasPrev && (
                              <p className="mt-0.5 text-[9.5px] text-[#9298aa]">
                                Từ T{item.prevPeriod.month}
                              </p>
                            )}
                          </td>

                          {/* Nước: Số mới */}
                          <td className="px-2 py-2 text-center">
                            <input
                              type="number"
                              min="0"
                              placeholder="Nhập mới..."
                              value={v.waterNew}
                              onChange={(e) =>
                                handleFieldChange(
                                  item,
                                  "waterNew",
                                  e.target.value
                                )
                              }
                              className={`h-8 w-24 rounded-[8px] border px-2 text-center text-xs font-bold outline-none placeholder:font-normal placeholder:text-[#b4b9c9] transition ${
                                wInvalid
                                  ? "border-rose-400 bg-rose-50 text-rose-600"
                                  : v.waterNew !== ""
                                    ? "border-[#6756df] bg-white text-[#20243c]"
                                    : "border-[#e5e6ee] bg-white text-[#20243c] focus:border-[#6756df]"
                              }`}
                            />
                          </td>

                          {/* Nước: Tiêu thụ */}
                          <td className="px-2 py-2 text-center font-bold text-sky-600">
                            {wInvalid ? (
                              <span className="text-[10.5px] text-rose-600">
                                Mới &lt; Cũ
                              </span>
                            ) : wNew === null ? (
                              <span className="text-[#b4b9c9]">—</span>
                            ) : (
                              <div>
                                <span>{wUsage}</span>
                                <p className="text-[10px] font-normal text-[#9298aa]">
                                  {formatVnd(wAmount)}
                                </p>
                              </div>
                            )}
                          </td>

                          {/* Tổng cộng của phòng */}
                          <td className="border-l border-[#eeeff6] px-3.5 py-2 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="font-extrabold text-[#6756df]">
                                {eNew !== null && wNew !== null
                                  ? formatVnd(rowTotal)
                                  : "—"}
                              </span>
                              {item.readingId && (
                                <button
                                  type="button"
                                  title="Xóa bản ghi tháng này"
                                  onClick={() =>
                                    deleteMutation.mutate(item.readingId)
                                  }
                                  className="grid h-6 w-6 place-items-center rounded text-[#9da2b4] transition hover:bg-rose-50 hover:text-rose-600"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#eeeff6] bg-[#fafafd] px-6 py-3.5">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="text-[#54596e]">
                Điện:{" "}
                <strong className="text-amber-600">
                  {summary.totalElecUsage} kWh
                </strong>{" "}
                ({formatVnd(summary.totalElecAmount)})
              </span>
              <span className="text-[#54596e]">
                Nước:{" "}
                <strong className="text-sky-600">
                  {summary.totalWaterUsage} m³
                </strong>{" "}
                ({formatVnd(summary.totalWaterAmount)})
              </span>
              <span className="text-[#20243c]">
                Tổng cộng:{" "}
                <strong className="text-sm font-extrabold text-[#6756df]">
                  {formatVnd(summary.totalAmount)}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saveMutation.isPending}
                className="inline-flex h-8 items-center justify-center rounded-[8px] border border-[#e5e6ee] bg-white px-3 text-[11.5px] font-semibold text-[#54596e] transition-colors hover:bg-slate-50"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="inline-flex h-8 items-center justify-center gap-1 rounded-[8px] bg-[#6756df] px-3 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#5b4bc7] disabled:opacity-60"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Check size={13} />
                    Lưu chỉ số T{month}/{year}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
