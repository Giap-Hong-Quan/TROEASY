import React from "react";
import { Menu, Search } from "lucide-react";

export default function Header({ pageTitle = "Tổng quan", onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex min-h-[78px] items-center gap-3 border-b border-[#edeef5] bg-white/95 px-4 backdrop-blur-xl sm:px-6 xl:gap-5 xl:px-8">
      <button type="button" aria-label="Mở sidebar" onClick={onMenuClick} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#eaeaf2] text-[#5f637b] lg:hidden">
        <Menu size={20} />
      </button>
      <div className="hidden shrink-0 items-center gap-2 whitespace-nowrap text-[12px] sm:flex">
        <span className="text-[#9da0b4]">Workspace</span>
        <span className="text-[#b5b7c5]">/</span>
        <span className="font-bold text-[#2a2e45]">{pageTitle}</span>
      </div>

      <div className="ml-auto flex h-[42px] min-w-0 max-w-[400px] flex-1 items-center gap-2.5 rounded-[10px] border border-[#eeeff5] bg-[#f7f8fc] px-3">
        <Search size={17} className="shrink-0 text-[#9ba0b0]" />
        <input type="search" aria-label="Tìm kiếm" placeholder="Tìm phòng, khách thuê, hóa đơn..." className="min-w-0 flex-1 bg-transparent text-[11.5px] text-[#333951] outline-none placeholder:text-[#a5a9b9]" />
        <kbd className="hidden rounded-md border border-[#e8e9f1] bg-white px-1.5 py-0.5 text-[10px] text-[#999eaf] xl:inline">⌘ K</kbd>
      </div>

    </header>
  );
}
