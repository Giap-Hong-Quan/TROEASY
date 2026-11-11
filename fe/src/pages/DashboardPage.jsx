import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Plus,
  Home,
  TrendingUp,
  AlertCircle,
  Wrench,
} from "lucide-react";
import { getRoomOccupancyStats } from "../services/roomService.js";

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["roomOccupancyStats"],
    queryFn: () => getRoomOccupancyStats(),
  });

  const totalRooms = stats?.totalRooms ?? 17;
  const rentingRooms = stats?.rentingRooms ?? 11;
  const occupancyRate = stats?.occupancyRate ?? 65;

  return (
    <div className="space-y-6">
      {/* 1. HERO BANNER TÍM */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#594be2] via-[#6557e8] to-[#7c6eed] p-6 text-white shadow-[0_12px_36px_rgba(103,86,223,0.22)] md:p-8">
        {/* Họa tiết trang trí chìm phía sau */}
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 right-36 h-48 w-48 rounded-full bg-[#3d2db8]/20 blur-xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Cột trái: Giới thiệu & Actions */}
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold tracking-wider text-white backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              KHÔNG GIAN QUẢN LÝ CỦA BẠN
            </span>

            <h1 className="mt-3.5 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Vận hành phòng trọ, đơn giản hơn mỗi ngày.
            </h1>

            <p className="mt-2 text-xs font-normal leading-relaxed text-white/80 sm:text-sm">
              Mọi tình trạng phòng, khách thuê và khoản thu đều nằm trong tầm mắt.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate("/rooms")}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] bg-white px-4 text-xs font-bold text-[#5a48dc] shadow-sm transition-all hover:bg-white/90 active:scale-95"
              >
                Xem sơ đồ phòng
                <ArrowUpRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => navigate("/invoices")}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] bg-white/15 px-4 text-xs font-bold text-white backdrop-blur-sm transition-all hover:bg-white/25 active:scale-95"
              >
                <Plus size={14} />
                Tạo hóa đơn
              </button>
            </div>
          </div>

          {/* Cột phải: Card vòng tròn tỷ lệ lấp đầy */}
          <div className="flex shrink-0 items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/15 sm:p-5">
            {/* Vòng tròn tiến độ */}
            <div className="relative flex h-16 w-16 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                {/* Vòng nền */}
                <path
                  className="text-white/20"
                  strokeWidth="3.2"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Vòng tiến độ động theo tỷ lệ thực tế */}
                <path
                  className="text-emerald-300 transition-all duration-500 ease-out"
                  strokeDasharray={`${occupancyRate}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.2"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-xs font-extrabold text-white">
                {occupancyRate}%
              </span>
            </div>

            {/* Thông tin thống kê */}
            <div>
              <p className="text-[11px] font-medium text-white/75">Tỷ lệ lấp đầy</p>
              <p className="text-base font-black text-white">
                {rentingRooms}/{totalRooms} phòng
              </p>
              <p className="mt-0.5 text-[10.5px] text-white/60">
                {stats ? "Thống kê từ CSDL thực tế" : "Theo phòng dữ liệu mẫu"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SECTION TỔNG QUAN HOẠT ĐỘNG */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#20243c]">
              Tổng quan hoạt động
            </h2>
            <p className="mt-0.5 text-xs text-[#9298aa]">
              Tháng 10/2026 · Báo cáo từ dữ liệu demo
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-[#e5e6ee] bg-white px-3 py-1.5 text-xs font-semibold text-[#54596e] shadow-sm transition hover:bg-[#f6f7fa]"
          >
            Xem báo cáo
            <ArrowUpRight size={13} />
          </button>
        </div>

        {/* 4 CARDS THỐNG KÊ */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Phòng đang thuê */}
          <div className="flex flex-col justify-between rounded-[20px] border border-[#e7e7ef] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8c92a6]">
                  Phòng đang thuê
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <Home size={18} />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-1">
                <span className="text-2xl font-black text-[#20243c]">11</span>
                <span className="text-base font-extrabold text-[#8c92a6]">/17</span>
              </div>
              <p className="mt-1 text-[11px] text-[#9298aa]">
                65% tổng số phòng mẫu
              </p>
            </div>
            {/* Thanh tiến độ */}
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[#f0f0f7]">
              <div
                className="h-full rounded-full bg-[#6756df]"
                style={{ width: "65%" }}
              />
            </div>
          </div>

          {/* Card 2: Tổng tiền hóa đơn */}
          <div className="flex flex-col justify-between rounded-[20px] border border-[#e7e7ef] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8c92a6]">
                  Tổng tiền hóa đơn
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="text-2xl font-black text-[#20243c]">
                  33.87tr
                </span>
              </div>
              <p className="mt-1 text-[11px] font-semibold text-[#168e70]">
                21.90tr <span className="font-normal text-[#9298aa]">đã thu trong tháng</span>
              </p>
            </div>
          </div>

          {/* Card 3: Công nợ phải thu */}
          <div className="flex flex-col justify-between rounded-[20px] border border-[#e7e7ef] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8c92a6]">
                  Công nợ phải thu
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <AlertCircle size={18} />
                </div>
              </div>
              <div className="mt-2.5">
                <span className="text-2xl font-black text-[#20243c]">
                  11.97tr
                </span>
              </div>
              <p className="mt-1 text-[11px] font-semibold text-rose-600">
                4 hóa đơn <span className="font-normal text-[#9298aa]">chưa thanh toán đủ</span>
              </p>
            </div>
          </div>

          {/* Card 4: Yêu cầu bảo trì */}
          <div className="flex flex-col justify-between rounded-[20px] border border-[#e7e7ef] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8c92a6]">
                  Yêu cầu bảo trì
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Wrench size={18} />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-1">
                <span className="text-2xl font-black text-[#20243c]">4</span>
                <span className="text-xs font-semibold text-[#8c92a6]">ticket</span>
              </div>
              <p className="mt-1 text-[11px] text-[#9298aa]">
                Đang mở hoặc đang xử lý
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
