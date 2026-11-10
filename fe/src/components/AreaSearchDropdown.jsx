import { useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronDown } from "lucide-react";

/**
 * Component Dropdown tìm kiếm và chọn Khu vực chuẩn thiết kế TroEasy (giống RoomMap)
 * @param {Array} areas - Danh sách khu vực [{ id/_id, name, ... }]
 * @param {string} selectedAreaId - ID khu vực đang chọn (hoặc "" nếu chọn tất cả)
 * @param {function} onSelectArea - Callback khi chọn khu: (areaId, areaObj) => void
 * @param {string} className - Lớp CSS tùy biến cho wrapper
 * @param {string} placeholder - Placeholder cho ô input (mặc định: "Tìm và chọn khu...")
 */
export default function AreaSearchDropdown({
  areas = [],
  selectedAreaId = "",
  onSelectArea,
  className = "w-full sm:w-[220px]",
  placeholder = "Tìm và chọn khu...",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  // Tìm khu vực đang chọn hiện tại để lấy tên hiển thị
  const currentArea = useMemo(() => {
    if (!selectedAreaId) return null;
    return (
      areas.find((a) => String(a.id || a._id) === String(selectedAreaId)) ||
      null
    );
  }, [areas, selectedAreaId]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Giá trị hiển thị trong ô input: khi đang mở dropdown thì hiển thị text đang gõ, khi đóng hiển thị tên khu đang chọn
  const displayValue = isOpen ? query : (currentArea ? currentArea.name : "");

  // Lọc danh sách khu theo từ khóa tìm kiếm
  const matchingAreas = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("vi");
    // Nếu chưa gõ gì hoặc query trùng tên khu đang chọn thì hiện tất cả khu để chọn nhanh
    if (!keyword || (currentArea && keyword === currentArea.name.toLocaleLowerCase("vi"))) {
      return areas;
    }
    return areas.filter((a) =>
      (a.name || "").toLocaleLowerCase("vi").includes(keyword),
    );
  }, [areas, query, currentArea]);

  const handleOpen = () => {
    setQuery(currentArea ? currentArea.name : "");
    setIsOpen(true);
  };

  const handleSelect = (area) => {
    if (!area) {
      // Chọn tất cả khu
      setQuery("");
      onSelectArea?.("", null);
    } else {
      const aId = String(area.id || area._id);
      setQuery(area.name);
      onSelectArea?.(aId, area);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Icon Search */}
      <Search
        size={14}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#a2a6b7]"
      />

      {/* Input Combobox */}
      <input
        type="text"
        role="combobox"
        aria-label="Tìm và chọn khu vực"
        aria-expanded={isOpen}
        value={displayValue}
        onFocus={handleOpen}
        onClick={handleOpen}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setIsOpen(false);
          }
          if (e.key === "Enter" && matchingAreas.length === 1) {
            handleSelect(matchingAreas[0]);
          }
        }}
        placeholder={placeholder}
        className="h-9 w-full rounded-xl border border-[#e5e6ee] bg-white pl-8 pr-8 text-[12px] text-[#20243c] outline-none placeholder:text-[#9298aa] transition focus:border-[#6756df] focus:shadow-[0_0_0_3px_rgba(103,86,223,0.08)]"
      />

      {/* Chevron Icon */}
      <ChevronDown
        size={13}
        className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#a2a6b7] transition-transform duration-200 ${
          isOpen ? "rotate-180 text-[#6756df]" : ""
        }`}
      />

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-56 overflow-y-auto rounded-xl border border-[#e8e9f0] bg-white p-1 shadow-[0_8px_24px_rgba(31,33,87,0.12)]"
        >
          {/* Lựa chọn Tất cả khu */}
          <button
            type="button"
            role="option"
            aria-selected={!selectedAreaId}
            onClick={() => handleSelect(null)}
            className={`w-full rounded-lg px-2.5 py-1.5 text-left text-[12px] transition-colors ${
              !selectedAreaId
                ? "bg-[#efedff] font-semibold text-[#6756df]"
                : "text-[#60667c] hover:bg-[#f5f4fb]"
            }`}
          >
            Tất cả khu
          </button>

          {/* Danh sách các khu vực */}
          {matchingAreas.map((area) => {
            const aId = String(area.id || area._id);
            const isSelected = String(selectedAreaId) === aId;

            return (
              <button
                key={aId}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(area)}
                className={`w-full rounded-lg px-2.5 py-1.5 text-left text-[12px] transition-colors ${
                  isSelected
                    ? "bg-[#efedff] font-semibold text-[#6756df]"
                    : "text-[#3e435b] hover:bg-[#f5f4fb]"
                }`}
              >
                {area.name}
              </button>
            );
          })}

          {matchingAreas.length === 0 && (
            <div className="px-3 py-2 text-center text-[11px] text-[#9298aa]">
              Không tìm thấy khu vực nào
            </div>
          )}
        </div>
      )}
    </div>
  );
}
