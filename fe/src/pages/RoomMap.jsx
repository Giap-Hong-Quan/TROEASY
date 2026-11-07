import { useState } from "react";
import { Plus, Zap, Search, ChevronDown } from "lucide-react";

/**
 * ROOM MAP — room status preview
 * - 3 khu, mỗi khu 20 phòng / 4 tầng
 * - Dữ liệu mẫu được khai báo cố định ngay trong file
 * - Phòng đang dùng dữ liệu minh họa tĩnh
 * - Dùng bên trong layout có sẵn Sidebar + Header
 */
const AREAS = [
  {
    id: "td", name: "Khu Thủ Đức", address: "Số 145/12 Đường Số 8, Phường Linh Xuân, Thành phố Thủ Đức, TP. Hồ Chí Minh", isActive: true,
    rooms: [
      { id: "gv-101", number: "101", floor: 1, status: "renting" },
      { id: "gv-102", number: "102", floor: 1, status: "renting" },
      { id: "gv-103", number: "103", floor: 1, status: "repair" },
      { id: "gv-104", number: "104", floor: 1, status: "deposit" },
      { id: "gv-105", number: "105", floor: 1, status: "vacant" },
      { id: "gv-201", number: "201", floor: 2, status: "renting" },
      { id: "gv-202", number: "202", floor: 2, status: "renting" },
      { id: "gv-203", number: "203", floor: 2, status: "renting" },
      { id: "gv-204", number: "204", floor: 2, status: "deposit" },
      { id: "gv-205", number: "205", floor: 2, status: "renting" },
      { id: "gv-301", number: "301", floor: 3, status: "renting" },
      { id: "gv-302", number: "302", floor: 3, status: "vacant" },
      { id: "gv-303", number: "303", floor: 3, status: "renting" },
      { id: "gv-304", number: "304", floor: 3, status: "renting" },
      { id: "gv-305", number: "305", floor: 3, status: "repair" },
      { id: "gv-401", number: "401", floor: 4, status: "renting" },
      { id: "gv-402", number: "402", floor: 4, status: "deposit" },
      { id: "gv-403", number: "403", floor: 4, status: "renting" },
      { id: "gv-404", number: "404", floor: 4, status: "vacant" },
      { id: "gv-405", number: "405", floor: 4, status: "stop" },
    ],
  },
  {
    id: "dn", name: "Khu Đồng Nai", address: "Số 328/14 Đường Bùi Văn Hòa, Phường Long Bình Tân, Thành phố Biên Hòa, Tỉnh Đồng Nai", isActive: true,
    rooms: [
      { id: "dn-101", number: "101", floor: 1, status: "renting" },
      { id: "dn-102", number: "102", floor: 1, status: "renting" },
      { id: "dn-103", number: "103", floor: 1, status: "vacant" },
      { id: "dn-104", number: "104", floor: 1, status: "renting" },
      { id: "dn-105", number: "105", floor: 1, status: "repair" },
      { id: "dn-201", number: "201", floor: 2, status: "renting" },
      { id: "dn-202", number: "202", floor: 2, status: "deposit" },
      { id: "dn-203", number: "203", floor: 2, status: "renting" },
      { id: "dn-204", number: "204", floor: 2, status: "renting" },
      { id: "dn-205", number: "205", floor: 2, status: "vacant" },
      { id: "dn-301", number: "301", floor: 3, status: "renting" },
      { id: "dn-302", number: "302", floor: 3, status: "renting" },
      { id: "dn-303", number: "303", floor: 3, status: "deposit" },
      { id: "dn-304", number: "304", floor: 3, status: "renting" },
      { id: "dn-305", number: "305", floor: 3, status: "stop" },
      { id: "dn-401", number: "401", floor: 4, status: "renting" },
      { id: "dn-402", number: "402", floor: 4, status: "repair" },
      { id: "dn-403", number: "403", floor: 4, status: "renting" },
      { id: "dn-404", number: "404", floor: 4, status: "vacant" },
      { id: "dn-405", number: "405", floor: 4, status: "renting" },
    ],
  },
  {
    id: "q9", name: "Khu Quận 9", address: "45/8 Lê Văn Việt, Tăng Nhơn Phú A, Quận 9, TP. Hồ Chí Minh", isActive: true,
    rooms: [
      { id: "bt-101", number: "101", floor: 1, status: "renting" },
      { id: "bt-102", number: "102", floor: 1, status: "renting" },
      { id: "bt-103", number: "103", floor: 1, status: "stop" },
      { id: "bt-104", number: "104", floor: 1, status: "renting" },
      { id: "bt-105", number: "105", floor: 1, status: "renting" },
      { id: "bt-201", number: "201", floor: 2, status: "deposit" },
      { id: "bt-202", number: "202", floor: 2, status: "renting" },
      { id: "bt-203", number: "203", floor: 2, status: "renting" },
      { id: "bt-204", number: "204", floor: 2, status: "vacant" },
      { id: "bt-205", number: "205", floor: 2, status: "renting" },
      { id: "bt-301", number: "301", floor: 3, status: "renting" },
      { id: "bt-302", number: "302", floor: 3, status: "repair" },
      { id: "bt-303", number: "303", floor: 3, status: "renting" },
      { id: "bt-304", number: "304", floor: 3, status: "deposit" },
      { id: "bt-305", number: "305", floor: 3, status: "renting" },
      { id: "bt-401", number: "401", floor: 4, status: "renting" },
      { id: "bt-402", number: "402", floor: 4, status: "vacant" },
      { id: "bt-403", number: "403", floor: 4, status: "renting" },
      { id: "bt-404", number: "404", floor: 4, status: "deposit" },
      { id: "bt-405", number: "405", floor: 4, status: "renting" },
    ],
  },
];

const STATUS = {
  vacant: { name: "Trống", dot: "bg-[#ed7780]", room: "border-[#f8d9dd] bg-[#fff0f0] text-[#df606d]", short: "●" },
  renting: { name: "Đang thuê", dot: "bg-[#27b093]", room: "border-[#b8e7d9] bg-[#e4f8f0] text-[#168e70]", short: "●" },
  deposit: { name: "Đã cọc", dot: "bg-[#8173ed]", room: "border-[#dad4ff] bg-[#efedff] text-[#6d5ed4]", short: "●" },
  repair: { name: "Đang sửa", dot: "bg-[#e5ac52]", room: "border-[#f6dfbd] bg-[#fff3e4] text-[#bb833c]", short: "●" },
  stop: { name: "Tạm ngưng", dot: "bg-[#aab0bd]", room: "border-[#e3e5ed] bg-[#f2f3f6] text-[#999eac]", short: "●" },
};

const statusItems = Object.entries(STATUS);

export default function RoomMap() {
  const [areaQuery, setAreaQuery] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [areaOptionsOpen, setAreaOptionsOpen] = useState(false);
  const matchingAreas = AREAS.filter((area) =>
    area.name.toLocaleLowerCase("vi").includes(areaQuery.trim().toLocaleLowerCase("vi")),
  );
  const filteredAreas = selectedAreaId
    ? AREAS.filter((area) => area.id === selectedAreaId)
    : AREAS;

  return (
    <div className="min-h-full bg-[#f6f7fb] text-[#20243c]">
        <div className="mx-auto w-full max-w-[1640px] space-y-4 px-4 py-0 sm:px-6 lg:px-8">
        {/* Page heading */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
          <div>
            <h1 className="text-[25px] font-extrabold tracking-[-0.8px] text-[#24283d]">Sơ đồ phòng</h1>
            <p className="mt-1 text-[12px] text-[#969baa]">Quản lý trạng thái và thông tin phòng</p>
          </div>
          <button type="button" className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[#6756df] px-4 text-xs font-bold text-white shadow-[0_6px_15px_rgba(103,86,223,0.18)]">
            <Plus size={16} /> Thêm phòng
          </button>
        </div>

        <div className="relative w-full max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-3 text-[#a2a6b7]" />
          <input
            type="text"
            role="combobox"
            aria-label="Tìm và chọn khu vực"
            aria-expanded={areaOptionsOpen}
            aria-controls="area-options"
            aria-autocomplete="list"
            value={areaQuery}
            onFocus={() => setAreaOptionsOpen(true)}
            onChange={(event) => {
              setAreaQuery(event.target.value);
              setSelectedAreaId("");
              setAreaOptionsOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setAreaOptionsOpen(false);
              if (event.key === "Enter" && matchingAreas.length === 1) {
                setSelectedAreaId(matchingAreas[0].id);
                setAreaQuery(matchingAreas[0].name);
                setAreaOptionsOpen(false);
              }
            }}
            placeholder="Tìm và chọn khu..."
            className="h-10 w-full rounded-[10px] border border-[#e5e6ee] bg-white pl-9 pr-9 text-[13px] outline-none placeholder:text-[#9298aa] focus:border-[#6756df]"
          />
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-[13px] text-[#a2a6b7]" />
          {areaOptionsOpen && (
            <div id="area-options" role="listbox" className="absolute left-0 right-0 top-11 z-20 max-h-60 overflow-y-auto rounded-xl border border-[#e8e9f0] bg-white p-1.5 shadow-lg">
              <button
                type="button"
                role="option"
                aria-selected={!selectedAreaId}
                onClick={() => {
                  setSelectedAreaId("");
                  setAreaQuery("");
                  setAreaOptionsOpen(false);
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-[13px] text-[#60667c] hover:bg-[#f5f4fb]"
              >
                Tất cả khu
              </button>
              {matchingAreas.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  role="option"
                  aria-selected={selectedAreaId === area.id}
                  onClick={() => {
                    setSelectedAreaId(area.id);
                    setAreaQuery(area.name);
                    setAreaOptionsOpen(false);
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-[13px] text-[#3e435b] hover:bg-[#f5f4fb]"
                >
                  {area.name}
                </button>
              ))}
              {matchingAreas.length === 0 && (
                <p className="px-3 py-2 text-[13px] text-[#858ba0]">Không tìm thấy khu vực.</p>
              )}
            </div>
          )}
        </div>

        {/* Areas */}
        {filteredAreas.map((area) => (
          <section key={area.id} className="overflow-hidden rounded-[18px] border border-[#e7e7ef] bg-white p-4 sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-[#20243c]">{area.name}</h2>
                <p className="mt-1 text-[13px] leading-5 text-[#9298aa] break-words">{area.address}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2.5">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${area.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${area.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                    {area.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
                  </span>
                  <span className="text-xs text-[#9298aa]">
                    {area.rooms.filter(room => room.status === "renting").length}/{area.rooms.length} phòng đang thuê
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                <button type="button" className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-[#e5e6ef] bg-white px-3 text-[13px] font-semibold text-[#66697c] hover:bg-slate-50 transition-colors">
                  <Zap size={13} className="text-orange-500" /> Nhập điện nước
                </button>
                <button type="button" className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] bg-[#6756df] px-3 text-[13px] font-semibold text-white hover:bg-[#5b4bc7] transition-colors">
                  <Plus size={13} /> Thêm phòng
                </button>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              {statusItems.map(([key, item]) => (
                <div key={key} className="inline-flex items-center gap-1.5 rounded-lg border border-[#ececf2] bg-[#fafaff] px-2.5 py-1.5 text-[11px] text-[#70778d]">
                  <span className={`h-2 w-2 rounded-full ${item.dot}`} />
                  <span>{item.name}</span>
                  <span className="font-bold text-[#3e435b]">{area.rooms.filter(room => room.status === key).length}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {[{ label: "Dãy 1", floors: [1, 2] }, { label: "Dãy 2", floors: [3, 4] }].map((row) => (
                <div key={row.label}>
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-[1px] text-[#9da2b4]">{row.label}</div>
                  <div className="flex flex-wrap gap-2">
                    {area.rooms.filter(room => row.floors.includes(room.floor)).map(room => (
                      <div key={room.id} title={`Phòng ${room.number} · ${STATUS[room.status].name}`} className={`flex h-[62px] w-[76px] flex-col items-center justify-center gap-1 rounded-xl border text-[13px] font-bold transition-colors hover:brightness-[0.98] ${STATUS[room.status].room}`}>
                        <span>{room.number}</span>
                        <span className={`h-2 w-2 rounded-full ${STATUS[room.status].dot}`} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
        {filteredAreas.length === 0 && (
          <p className="rounded-xl border border-dashed border-[#dfe1eb] bg-white px-4 py-8 text-center text-sm text-[#858ba0]">
            Không tìm thấy khu vực phù hợp.
          </p>
        )}
      </div>
    </div>
  );
}
