import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronDown, Plus } from "lucide-react";
import AreaRoomCard from "../components/AreaRoomCard.jsx";
import CreateAreaModal from "../components/CreateAreaModal.jsx";
import CreateRoomModal from "../components/CreateRoomModal.jsx";
import RoomDetailModal from "../components/RoomDetailModal.jsx";
import { getAreas } from "../services/ereaService.js";
import { getRooms } from "../services/roomService.js";
import { getRows } from "../services/rowService.js";

export default function RoomMap() {
  const [areaQuery, setAreaQuery] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [areaOptionsOpen, setAreaOptionsOpen] = useState(false);
  const [isCreateAreaOpen, setIsCreateAreaOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalDefaultAreaId, setModalDefaultAreaId] = useState("");
  const [modalDefaultRowId, setModalDefaultRowId] = useState("");
  const [selectedRoomDetail, setSelectedRoomDetail] = useState(null);
  const areaSelectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (areaSelectRef.current && !areaSelectRef.current.contains(event.target)) {
        setAreaOptionsOpen(false);
      }
    };
    if (areaOptionsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [areaOptionsOpen]);

  const {
    data: areasData = [],
    isLoading: isLoadingAreas,
    isError: isAreasError,
  } = useQuery({
    queryKey: ["areas"],
    queryFn: getAreas,
  });

  const {
    data: rowsData = [],
    isLoading: isLoadingRows,
  } = useQuery({
    queryKey: ["rows"],
    queryFn: () => getRows(),
  });

  const {
    data: roomsData = [],
    isLoading: isLoadingRooms,
    isError: isRoomsError,
  } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => getRooms(),
  });

  const isLoading = isLoadingAreas || isLoadingRows || isLoadingRooms;
  const isError = isAreasError || isRoomsError;

  const areasWithRooms = useMemo(() => {
    return areasData.map((area) => {
      const areaRows = rowsData.filter(
        (row) => String(row.areaId) === String(area.id) && row.isActive !== false,
      );
      const areaRooms = roomsData.filter(
        (room) => String(room.areaId) === String(area.id),
      );
      return {
        ...area,
        rows: areaRows,
        rooms: areaRooms,
      };
    });
  }, [areasData, rowsData, roomsData]);

  // Nếu đang chọn sẵn 1 khu (selectedAreaId có giá trị), mở dropdown vẫn hiện đủ tất cả các khu để đổi nhanh.
  // Chỉ lọc danh sách gợi ý khi người dùng đang gõ tìm kiếm (selectedAreaId === "").
  const matchingAreas = useMemo(() => {
    if (selectedAreaId) return areasWithRooms;
    const keyword = areaQuery.trim().toLocaleLowerCase("vi");
    if (!keyword) return areasWithRooms;
    return areasWithRooms.filter((area) =>
      area.name.toLocaleLowerCase("vi").includes(keyword),
    );
  }, [areasWithRooms, areaQuery, selectedAreaId]);

  const filteredAreas = useMemo(() => {
    if (selectedAreaId) {
      return areasWithRooms.filter((area) => area.id === selectedAreaId);
    }
    return matchingAreas;
  }, [areasWithRooms, matchingAreas, selectedAreaId]);

  const handleOpenCreateModal = (areaId = "", rowId = "") => {
    setModalDefaultAreaId(areaId || selectedAreaId || areasData[0]?.id || "");
    setModalDefaultRowId(rowId || "");
    setIsCreateModalOpen(true);
  };

  return (
    <div className="min-h-full bg-[#f6f7fb] text-[#20243c]">
      <div className="mx-auto w-full max-w-[1640px] space-y-3 px-3 py-0 sm:px-5 lg:px-6">
        {/* Page heading */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[19px] font-extrabold tracking-[-0.5px] text-[#24283d]">Sơ đồ phòng</h1>
            <p className="mt-0.5 text-[11.5px] text-[#969baa]">Quản lý trạng thái và thông tin phòng</p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateAreaOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#6756df] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#5645ce] active:scale-[0.98]"
          >
            <Plus size={15} />
            Thêm khu
          </button>
        </div>

        <div ref={areaSelectRef} className="relative w-full max-w-[240px]">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-[11px] text-[#a2a6b7]" />
          <input
            type="text"
            role="combobox"
            aria-label="Tìm và chọn khu vực"
            aria-expanded={areaOptionsOpen}
            aria-controls="area-options"
            aria-autocomplete="list"
            value={areaQuery}
            onFocus={() => setAreaOptionsOpen(true)}
            onClick={() => setAreaOptionsOpen(true)}
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
            className="h-9 w-full rounded-[9px] border border-[#e5e6ee] bg-white pl-8 pr-8 text-[12px] outline-none placeholder:text-[#9298aa] focus:border-[#6756df]"
          />
          <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-[11px] text-[#a2a6b7]" />
          {areaOptionsOpen && (
            <div id="area-options" role="listbox" className="absolute left-0 right-0 top-10 z-20 max-h-56 overflow-y-auto rounded-xl border border-[#e8e9f0] bg-white p-1 shadow-lg">
              <button
                type="button"
                role="option"
                aria-selected={!selectedAreaId}
                onClick={() => {
                  setSelectedAreaId("");
                  setAreaQuery("");
                  setAreaOptionsOpen(false);
                }}
                className={`w-full rounded-lg px-2.5 py-1.5 text-left text-[12px] transition-colors ${
                  !selectedAreaId
                    ? "bg-[#efedff] font-semibold text-[#6756df]"
                    : "text-[#60667c] hover:bg-[#f5f4fb]"
                }`}
              >
                Tất cả khu
              </button>
              {matchingAreas.map((area) => {
                const isSelected = selectedAreaId === area.id;
                return (
                  <button
                    key={area.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      setSelectedAreaId(area.id);
                      setAreaQuery(area.name);
                      setAreaOptionsOpen(false);
                    }}
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
                <p className="px-2.5 py-1.5 text-[12px] text-[#858ba0]">Không tìm thấy khu vực.</p>
              )}
            </div>
          )}
        </div>

        {/* Loading / Error */}
        {isLoading && (
          <div className="rounded-xl border border-[#e7e7ef] bg-white px-4 py-6 text-center text-xs text-[#858ba0]">
            Đang tải dữ liệu khu vực và sơ đồ phòng...
          </div>
        )}

        {!isLoading && isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-5 text-center text-xs text-red-600">
            Không thể tải dữ liệu khu vực và phòng từ máy chủ.
          </div>
        )}

        {/* Areas */}
        {!isLoading && !isError && filteredAreas.map((area) => (
          <AreaRoomCard
            key={area.id}
            area={area}
            onAddRoom={handleOpenCreateModal}
            onSelectRoom={(room, currentArea, rowLabel) =>
              setSelectedRoomDetail({ room, area: currentArea, rowLabel })
            }
          />
        ))}

        {!isLoading && !isError && filteredAreas.length === 0 && (
          <p className="rounded-xl border border-dashed border-[#dfe1eb] bg-white px-4 py-6 text-center text-xs text-[#858ba0]">
            Không tìm thấy khu vực phù hợp.
          </p>
        )}
      </div>

      <CreateAreaModal
        isOpen={isCreateAreaOpen}
        onClose={() => setIsCreateAreaOpen(false)}
      />

      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        areas={areasData}
        rows={rowsData}
        defaultAreaId={modalDefaultAreaId}
        defaultRowId={modalDefaultRowId}
      />

      <RoomDetailModal
        isOpen={Boolean(selectedRoomDetail)}
        onClose={() => setSelectedRoomDetail(null)}
        room={selectedRoomDetail?.room}
        area={selectedRoomDetail?.area}
        rowLabel={selectedRoomDetail?.rowLabel}
        rows={rowsData}
      />
    </div>
  );
}
