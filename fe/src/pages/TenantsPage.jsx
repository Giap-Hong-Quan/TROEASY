import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Phone, MapPin, Building2, SlidersHorizontal, Loader2, CreditCard } from "lucide-react";
import { getAreas } from "../services/ereaService.js";
import { getTenants } from "../services/tenantService.js";

const STATUS_MAP = {
  active: {
    label: "Đang thuê",
    badgeClass: "bg-[#e3f8f0] text-[#159878] border-[#a8edd8]",
    dotClass: "bg-[#159878]",
  },
  checkout: {
    label: "Đã trả phòng",
    badgeClass: "bg-[#edf0f4] text-[#8d95a1] border-[#d8dce2]",
    dotClass: "bg-[#8d95a1]",
  },
};

function formatMoney(value) {
  if (!value && value !== 0) return "0đ";
  if (value >= 1000000) {
    return `${(value / 1000000)
      .toFixed(value % 1000000 === 0 ? 0 : 2)
      .replace(".00", "")}tr`;
  }
  return `${Number(value).toLocaleString("vi-VN")}đ`;
}

function getAvatarInitial(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return parts[parts.length - 1].charAt(0).toUpperCase();
  }
  return name.charAt(0).toUpperCase();
}

export default function TenantsPage({
  onViewTenant,
  onCheckoutTenant,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState("");

  // 1. Gọi API Lấy danh sách Khách thuê từ Backend
  const {
    data: tenantsData = [],
    isLoading: isLoadingTenants,
    isError: isTenantsError,
  } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => getTenants(),
  });

  // 2. Gọi API Lấy danh sách Khu vực
  const { data: areasData = [] } = useQuery({
    queryKey: ["areas"],
    queryFn: getAreas,
  });

  // Lọc tìm kiếm & khu vực phía Frontend
  const filteredTenants = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase("vi");

    return tenantsData.filter((tenant) => {
      const tenantAreaId =
        tenant.areaId?._id || tenant.areaId?.id || tenant.areaId;

      const matchesArea = !selectedArea || String(tenantAreaId) === String(selectedArea);

      const roomCode = tenant.roomId?.code || "";
      const searchableText = `${roomCode} ${tenant.fullName} ${tenant.phone || ""} ${tenant.citizenId || ""}`
        .toLocaleLowerCase("vi");

      const matchesSearch = !query || searchableText.includes(query);

      return matchesArea && matchesSearch;
    });
  }, [tenantsData, searchTerm, selectedArea]);

  return (
    <div className="w-full space-y-4 px-2 py-3 lg:px-4 lg:py-4">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-tight text-[#20243c] sm:text-[22px]">
            Danh sách khách thuê
          </h1>
          <p className="mt-0.5 text-xs text-[#8c92a6]">
            Quản lý khách thuê và hồ sơ lưu trú · <span className="font-semibold text-[#6756df]">{tenantsData.length}</span> khách trong hệ thống
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-[#ebeaf3] bg-white p-2.5 shadow-[0_2px_12px_rgba(31,33,87,0.02)]">
        {/* Search Input */}
        <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9da2b4]"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm tên khách, phòng, SĐT, CCCD..."
            className="w-full rounded-xl border border-[#e5e6ee] bg-[#f9f9fc] py-1.5 pl-9 pr-3 text-xs text-[#20243c] placeholder-[#9da2b4] transition focus:border-[#6756df] focus:bg-white focus:outline-none"
          />
        </div>

        {/* Filter Area Select */}
        <div className="relative">
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="cursor-pointer appearance-none rounded-xl border border-[#e5e6ee] bg-[#f9f9fc] py-1.5 pl-3 pr-8 text-xs font-medium text-[#4b5168] transition hover:border-[#d0d3e2] focus:border-[#6756df] focus:bg-white focus:outline-none"
          >
            <option value="">Tất cả khu vực</option>
            {areasData.map((area) => {
              const aId = area._id || area.id;
              return (
                <option key={aId} value={aId}>
                  {area.name}
                </option>
              );
            })}
          </select>
          <SlidersHorizontal
            size={12}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8c92a6]"
          />
        </div>

        {/* Total stats pill */}
        <div className="ml-auto flex items-center gap-1.5 rounded-lg bg-[#f4f3fd] px-2.5 py-1 text-[11px] font-semibold text-[#6756df]">
          <span>Hiển thị:</span>
          <span className="font-bold">{filteredTenants.length}</span>
          <span className="text-[#8c92a6]">/ {tenantsData.length}</span>
        </div>
      </div>

      {/* Table Card */}
      <div className="overflow-hidden rounded-2xl border border-[#ebeaf3] bg-white shadow-[0_4px_20px_rgba(31,33,87,0.03)]">
        {isLoadingTenants ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <Loader2 className="animate-spin text-[#6756df]" size={30} />
            <p className="text-xs text-[#8c92a6]">Đang tải danh sách khách thuê...</p>
          </div>
        ) : isTenantsError ? (
          <div className="p-8 text-center text-xs text-[#dd5262]">
            Không thể tải danh sách khách thuê. Vui lòng kiểm tra lại kết nối mạng hoặc server!
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#ebeaf3] bg-[#fafafc]">
                  <th className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-[#8c92a6]">
                    Phòng
                  </th>
                  <th className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-[#8c92a6]">
                    Khu vực
                  </th>
                  <th className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-[#8c92a6]">
                    Khách thuê
                  </th>
                  <th className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-[#8c92a6]">
                    Số điện thoại
                  </th>
                  <th className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-[#8c92a6]">
                    Số CCCD
                  </th>
                  <th className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-[#8c92a6]">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-[#8c92a6]">
                    Tiền cọc
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-extrabold uppercase tracking-wider text-[#8c92a6]">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f2f3f8]">
                {filteredTenants.map((tenant) => {
                  const status = STATUS_MAP[tenant.status] || {
                    label: tenant.status || "Đang ở",
                    badgeClass: "bg-[#e3f8f0] text-[#159878] border-[#a8edd8]",
                    dotClass: "bg-[#159878]",
                  };

                  const areaName = tenant.areaId?.name || "—";
                  const roomCode = tenant.roomId?.code;

                  return (
                    <tr
                      key={tenant._id}
                      className="group transition-colors hover:bg-[#fcfbfe]"
                    >
                      {/* Phòng */}
                      <td className="px-4 py-3.5">
                        {roomCode ? (
                          <span className="inline-flex items-center rounded-lg bg-[#f0effd] px-2.5 py-1 text-xs font-bold text-[#5644d8]">
                            P.{roomCode}
                          </span>
                        ) : (
                          <span className="text-[11px] italic text-[#a4a9bc]">
                            Chưa gán
                          </span>
                        )}
                      </td>

                      {/* Khu vực */}
                      <td className="px-4 py-3.5 font-medium text-[#4b5168]">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-[#9ea4b8]" />
                          <span>{areaName}</span>
                        </div>
                      </td>

                      {/* Khách thuê */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#6756df] to-[#9c75f0] text-[11px] font-bold text-white shadow-sm">
                            {getAvatarInitial(tenant.fullName)}
                          </div>
                          <div>
                            <p className="font-bold text-[#20243c]">
                              {tenant.fullName}
                            </p>
                            <span className="text-[10px] text-[#9095aa]">
                              {tenant.isRepresentative ? "Hợp đồng chính" : "Ở cùng"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* SĐT */}
                      <td className="px-4 py-3.5 text-[#54596e]">
                        {tenant.phone ? (
                          <div className="flex items-center gap-1 font-mono text-[11.5px]">
                            <Phone size={12} className="text-[#a4a9bc]" />
                            <span>{tenant.phone}</span>
                          </div>
                        ) : (
                          <span className="text-[#a4a9bc]">—</span>
                        )}
                      </td>

                      {/* CCCD */}
                      <td className="px-4 py-3.5 text-[#54596e]">
                        {tenant.citizenId ? (
                          <div className="flex items-center gap-1 font-mono text-[11.5px]">
                            <CreditCard size={12} className="text-[#a4a9bc]" />
                            <span>{tenant.citizenId}</span>
                          </div>
                        ) : (
                          <span className="text-[#a4a9bc]">—</span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${status.badgeClass}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                          {status.label}
                        </span>
                      </td>

                      {/* Tiền cọc */}
                      <td className="px-4 py-3.5 font-semibold text-[#2b3046]">
                        {formatMoney(tenant.depositAmount)}
                      </td>

                      {/* Thao tác */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onViewTenant?.(tenant)}
                            className="rounded-lg border border-[#e5e6ee] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#54596e] transition hover:border-[#c7befb] hover:bg-[#faf9ff] hover:text-[#624dd5]"
                          >
                            Chi tiết
                          </button>

                          {tenant.status === "active" && (
                            <button
                              type="button"
                              onClick={() => onCheckoutTenant?.(tenant)}
                              className="rounded-lg border border-transparent bg-[#ffebee] px-2.5 py-1 text-[11px] font-semibold text-[#dd5262] transition hover:bg-[#ffdfe4]"
                            >
                              Trả phòng
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredTenants.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="mx-auto flex max-w-xs flex-col items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4f3fd] text-[#6756df]">
                          <Building2 size={24} />
                        </div>
                        <p className="mt-3 text-xs font-semibold text-[#20243c]">
                          Chưa có khách thuê nào
                        </p>
                        <p className="mt-1 text-[11px] text-[#9095aa]">
                          Vào mục Sơ đồ phòng &gt; bấm vào phòng để thêm khách thuê vào phòng đó.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
