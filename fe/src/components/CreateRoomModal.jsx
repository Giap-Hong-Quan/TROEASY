import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, ChevronDown, Check } from "lucide-react";
import toast from "react-hot-toast";
import { createRoom } from "../services/roomService.js";
import { createRow } from "../services/rowService.js";

const STATUS_OPTIONS = [
  { value: "vacant", label: "Trống" },
  { value: "renting", label: "Đang thuê" },
  { value: "deposit", label: "Đã cọc" },
  { value: "repair", label: "Đang sửa" },
  { value: "stop", label: "Tạm ngưng" },
];

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

export default function CreateRoomModal({
  isOpen,
  onClose,
  areas = [],
  rows = [],
  defaultAreaId = "",
  defaultRowId = "",
}) {
  const queryClient = useQueryClient();
  const rowDropdownRef = useRef(null);

  const areaId = defaultAreaId || areas[0]?.id || "";
  const [rowId, setRowId] = useState(() => {
    const initialAreaId = defaultAreaId || areas[0]?.id || "";
    const matchingRows = rows
      .filter((r) => String(r.areaId) === String(initialAreaId) && r.isActive !== false)
      .sort((a, b) => a.name.localeCompare(b.name, "vi", { numeric: true }));
    return defaultRowId || matchingRows[0]?.id || "";
  });
  const [rowDropdownOpen, setRowDropdownOpen] = useState(false);
  const [isAddingRowInline, setIsAddingRowInline] = useState(false);
  const [newRowName, setNewRowName] = useState("");

  const [code, setCode] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [status, setStatus] = useState("vacant");
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [customAsset, setCustomAsset] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const selectedArea = useMemo(
    () => areas.find((a) => String(a.id) === String(areaId)) || null,
    [areas, areaId],
  );

  const areaRows = useMemo(() => {
    if (!areaId) return [];
    return rows
      .filter((r) => String(r.areaId) === String(areaId) && r.isActive !== false)
      .sort((a, b) => a.name.localeCompare(b.name, "vi", { numeric: true }));
  }, [rows, areaId]);

  const selectedRowObj = useMemo(
    () => areaRows.find((r) => String(r.id) === String(rowId)) || null,
    [areaRows, rowId],
  );



  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rowDropdownRef.current && !rowDropdownRef.current.contains(event.target)) {
        setRowDropdownOpen(false);
        setIsAddingRowInline(false);
      }
    };
    if (rowDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [rowDropdownOpen]);

  const createRowMutation = useMutation({
    mutationFn: createRow,
    onSuccess: (createdRow) => {
      queryClient.invalidateQueries({ queryKey: ["rows"] });
      toast.success(`Đã tạo "${createdRow.name}"!`);
      setRowId(createdRow.id);
      setNewRowName("");
      setIsAddingRowInline(false);
      setRowDropdownOpen(false);
    },
    onError: (error) => {
      const msg = error.response?.data?.message || error.message || "Tạo dãy thất bại.";
      toast.error(msg);
    },
  });

  const createRoomMutation = useMutation({
    mutationFn: createRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["rows"] });
      toast.success("Tạo phòng thành công!");
      onClose();
    },
    onError: (error) => {
      const msg = error.response?.data?.message || error.message || "Tạo phòng thất bại.";
      setErrorMessage(msg);
      toast.error(msg);
    },
  });

  if (!isOpen) return null;

  const handleCreateInlineRow = () => {
    const trimmed = newRowName.trim();
    if (!trimmed) {
      toast.error("Vui lòng nhập tên dãy.");
      return;
    }
    if (!areaId) {
      toast.error("Không xác định được khu vực.");
      return;
    }
    createRowMutation.mutate({ areaId, name: trimmed });
  };

  const toggleAsset = (assetName) => {
    setSelectedAssets((prev) =>
      prev.includes(assetName)
        ? prev.filter((item) => item !== assetName)
        : [...prev, assetName],
    );
  };

  const handleAddCustomAsset = () => {
    const trimmed = customAsset.trim();
    if (!trimmed) return;
    if (!selectedAssets.includes(trimmed)) {
      setSelectedAssets((prev) => [...prev, trimmed]);
    }
    setCustomAsset("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!areaId) {
      setErrorMessage("Không xác định được khu vực.");
      return;
    }
    if (!rowId) {
      setErrorMessage("Vui lòng chọn hoặc tạo dãy phòng.");
      return;
    }
    if (!code.trim()) {
      setErrorMessage("Vui lòng nhập mã phòng.");
      return;
    }

    const payload = {
      areaId,
      rowId,
      code: code.trim().toUpperCase(),
      status,
    };

    if (selectedRowObj?.name) {
      payload.row = selectedRowObj.name;
    }

    if (basePrice !== "" && !Number.isNaN(Number(basePrice))) {
      payload.basePrice = Number(basePrice);
    }

    if (selectedAssets.length > 0) {
      payload.assets = selectedAssets;
    }

    createRoomMutation.mutate(payload);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#181b2e]/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-visible rounded-[20px] border border-[#e7e7ef] bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#eeeff6] px-6 py-4">
          <div>
            <h2 className="text-lg font-extrabold text-[#20243c]">Thêm phòng mới</h2>
            <p className="mt-0.5 text-xs text-[#9298aa]">Nhập thông tin phòng cho khu trọ</p>
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* Khu vực cố định theo khu đã nhấn */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#3e435b]">
              Khu vực
            </label>
            <div className="flex h-10 w-full items-center rounded-[10px] border border-[#e5e6ee] bg-[#f7f8fc] px-3 text-[13px] font-semibold text-[#20243c]">
              {selectedArea?.name || "Chưa chọn khu vực"}
            </div>
          </div>

          {/* Mã phòng & Select Dãy phòng (có tạo nhanh dãy) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="room-code" className="mb-1.5 block text-xs font-bold text-[#3e435b]">
                Mã phòng <span className="text-red-500">*</span>
              </label>
              <input
                id="room-code"
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="VD: P107"
                required
                className="h-10 w-full rounded-[10px] border border-[#e5e6ee] bg-white px-3 text-[13px] uppercase text-[#20243c] outline-none placeholder:normal-case placeholder:text-[#a0a5b8] focus:border-[#6756df]"
              />
            </div>

            {/* Custom Select Dãy phòng + Thêm dãy ngay tại chỗ */}
            <div className="relative" ref={rowDropdownRef}>
              <label className="mb-1.5 block text-xs font-bold text-[#3e435b]">
                Dãy phòng <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setRowDropdownOpen((prev) => !prev)}
                className="flex h-10 w-full items-center justify-between rounded-[10px] border border-[#e5e6ee] bg-white px-3 text-left text-[13px] text-[#20243c] outline-none transition-colors focus:border-[#6756df]"
              >
                <span className={selectedRowObj ? "text-[#20243c]" : "text-[#a0a5b8]"}>
                  {selectedRowObj ? selectedRowObj.name : "-- Chọn dãy phòng --"}
                </span>
                <ChevronDown size={15} className="text-[#8c92a6]" />
              </button>

              {rowDropdownOpen && (
                <div className="absolute left-0 right-0 top-[68px] z-30 rounded-xl border border-[#e5e6ee] bg-white p-1.5 shadow-xl">
                  <div className="max-h-44 overflow-y-auto">
                    {areaRows.length > 0 ? (
                      areaRows.map((r) => {
                        const isSelected = String(r.id) === String(rowId);
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => {
                              setRowId(r.id);
                              setRowDropdownOpen(false);
                              setIsAddingRowInline(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
                              isSelected
                                ? "bg-[#efedff] font-semibold text-[#6756df]"
                                : "text-[#3e435b] hover:bg-[#f5f4fb]"
                            }`}
                          >
                            <span>{r.name}</span>
                            {isSelected && <Check size={14} className="text-[#6756df]" />}
                          </button>
                        );
                      })
                    ) : (
                      <p className="px-3 py-2 text-xs text-[#9298aa]">
                        Khu này chưa có dãy nào.
                      </p>
                    )}
                  </div>

                  <div className="mt-1 border-t border-[#eeeff6] pt-1.5">
                    {!isAddingRowInline ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingRowInline(true);
                          setNewRowName(`Dãy ${areaRows.length + 1}`);
                        }}
                        className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold text-[#6756df] transition-colors hover:bg-[#f5f4fb]"
                      >
                        <Plus size={14} /> Thêm dãy mới
                      </button>
                    ) : (
                      <div className="space-y-1.5 p-1">
                        <input
                          type="text"
                          autoFocus
                          value={newRowName}
                          onChange={(event) => setNewRowName(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleCreateInlineRow();
                            }
                            if (event.key === "Escape") {
                              setIsAddingRowInline(false);
                            }
                          }}
                          placeholder="Nhập tên dãy (VD: Dãy 5)"
                          className="h-8 w-full rounded-lg border border-[#d6d7e5] px-2.5 text-xs text-[#20243c] outline-none focus:border-[#6756df]"
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsAddingRowInline(false)}
                            className="h-7 rounded-md px-2 text-[11px] font-semibold text-[#70778d] hover:bg-slate-100"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            disabled={createRowMutation.isPending}
                            onClick={handleCreateInlineRow}
                            className="h-7 rounded-md bg-[#6756df] px-2.5 text-[11px] font-bold text-white hover:bg-[#5b4bc7] disabled:opacity-60"
                          >
                            {createRowMutation.isPending ? "Đang lưu..." : "Lưu & chọn"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Giá cơ bản & Trạng thái */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="room-price" className="mb-1.5 block text-xs font-bold text-[#3e435b]">
                Giá thuê cơ bản (VNĐ)
              </label>
              <input
                id="room-price"
                type="number"
                min="0"
                step="50000"
                value={basePrice}
                onChange={(event) => setBasePrice(event.target.value)}
                placeholder="VD: 3000000"
                className="h-10 w-full rounded-[10px] border border-[#e5e6ee] bg-white px-3 text-[13px] text-[#20243c] outline-none placeholder:text-[#a0a5b8] focus:border-[#6756df]"
              />
            </div>

            <div>
              <label htmlFor="room-status" className="mb-1.5 block text-xs font-bold text-[#3e435b]">
                Trạng thái
              </label>
              <select
                id="room-status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-10 w-full rounded-[10px] border border-[#e5e6ee] bg-white px-3 text-[13px] text-[#20243c] outline-none focus:border-[#6756df]"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tiện ích / Tài sản */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-[#3e435b]">
              Tiện ích phòng
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_ASSETS.map((asset) => {
                const active = selectedAssets.includes(asset);
                return (
                  <button
                    key={asset}
                    type="button"
                    onClick={() => toggleAsset(asset)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                      active
                        ? "border-[#6756df] bg-[#efedff] text-[#6756df]"
                        : "border-[#e5e6ee] bg-[#fafaff] text-[#666b80] hover:bg-[#f2f2fa]"
                    }`}
                  >
                    {asset}
                  </button>
                );
              })}
            </div>

            <div className="mt-2.5 flex gap-2">
              <input
                type="text"
                value={customAsset}
                onChange={(event) => setCustomAsset(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAddCustomAsset();
                  }
                }}
                placeholder="Thêm tiện ích khác..."
                className="h-9 flex-1 rounded-[10px] border border-[#e5e6ee] bg-white px-3 text-xs text-[#20243c] outline-none placeholder:text-[#a0a5b8] focus:border-[#6756df]"
              />
              <button
                type="button"
                onClick={handleAddCustomAsset}
                className="inline-flex h-8 items-center justify-center gap-1 rounded-[8px] border border-[#d9d4ff] bg-[#f5f3ff] px-2.5 text-[11.5px] font-semibold text-[#6756df] transition-colors hover:bg-[#ece8ff]"
              >
                <Plus size={13} /> Thêm
              </button>
            </div>

            {selectedAssets.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedAssets.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 rounded-full bg-[#f3f2fc] px-2.5 py-1 text-[11px] font-semibold text-[#5a4ad1]"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => toggleAsset(item)}
                      className="text-[#8a7ee6] hover:text-[#4335b0]"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {errorMessage && (
            <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600">
              {errorMessage}
            </p>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-[#eeeff6] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={createRoomMutation.isPending}
              className="inline-flex h-8 items-center justify-center rounded-[8px] border border-[#e5e6ee] bg-white px-3 text-[11.5px] font-semibold text-[#54596e] transition-colors hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={createRoomMutation.isPending}
              className="inline-flex h-8 items-center justify-center gap-1 rounded-[8px] bg-[#6756df] px-3 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#5b4bc7] disabled:opacity-60"
            >
              <Plus size={13} />
              {createRoomMutation.isPending ? "Đang tạo..." : "Tạo phòng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
