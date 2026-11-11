import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, ReceiptText, X, Zap } from "lucide-react";
import toast from "react-hot-toast";
import AreaSearchDropdown from "./AreaSearchDropdown.jsx";
import CustomSelect from "./CustomSelect.jsx";
import {
  bulkGenerateInvoices,
  getInvoiceSheet,
} from "../services/invoiceService.js";

function formatVnd(value) {
  return `${Math.round(Number(value) || 0).toLocaleString("vi-VN")} đ`;
}

export default function CreateInvoiceModal({
  open,
  onClose,
  areas = [],
  defaultAreaId = "",
  defaultMonth,
  defaultYear,
}) {
  const queryClient = useQueryClient();
  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(defaultMonth || now.getMonth() + 1);
  const [year, setYear] = useState(defaultYear || now.getFullYear());
  const [selectedAreaId, setSelectedAreaId] = useState(defaultAreaId || "");
  const [filterMode, setFilterMode] = useState("all"); // all | unbilled | billed
  const [selectedRooms, setSelectedRooms] = useState({});
  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    if (open) {
      if (defaultMonth) setMonth(defaultMonth);
      if (defaultYear) setYear(defaultYear);
      setSelectedAreaId(defaultAreaId || "");
    }
  }, [open, defaultMonth, defaultYear, defaultAreaId]);

  const { data: sheetData, isLoading } = useQuery({
    queryKey: ["invoiceSheet", selectedAreaId || "all", month, year],
    queryFn: () =>
      getInvoiceSheet({
        areaId: selectedAreaId || undefined,
        month,
        year,
      }),
    enabled: Boolean(open),
  });

  const items = useMemo(() => sheetData?.items ?? [], [sheetData]);

  useEffect(() => {
    if (!sheetData?.items) return;
    const nextDrafts = {};
    const nextSelected = {};
    for (const item of sheetData.items) {
      nextDrafts[item.roomId] = {
        roomPrice: String(item.roomPrice ?? 0),
        internetFee: String(item.internetFee ?? 100000),
        garbageFee: String(item.garbageFee ?? 30000),
        otherFee: String(item.otherFee ?? 0),
        discount: String(item.discount ?? 0),
      };
      // Mặc định tích chọn các phòng chưa lập hóa đơn hoặc chưa thu đủ
      if (!item.isInvoiced || item.status !== "paid") {
        nextSelected[item.roomId] = true;
      }
    }
    setDrafts(nextDrafts);
    setSelectedRooms(nextSelected);
  }, [sheetData]);

  const visibleItems = useMemo(() => {
    if (filterMode === "unbilled") {
      return items.filter((item) => !item.isInvoiced);
    }
    if (filterMode === "billed") {
      return items.filter((item) => item.isInvoiced);
    }
    return items;
  }, [items, filterMode]);

  const updateDraft = (roomId, field, value) => {
    if (value !== "" && !/^\d*$/.test(value)) return;
    setDrafts((prev) => ({
      ...prev,
      [roomId]: {
        ...(prev[roomId] || {}),
        [field]: value,
      },
    }));
  };

  const toggleRoom = (roomId) => {
    setSelectedRooms((prev) => ({
      ...prev,
      [roomId]: !prev[roomId],
    }));
  };

  const toggleAllVisible = () => {
    const allChecked =
      visibleItems.length > 0 &&
      visibleItems.every((item) => Boolean(selectedRooms[item.roomId]));
    const next = { ...selectedRooms };
    for (const item of visibleItems) {
      next[item.roomId] = !allChecked;
    }
    setSelectedRooms(next);
  };

  const calcRowTotal = (item) => {
    const d = drafts[item.roomId];
    const roomPrice = Number(d?.roomPrice ?? item.roomPrice) || 0;
    const internetFee = Number(d?.internetFee ?? item.internetFee) || 0;
    const garbageFee = Number(d?.garbageFee ?? item.garbageFee) || 0;
    const otherFee = Number(d?.otherFee ?? item.otherFee) || 0;
    const discount = Number(d?.discount ?? item.discount) || 0;
    const utilityAmount = Number(item.utilityAmount) || 0;
    return Math.max(
      0,
      roomPrice + utilityAmount + internetFee + garbageFee + otherFee - discount
    );
  };

  const summary = useMemo(() => {
    let selectedCount = 0;
    let totalMoney = 0;
    let unbilledCount = 0;
    let billedCount = 0;

    for (const item of items) {
      if (item.isInvoiced) billedCount += 1;
      else unbilledCount += 1;

      if (selectedRooms[item.roomId]) {
        selectedCount += 1;
        totalMoney += calcRowTotal(item);
      }
    }
    return { selectedCount, totalMoney, unbilledCount, billedCount };
  }, [items, selectedRooms, drafts]);

  const generateMutation = useMutation({
    mutationFn: bulkGenerateInvoices,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoiceSheet"] });
      queryClient.invalidateQueries({ queryKey: ["utilitySheet"] });
      toast.success(
        `Đã lập/cập nhật hóa đơn cho ${res?.savedCount ?? 0} phòng!`
      );
      onClose?.();
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message || err.message || "Lập hóa đơn thất bại."
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payloadItems = [];
    for (const item of items) {
      if (!selectedRooms[item.roomId]) continue;
      const d = drafts[item.roomId] || {};
      payloadItems.push({
        roomId: item.roomId,
        roomPrice: Number(d.roomPrice ?? item.roomPrice) || 0,
        internetFee: Number(d.internetFee ?? item.internetFee) || 0,
        garbageFee: Number(d.garbageFee ?? item.garbageFee) || 0,
        otherFee: Number(d.otherFee ?? item.otherFee) || 0,
        discount: Number(d.discount ?? item.discount) || 0,
      });
    }

    if (payloadItems.length === 0) {
      toast.error("Vui lòng tích chọn ít nhất 1 phòng để lập hóa đơn.");
      return;
    }

    generateMutation.mutate({
      month: Number(month),
      year: Number(year),
      items: payloadItems,
    });
  };

  if (!open) return null;

  const selectedAreaObj = areas.find(
    (a) => String(a.id || a._id) === String(selectedAreaId)
  );
  const titleSuffix = selectedAreaObj ? selectedAreaObj.name : "Tất cả khu";
  const allVisibleChecked =
    visibleItems.length > 0 &&
    visibleItems.every((item) => Boolean(selectedRooms[item.roomId]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={() => !generateMutation.isPending && onClose?.()}
        className="absolute inset-0 bg-[#1c1f37]/45 backdrop-blur-[2px]"
      />
      <section
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex max-h-[90vh] w-full max-w-[960px] flex-col overflow-hidden rounded-[20px] border border-[#e7e7ef] bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#eeeff6] px-6 py-4">
          <div>
            <h2 className="text-[17px] font-extrabold text-[#20243c]">
              Lập hóa đơn tiền trọ — {titleSuffix}
            </h2>
            <p className="mt-0.5 text-xs text-[#878da1]">
              Tự động gom tiền thuê phòng, chỉ số điện nước kỳ T{month}/{year} và
              phí dịch vụ theo hợp đồng
            </p>
          </div>
          <button
            type="button"
            disabled={generateMutation.isPending}
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-[#7c8197] hover:bg-[#f4f4fb]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col px-6 py-5"
        >
          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#333752]">Kỳ thu:</span>
              <CustomSelect
                value={month}
                onChange={(val) => setMonth(Number(val))}
                options={Array.from({ length: 12 }, (_, i) => ({
                  value: i + 1,
                  label: `Tháng ${i + 1}`,
                }))}
                className="w-[110px]"
              />
              <CustomSelect
                value={year}
                onChange={(val) => setYear(Number(val))}
                options={[year - 1, year, year + 1].map((y) => ({
                  value: y,
                  label: `Năm ${y}`,
                }))}
                className="w-[110px]"
              />

              {areas.length > 0 && (
                <AreaSearchDropdown
                  areas={areas}
                  selectedAreaId={selectedAreaId}
                  onSelectArea={(id) => setSelectedAreaId(id)}
                  className="w-[185px]"
                />
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`h-8 rounded-[8px] border px-2.5 text-[11.5px] font-semibold transition ${
                  filterMode === "all"
                    ? "border-[#6e5ce8] bg-[#efecff] text-[#5e4bd5]"
                    : "border-[#e1e2ee] bg-white text-[#5d637a] hover:bg-[#f6f6fb]"
                }`}
              >
                Tất cả ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("unbilled")}
                className={`h-8 rounded-[8px] border px-2.5 text-[11.5px] font-semibold transition ${
                  filterMode === "unbilled"
                    ? "border-[#e5ac52] bg-[#fff8eb] text-[#b87514]"
                    : "border-[#e1e2ee] bg-white text-[#5d637a] hover:bg-[#f6f6fb]"
                }`}
              >
                Chưa lập ({summary.unbilledCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("billed")}
                className={`h-8 rounded-[8px] border px-2.5 text-[11.5px] font-semibold transition ${
                  filterMode === "billed"
                    ? "border-[#168e70] bg-[#e4f8f0] text-[#168e70]"
                    : "border-[#e1e2ee] bg-white text-[#5d637a] hover:bg-[#f6f6fb]"
                }`}
              >
                Đã lập ({summary.billedCount})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="min-h-0 flex-1 overflow-y-auto rounded-[14px] border border-[#e7e7ef]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-xs text-[#8a90a5]">
                <Loader2 size={16} className="mr-2 animate-spin text-[#6e5ce8]" />
                Đang tải dữ liệu phòng và điện nước...
              </div>
            ) : visibleItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#8a90a5]">
                Không có phòng đang thuê nào trong danh sách này.
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 bg-[#f8f8fc] text-[11px] font-bold text-[#676d85]">
                  <tr className="border-b border-[#ececf4]">
                    <th className="w-10 px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={allVisibleChecked}
                        onChange={toggleAllVisible}
                        className="h-3.5 w-3.5 rounded accent-[#6e5ce8]"
                      />
                    </th>
                    <th className="px-3 py-2.5">Phòng / Khách</th>
                    <th className="px-2.5 py-2.5 text-center">Tiền phòng</th>
                    <th className="px-2.5 py-2.5 text-center">
                      Điện + Nước (T{month})
                    </th>
                    <th className="px-2.5 py-2.5 text-center">Tiền mạng</th>
                    <th className="px-2.5 py-2.5 text-center">Tiền rác</th>
                    <th className="px-2.5 py-2.5 text-center">Phụ phí</th>
                    <th className="px-3 py-2.5 text-right">Tổng hóa đơn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f7]">
                  {visibleItems.map((item) => {
                    const checked = Boolean(selectedRooms[item.roomId]);
                    const d = drafts[item.roomId] || {};
                    const total = calcRowTotal(item);

                    return (
                      <tr
                        key={item.roomId}
                        className={`transition ${
                          checked ? "bg-[#fcfbff]" : "hover:bg-[#fafafe]"
                        }`}
                      >
                        <td className="px-3 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRoom(item.roomId)}
                            className="h-3.5 w-3.5 rounded accent-[#6e5ce8]"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-[#20243c]">
                              {item.roomCode}
                            </span>
                            {item.isInvoiced ? (
                              <span className="rounded bg-[#e4f8f0] px-1.5 py-0.5 text-[10px] font-bold text-[#168e70]">
                                Đã lập
                              </span>
                            ) : (
                              <span className="rounded bg-[#fff3e4] px-1.5 py-0.5 text-[10px] font-bold text-[#bb833c]">
                                Chưa lập
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 truncate text-[11px] text-[#83889d]">
                            {!selectedAreaId && item.areaName
                              ? `${item.areaName} · `
                              : ""}
                            {item.tenantName || "Chưa có người đại diện"}
                          </div>
                        </td>

                        {/* Tiền phòng */}
                        <td className="px-2 py-2 text-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={d.roomPrice ?? ""}
                            onChange={(e) =>
                              updateDraft(item.roomId, "roomPrice", e.target.value)
                            }
                            className="h-8 w-[104px] rounded-[8px] border border-[#dfe1ee] bg-white px-2 text-center text-xs font-bold text-[#20243c] outline-none focus:border-[#6e5ce8]"
                          />
                        </td>

                        {/* Điện + Nước */}
                        <td className="px-2.5 py-2 text-center">
                          {item.isUtilityRecorded ? (
                            <div>
                              <div className="font-extrabold text-[#20243c]">
                                {formatVnd(item.utilityAmount)}
                              </div>
                              <div className="text-[10px] text-[#7c8298]">
                                ⚡{item.electricity?.usage ?? 0} kWh · 💧
                                {item.water?.usage ?? 0} m³
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#fff3e4] px-2 py-0.5 text-[10.5px] font-semibold text-[#bb833c]">
                              <Zap size={11} />
                              Chưa chốt ĐN (0 đ)
                            </span>
                          )}
                        </td>

                        {/* Tiền mạng */}
                        <td className="px-2 py-2 text-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={d.internetFee ?? ""}
                            onChange={(e) =>
                              updateDraft(
                                item.roomId,
                                "internetFee",
                                e.target.value
                              )
                            }
                            className="h-8 w-[84px] rounded-[8px] border border-[#dfe1ee] bg-white px-2 text-center text-xs font-semibold text-[#333752] outline-none focus:border-[#6e5ce8]"
                          />
                        </td>

                        {/* Tiền rác */}
                        <td className="px-2 py-2 text-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={d.garbageFee ?? ""}
                            onChange={(e) =>
                              updateDraft(
                                item.roomId,
                                "garbageFee",
                                e.target.value
                              )
                            }
                            className="h-8 w-[76px] rounded-[8px] border border-[#dfe1ee] bg-white px-2 text-center text-xs font-semibold text-[#333752] outline-none focus:border-[#6e5ce8]"
                          />
                        </td>

                        {/* Phụ phí */}
                        <td className="px-2 py-2 text-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={d.otherFee ?? ""}
                            onChange={(e) =>
                              updateDraft(item.roomId, "otherFee", e.target.value)
                            }
                            className="h-8 w-[76px] rounded-[8px] border border-[#dfe1ee] bg-white px-2 text-center text-xs font-semibold text-[#333752] outline-none focus:border-[#6e5ce8]"
                          />
                        </td>

                        {/* Tổng cộng */}
                        <td className="px-3 py-2 text-right font-extrabold text-[#5e4bd5]">
                          {formatVnd(total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#eeeff6] pt-3.5">
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#5d637a]">
              <span>
                Đã chọn:{" "}
                <strong className="text-[#20243c]">
                  {summary.selectedCount}/{items.length} phòng
                </strong>
              </span>
              <span>
                Tổng tiền dự kiến:{" "}
                <strong className="text-[#5e4bd5]">
                  {formatVnd(summary.totalMoney)}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={generateMutation.isPending}
                onClick={onClose}
                className="h-8 rounded-[8px] border border-[#e1e2ee] bg-white px-3 text-[11.5px] font-semibold text-[#5d637a] hover:bg-[#f6f6fb]"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={
                  generateMutation.isPending || summary.selectedCount === 0
                }
                className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-[#6e5ce8] px-3 text-[11.5px] font-semibold text-white shadow-sm hover:bg-[#5b49d6] disabled:opacity-60"
              >
                {generateMutation.isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Check size={13} />
                )}
                Lập hóa đơn T{month}/{year} ({summary.selectedCount})
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

