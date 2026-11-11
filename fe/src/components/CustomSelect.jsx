import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

const SIZE_STYLES = {
  sm: "h-8 rounded-[9px] px-2.5 pr-7 text-[11.5px]",
  md: "h-9 rounded-xl px-3 pr-8 text-[12px]",
  lg: "h-10 rounded-[10px] px-3 pr-8 text-[13px]",
};

/**
 * Custom Dropdown đồng bộ giao diện với AreaSearchDropdown (TroEasy style)
 * Thay thế hoàn toàn thẻ <select> mặc định của trình duyệt.
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = "Chọn...",
  disabled = false,
  size = "md",
  className = "w-auto min-w-[112px]",
  menuClassName = "min-w-full",
  showCheck = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = useMemo(
    () =>
      options.find((opt) => String(opt.value) === String(value)) || null,
    [options, value]
  );

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

  const handleSelect = (opt) => {
    if (opt.disabled) return;
    onChange?.(opt.value, opt);
    setIsOpen(false);
  };

  const sizeClass = SIZE_STYLES[size] || SIZE_STYLES.md;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setIsOpen(false);
        }}
        className={`flex w-full items-center justify-between border bg-white text-left font-semibold outline-none transition ${sizeClass} ${
          disabled
            ? "cursor-not-allowed border-[#e5e6ee] bg-[#f7f8fc] text-[#9298aa]"
            : isOpen
              ? "border-[#6756df] text-[#20243c] shadow-[0_0_0_3px_rgba(103,86,223,0.08)]"
              : "border-[#e5e6ee] text-[#20243c] hover:border-[#cfd2e3]"
        }`}
      >
        <span
          className={`truncate ${
            selectedOption && selectedOption.value !== ""
              ? "text-[#20243c]"
              : selectedOption
                ? "text-[#20243c]"
                : "font-normal text-[#9298aa]"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <ChevronDown
          size={13}
          className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a2a6b7] transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#6756df]" : ""
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div
          role="listbox"
          className={`absolute left-0 top-[calc(100%+6px)] z-40 max-h-56 overflow-y-auto rounded-xl border border-[#e8e9f0] bg-white p-1 shadow-[0_8px_24px_rgba(31,33,87,0.12)] ${menuClassName}`}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-center text-[11px] text-[#9298aa]">
              Không có dữ liệu
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  role="option"
                  disabled={opt.disabled}
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12px] transition-colors ${
                    opt.disabled
                      ? "cursor-not-allowed text-[#b5b9c9] opacity-60"
                      : isSelected
                        ? "bg-[#efedff] font-semibold text-[#6756df]"
                        : "text-[#3e435b] hover:bg-[#f5f4fb]"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {showCheck && isSelected && (
                    <Check size={13} className="shrink-0 text-[#6756df]" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

