import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  FilePlus2,
  FileText,
  FileCheck2,
  CalendarClock,
  FileX2,
  Loader2,
  MapPin,
  Crown,
} from "lucide-react";
import AreaSearchDropdown from "../components/AreaSearchDropdown.jsx";
import ContractDetailModal from "../components/ContractDetailModal.jsx";
import CreateContractModal from "../components/CreateContractModal.jsx";
import { getContracts } from "../services/contractService.js";
import { getAreas } from "../services/ereaService.js";
import { getRooms } from "../services/roomService.js";
import { getTenants } from "../services/tenantService.js";
import { CONTRACT_STATUS, daysUntil, formatDate, formatMoney, getId } from "../utils/contractHelpers.js";

const STATUS_TABS = [
  { value: "", label: "Tất cả" },
  { value: "active", label: "Đang hiệu lực" },
  { value: "expiring", label: "Sắp hết hạn" },
  { value: "expired", label: "Hết hạn" },
  { value: "terminated", label: "Đã thanh lý" },
  { value: "draft", label: "Nháp" },
];

const isExpiring = (contract) => {
  if (contract.status !== "active") return false;
  const remain = daysUntil(contract.endDate);
  return remain !== null && remain <= 30;
};

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#ebeaf3] bg-white p-3.5 shadow-[0_2px_12px_rgba(31,33,87,0.02)]">
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[11px] font-semibold text-[#8c92a6]">{label}</p>
        <p className="text-lg font-extrabold leading-tight text-[#20243c]">{value}</p>
      </div>
    </div>
  );
}

export default function ContractsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [statusTab, setStatusTab] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  const { data: contracts = [], isLoading, isError } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => getContracts(),
  });
  const { data: areas = [] } = useQuery({ queryKey: ["areas"], queryFn: getAreas });
  const { data: rooms = [] } = useQuery({ queryKey: ["rooms"], queryFn: () => getRooms() });
  const { data: tenants = [] } = useQuery({ queryKey: ["tenants"], queryFn: () => getTenants() });

  // Phòng đang có hợp đồng hiệu lực -> không cho tạo thêm
  const busyRoomIds = useMemo(
    () => new Set(contracts.filter((c) => c.status === "active").map((c) => getId(c.roomId))),
    [contracts],
  );

  const stats = useMemo(() => ({
    total: contracts.length,
    active: contracts.filter((c) => c.status === "active").length,
    expiring: contracts.filter(isExpiring).length,
    closed: contracts.filter((c) => c.status === "expired" || c.status === "terminated").length,
  }), [contracts]);

  const filteredContracts = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase("vi");
    return contracts.filter((c) => {
      if (selectedArea && getId(c.areaId) !== selectedArea) return false;
      if (statusTab === "expiring" && !isExpiring(c)) return false;
      if (statusTab && statusTab !== "expiring" && c.status !== statusTab) return false;
      if (!query) return true;
      const text = `${c.contractCode} ${c.roomId?.code || ""} ${c.tenantId?.fullName || ""} ${c.tenantId?.phone || ""}`
        .toLocaleLowerCase("vi");
      return text.includes(query);
    });
  }, [contracts, searchTerm, selectedArea, statusTab]);

  return (
    <div className="w-full space-y-4 px-2 py-3 lg:px-4 lg:py-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-tight text-[#20243c] sm:text-[22px]">Hợp đồng</h1>
          <p className="mt-0.5 text-xs text-[#8c92a6]">Quản lý hợp đồng thuê phòng, thời hạn và gia hạn</p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex h-8 items-center justify-center gap-1 rounded-[8px] bg-[#6756df] px-2.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-[#5b4bc7]"
        >
          <FilePlus2 size={13} />
          Tạo hợp đồng
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={FileText} label="Tổng hợp đồng" value={stats.total} tone="bg-[#f1effe] text-[#6756df]" />
        <StatCard icon={FileCheck2} label="Đang hiệu lực" value={stats.active} tone="bg-[#e3f8f0] text-[#159878]" />
        <StatCard icon={CalendarClock} label="Sắp hết hạn (≤30 ngày)" value={stats.expiring} tone="bg-[#fff2de] text-[#bf8a37]" />
        <StatCard icon={FileX2} label="Hết hạn / Thanh lý" value={stats.closed} tone="bg-[#edf0f4] text-[#7f8794]" />
      </div>

      {/* Filter bar */}
      <div className="space-y-2.5 rounded-2xl border border-[#ebeaf3] bg-white p-2.5 shadow-[0_2px_12px_rgba(31,33,87,0.02)]">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9da2b4]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm mã HĐ, phòng, tên khách, SĐT..."
              className="h-9 w-full rounded-xl border border-[#e5e6ee] bg-[#f9f9fc] pl-9 pr-3 text-[12px] text-[#20243c] placeholder-[#9da2b4] transition focus:border-[#6756df] focus:bg-white focus:outline-none"
            />
          </div>
          <AreaSearchDropdown
            areas={areas}
            selectedAreaId={selectedArea}
            onSelectArea={(aId) => setSelectedArea(aId)}
          />
          <div className="ml-auto flex items-center gap-1.5 rounded-lg bg-[#f4f3fd] px-2.5 py-1 text-[11px] font-semibold text-[#6756df]">
            <span>Hiển thị:</span>
            <span className="font-bold">{filteredContracts.length}</span>
            <span className="text-[#8c92a6]">/ {contracts.length}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusTab(tab.value)}
              className={`rounded-lg border px-2.5 py-1 text-[11.5px] font-semibold transition ${
                statusTab === tab.value
                  ? "border-[#c7befb] bg-[#f1effe] text-[#5b4bc7]"
                  : "border-[#ececf3] bg-white text-[#6b7086] hover:border-[#d5d0f5]"
              }`}
            >
              {tab.label}
              {tab.value === "expiring" && stats.expiring > 0 && (
                <span className="ml-1 rounded bg-[#fff2de] px-1 text-[10px] font-bold text-[#bf8a37]">{stats.expiring}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#ebeaf3] bg-white shadow-[0_4px_20px_rgba(31,33,87,0.03)]">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <Loader2 className="animate-spin text-[#6756df]" size={30} />
            <p className="text-xs text-[#8c92a6]">Đang tải danh sách hợp đồng...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-xs text-[#dd5262]">Không thể tải danh sách hợp đồng.</div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#ebeaf3] bg-[#fafafc]">
                  {["Mã hợp đồng", "Phòng", "Người đại diện", "Thời hạn", "Giá thuê", "Tiền cọc", "Trạng thái"].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-[#8c92a6]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f3f8]">
                {filteredContracts.map((c) => {
                  const status = CONTRACT_STATUS[c.status] || CONTRACT_STATUS.active;
                  const remain = daysUntil(c.endDate);
                  const expiring = isExpiring(c);
                  return (
                    <tr
                      key={c._id}
                      onClick={() => setSelectedContract(c)}
                      className="cursor-pointer transition-colors hover:bg-[#fcfbfe]"
                    >
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-[#20243c]">{c.contractCode}</p>
                        <p className="text-[10.5px] text-[#9095aa]">Tạo {formatDate(c.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        {c.roomId?.code ? (
                          <span className="inline-flex items-center rounded-lg bg-[#f0effd] px-2.5 py-1 text-xs font-bold text-[#5644d8]">
                            {c.roomId.code}
                          </span>
                        ) : (
                          <span className="text-[11px] italic text-[#a4a9bc]">Đã xóa</span>
                        )}
                        <p className="mt-1 flex items-center gap-1 text-[10.5px] text-[#9095aa]">
                          <MapPin size={10} /> {c.areaId?.name || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="flex items-center gap-1 font-bold text-[#20243c]">
                          <Crown size={11} className="text-[#b9822f]" />
                          {c.tenantId?.fullName || "—"}
                        </p>
                        <p className="font-mono text-[10.5px] text-[#9095aa]">{c.tenantId?.phone || ""}</p>
                      </td>
                      <td className="px-4 py-3.5 text-[#4b5168]">
                        <p className="font-semibold">{formatDate(c.startDate)} → {formatDate(c.endDate)}</p>
                        {c.status === "active" && remain !== null && (
                          <p className={`text-[10.5px] font-semibold ${expiring ? (remain < 0 ? "text-[#d4515e]" : "text-[#bf8a37]") : "text-[#9095aa]"}`}>
                            {remain < 0 ? `Quá hạn ${Math.abs(remain)} ngày` : `Còn ${remain} ngày`}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#2b3046]">{formatMoney(c.rentalPrice)}</td>
                      <td className="px-4 py-3.5 font-semibold text-[#54596e]">{formatMoney(c.depositAmount)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${status.badgeClass}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dotClass}`} />
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {filteredContracts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="mx-auto flex max-w-xs flex-col items-center">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f4f3fd] text-[#6756df]">
                          <FileText size={24} />
                        </div>
                        <p className="mt-3 text-xs font-semibold text-[#20243c]">Chưa có hợp đồng nào</p>
                        <p className="mt-1 text-[11px] text-[#9095aa]">Bấm "Tạo hợp đồng" để lập hợp đồng thuê phòng đầu tiên.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateContractModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        areas={areas}
        rooms={rooms}
        tenants={tenants}
        busyRoomIds={busyRoomIds}
      />

      <ContractDetailModal
        isOpen={Boolean(selectedContract)}
        onClose={() => setSelectedContract(null)}
        contract={selectedContract}
      />
    </div>
  );
}

