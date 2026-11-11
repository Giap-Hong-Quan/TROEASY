import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  FileSpreadsheet,
  Loader2,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";
import AreaSearchDropdown from "../components/AreaSearchDropdown.jsx";
import CreateInvoiceModal from "../components/CreateInvoiceModal.jsx";
import CustomSelect from "../components/CustomSelect.jsx";
import InvoicePaymentModal from "../components/InvoicePaymentModal.jsx";
import { getAreas } from "../services/ereaService.js";
import { deleteInvoice, getInvoices } from "../services/invoiceService.js";

function formatVnd(value) {
  return `${Math.round(Number(value) || 0).toLocaleString("vi-VN")} đ`;
}

const STATUS_BADGE = {
  paid: {
    label: "Đã thu đủ",
    className: "bg-[#e4f8f0] text-[#168e70] border border-[#b8e7d9]",
  },
  partial: {
    label: "Thu 1 phần",
    className: "bg-[#fff3e4] text-[#bb833c] border border-[#f6dfbd]",
  },
  unpaid: {
    label: "Chưa thu",
    className: "bg-[#fff0f0] text-[#df606d] border border-[#f8d9dd]",
  },
};

function StatCard({ icon: Icon, label, value, subtext, tone }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#ebeaf3] bg-white p-3.5 shadow-[0_2px_12px_rgba(31,33,87,0.02)]">
      <div
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-[#8c92a6]">{label}</p>
        <p className="truncate text-lg font-extrabold leading-tight text-[#20243c]">
          {value}
        </p>
        {subtext && (
          <p className="mt-0.5 truncate text-[11px] text-[#9298aa]">{subtext}</p>
        )}
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const now = useMemo(() => new Date(), []);
  // Mặc định hiển thị Tháng 10/2026 nếu tháng hiện tại chưa lập, hoặc theo tháng hiện tại
  const [month, setMonth] = useState(() => now.getMonth() + 1);
  const [year, setYear] = useState(() => now.getFullYear());
  const [selectedArea, setSelectedArea] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState(null);

  const { data: areas = [] } = useQuery({
    queryKey: ["areas"],
    queryFn: getAreas,
  });

  const {
    data: invoiceData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      "invoices",
      selectedArea || "all",
      month,
      year,
      statusFilter || "all",
    ],
    queryFn: () =>
      getInvoices({
        areaId: selectedArea || undefined,
        month,
        year,
        status: statusFilter || undefined,
      }),
  });

  const invoices = useMemo(() => invoiceData?.invoices ?? [], [invoiceData]);
  const summary = invoiceData?.summary ?? {
    totalCount: 0,
    paidCount: 0,
    partialCount: 0,
    unpaidCount: 0,
    totalAmount: 0,
    paidAmount: 0,
    remainingAmount: 0,
  };

  const filteredInvoices = useMemo(() => {
    const q = searchTerm.trim().toLocaleLowerCase("vi");
    if (!q) return invoices;
    return invoices.filter((inv) => {
      const text = `${inv.roomCode} ${inv.areaName} ${inv.tenantName} ${inv.invoiceCode}`.toLocaleLowerCase(
        "vi"
      );
      return text.includes(q);
    });
  }, [invoices, searchTerm]);

  const deleteMutation = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoiceSheet"] });
      queryClient.invalidateQueries({ queryKey: ["utilitySheet"] });
      toast.success("Đã xóa hóa đơn thành công.");
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message || err.message || "Xóa hóa đơn thất bại."
      );
    },
  });

  const handleDelete = (inv) => {
    if (
      !window.confirm(
        `Xóa hóa đơn ${inv.invoiceCode} của phòng ${inv.roomCode} (Tháng ${inv.month}/${inv.year})?`
      )
    ) {
      return;
    }
    deleteMutation.mutate(inv.id);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-[#20243c]">
            Hóa đơn & thu tiền
          </h1>
          <p className="mt-0.5 text-xs text-[#898fa3]">
            Lập hóa đơn tiền phòng, điện nước, dịch vụ và theo dõi thu tiền theo
            tháng
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CustomSelect
            value={month}
            onChange={(val) => setMonth(Number(val))}
            options={Array.from({ length: 12 }, (_, i) => ({
              value: i + 1,
              label: `Tháng ${i + 1}`,
            }))}
            className="w-[114px]"
          />

          <CustomSelect
            value={year}
            onChange={(val) => setYear(Number(val))}
            options={[year - 1, year, year + 1].map((y) => ({
              value: y,
              label: `Năm ${y}`,
            }))}
            className="w-[114px]"
          />

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#6e5ce8] px-3.5 text-xs font-bold text-white shadow-[0_6px_18px_rgba(110,92,232,0.28)] transition hover:bg-[#5c4ad6]"
          >
            <Plus size={14} />
            Lập hóa đơn T{month}/{year}
          </button>
        </div>
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FileSpreadsheet}
          label={`Hóa đơn kỳ Tháng ${month}/${year}`}
          value={`${summary.totalCount} hóa đơn`}
          subtext={`${summary.paidCount} đã thu · ${
            summary.unpaidCount + summary.partialCount
          } chưa thu đủ`}
          tone="bg-[#efecff] text-[#5e4bd5]"
        />
        <StatCard
          icon={ReceiptText}
          label="Tổng tiền hóa đơn"
          value={formatVnd(summary.totalAmount)}
          subtext={`Kỳ tháng ${month}/${year}`}
          tone="bg-[#e8f5ff] text-[#1a78b0]"
        />
        <StatCard
          icon={CheckCircle2}
          label="Đã thu trong kỳ"
          value={formatVnd(summary.paidAmount)}
          subtext={`${summary.paidCount}/${summary.totalCount} hóa đơn hoàn tất`}
          tone="bg-[#e7f8f0] text-[#188f70]"
        />
        <StatCard
          icon={AlertCircle}
          label="Công nợ phải thu"
          value={formatVnd(summary.remainingAmount)}
          subtext={`${
            summary.unpaidCount + summary.partialCount
          } hóa đơn còn nợ`}
          tone="bg-[#fff0f0] text-[#df606d]"
        />
      </div>

      {/* Bộ lọc */}
      <div className="rounded-2xl border border-[#e9e9f2] bg-white p-3.5 shadow-[0_2px_14px_rgba(27,31,74,0.025)]">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="relative min-w-[230px] flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#989eb2]"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã phòng, khách thuê, mã hóa đơn..."
              className="h-9 w-full rounded-xl border border-[#e3e4ef] bg-[#fafafe] pl-9 pr-3 text-xs text-[#20243c] outline-none transition focus:border-[#6e5ce8] focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <AreaSearchDropdown
              areas={areas}
              selectedAreaId={selectedArea}
              onSelectArea={(areaId) => setSelectedArea(areaId)}
              className="w-[210px]"
            />

            <div className="flex items-center gap-1 rounded-xl bg-[#f5f6fb] p-1">
              {[
                { key: "", label: "Tất cả" },
                { key: "unpaid", label: "Chưa thu" },
                { key: "partial", label: "Thu 1 phần" },
                { key: "paid", label: "Đã thu đủ" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`h-7 rounded-lg px-2.5 text-[11px] font-bold transition ${
                    statusFilter === tab.key
                      ? "bg-white text-[#5e4bd5] shadow-xs"
                      : "text-[#676d85] hover:text-[#20243c]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bảng danh sách hóa đơn */}
      <div className="overflow-hidden rounded-2xl border border-[#e9e9f2] bg-white shadow-[0_2px_14px_rgba(27,31,74,0.025)]">
        {isLoading ? (
          <div className="flex items-center justify-center py-14 text-xs text-[#8b90a4]">
            <Loader2 size={16} className="mr-2 animate-spin text-[#6e5ce8]" />
            Đang tải danh sách hóa đơn...
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-xs text-rose-600">
            Không tải được danh sách hóa đơn. Vui lòng thử lại.
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-2.5 grid h-11 w-11 place-items-center rounded-2xl bg-[#efecff] text-[#6e5ce8]">
              <ReceiptText size={20} />
            </div>
            <p className="text-xs font-bold text-[#2f3450]">
              Chưa có hóa đơn nào trong Tháng {month}/{year}
            </p>
            <p className="mt-1 text-[11px] text-[#8d93a8]">
              Nhấn nút &ldquo;Lập hóa đơn T{month}/{year}&rdquo; để tạo hóa đơn
              tự động từ tiền phòng và chỉ số điện nước đã chốt.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-[#6e5ce8] px-3 text-[11.5px] font-semibold text-white hover:bg-[#5c4ad6]"
            >
              <Plus size={13} />
              Lập hóa đơn Tháng {month}/{year}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#ececf4] bg-[#f8f9fd] text-[11px] font-extrabold uppercase tracking-wider text-[#797f95]">
                  <th className="px-4 py-3">Phòng & Khu</th>
                  <th className="px-3 py-3">Khách đại diện</th>
                  <th className="px-3 py-3 text-right">Tiền phòng</th>
                  <th className="px-3 py-3 text-right">Điện + Nước</th>
                  <th className="px-3 py-3 text-right">Dịch vụ</th>
                  <th className="px-3 py-3 text-right">Tổng phải thu</th>
                  <th className="px-3 py-3 text-right">Đã thu / Còn nợ</th>
                  <th className="px-3 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eff0f7]">
                {filteredInvoices.map((inv) => {
                  const badge =
                    STATUS_BADGE[inv.status] || STATUS_BADGE.unpaid;

                  return (
                    <tr
                      key={inv.id}
                      className="transition hover:bg-[#fafafe]"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-extrabold text-[#20243c]">
                            {inv.roomCode}
                          </span>
                          <span className="rounded bg-[#f3f3fa] px-1.5 py-0.5 text-[10px] font-semibold text-[#6e748a]">
                            {inv.invoiceCode}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-[#8b90a5]">
                          {inv.areaName}
                          {inv.row ? ` · ${inv.row}` : ""}
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="font-semibold text-[#2e334d]">
                          {inv.tenantName || "Chưa có khách"}
                        </div>
                        {inv.tenantPhone && (
                          <div className="text-[10.5px] text-[#8d93a8]">
                            {inv.tenantPhone}
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-3 text-right font-bold text-[#20243c]">
                        {formatVnd(inv.roomPrice)}
                      </td>

                      <td className="px-3 py-3 text-right">
                        <div className="font-bold text-[#20243c]">
                          {formatVnd(inv.utilityAmount)}
                        </div>
                        <div className="text-[10px] text-[#858b9f]">
                          ⚡{inv.electricity?.usage ?? 0} kWh · 💧
                          {inv.water?.usage ?? 0} m³
                        </div>
                      </td>

                      <td className="px-3 py-3 text-right">
                        <div className="font-semibold text-[#333752]">
                          {formatVnd(inv.serviceAmount)}
                        </div>
                        <div className="text-[10px] text-[#858b9f]">
                          Mạng + Rác
                          {inv.otherFee > 0 ? " + Khác" : ""}
                        </div>
                      </td>

                      <td className="px-3 py-3 text-right text-[13px] font-extrabold text-[#5e4bd5]">
                        {formatVnd(inv.totalAmount)}
                      </td>

                      <td className="px-3 py-3 text-right">
                        <div className="font-bold text-[#168e70]">
                          Đã thu: {formatVnd(inv.paidAmount)}
                        </div>
                        {inv.remainingAmount > 0 ? (
                          <div className="text-[10.5px] font-bold text-[#df606d]">
                            Nợ: {formatVnd(inv.remainingAmount)}
                          </div>
                        ) : (
                          <div className="text-[10.5px] text-[#8d93a8]">
                            Còn nợ: 0 đ
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10.5px] font-bold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPayingInvoice(inv)}
                            className={`inline-flex h-8 items-center gap-1 rounded-[8px] px-2.5 text-[11.5px] font-semibold transition ${
                              inv.status === "paid"
                                ? "border border-[#e1e2ee] bg-white text-[#5d637a] hover:bg-[#f6f6fb]"
                                : "bg-[#6e5ce8] text-white hover:bg-[#5c4ad6]"
                            }`}
                          >
                            <Wallet size={13} />
                            {inv.status === "paid" ? "Chi tiết" : "Thu tiền"}
                          </button>
                          <button
                            type="button"
                            disabled={deleteMutation.isPending}
                            onClick={() => handleDelete(inv)}
                            title="Xóa hóa đơn"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#f2d8dc] bg-[#fff5f6] text-[#df606d] transition hover:bg-[#ffe8eb]"
                          >
                            <Trash2 size={13} />
                          </button>
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

      {/* Modal lập hóa đơn */}
      <CreateInvoiceModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        areas={areas}
        defaultAreaId={selectedArea}
        defaultMonth={month}
        defaultYear={year}
      />

      {/* Modal thu tiền */}
      <InvoicePaymentModal
        open={Boolean(payingInvoice)}
        invoice={payingInvoice}
        onClose={() => setPayingInvoice(null)}
      />
    </div>
  );
}

