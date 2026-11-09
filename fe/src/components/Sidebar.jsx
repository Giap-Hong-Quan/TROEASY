import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import logo from "../assets/logo.png";
import { getCurrentUser, logout } from "../services/authService.js";
import {
  LayoutDashboard, House, UsersRound, FileText, Zap, CreditCard,
  Wrench, ChartNoAxesCombined, ChartColumnIncreasing,
  X, MoreHorizontal, UserRound, LogOut
} from "lucide-react";

const groups = [
  { title: "TỔNG QUAN", items: [
    { label: "Tổng quan", icon: LayoutDashboard, path: "/" },
    { label: "Sơ đồ phòng", icon: House, path: "/rooms" },
    { label: "Khách thuê", icon: UsersRound, path: "/tenants" },
    { label: "Hợp đồng", icon: FileText },
  ]},
  { title: "VẬN HÀNH", items: [
    { label: "Điện & nước", icon: Zap },
    { label: "Hóa đơn & thu tiền", icon: CreditCard, badge: "3" },
    { label: "Bảo trì", icon: Wrench },
  ]},
  { title: "PHÂN TÍCH", items: [
    { label: "Lời / Lỗ", icon: ChartNoAxesCombined },
    { label: "Báo cáo", icon: ChartColumnIncreasing },
  ]},
];

export default function Sidebar({ open, onClose, activePage, onSelectPage }) {
  const navigate = useNavigate();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  const showAccountInfo = async () => {
    setAccountMenuOpen(false);
    setProfileOpen(true);
    setProfileLoading(true);
    setProfileError("");
    try {
      setProfile(await getCurrentUser());
    } catch (error) {
      setProfileError(error.response?.data?.message || "Không tải được thông tin tài khoản.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Đã đăng xuất thành công.");
    navigate("/login", { replace: true });
  };

  const accountName = profile?.fullName || profile?.username || "Tài khoản";
  const avatarText = accountName.split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase();

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Đóng thanh điều hướng"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-[#242443]/35 backdrop-blur-[2px] lg:hidden"
        />
      )}
      <aside
        aria-label="Điều hướng chính"
        className={`fixed inset-y-0 left-0 z-50 flex w-[252px] flex-col border-r border-[#e9eaf2] bg-white shadow-[5px_0_25px_rgba(33,37,80,0.015)] transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex min-h-[93px] items-center pt-2">
          <img src={logo} alt="" className="w-[66px] shrink-0 object-contain" />
          <div className="min-w-0 leading-tight">
            <div className="text-[30px] font-extrabold tracking-[-0.7px] text-[#252941]">TROEASY</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng menu" className="ml-auto rounded-lg p-1.5 text-[#777b90] hover:bg-[#f5f4fb] lg:hidden">
            <X size={19} />
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-[13px] pb-4">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-[13px] text-[10px] font-extrabold tracking-[1.6px] text-[#a8acbb]">{group.title}</p>
              <div className="space-y-0.5">
                {group.items.map(({ label, icon: Icon, badge, path }) => {
                  const selected = activePage === label;
                  return (
                    <button
                      type="button"
                      key={label}
                      onClick={() => {
                        onSelectPage(label);
                        navigate(path || "/");
                      }}
                      aria-current={selected ? "page" : undefined}
                      className={`relative flex w-full items-center gap-3 rounded-[11px] px-[13px] py-[11px] text-left text-[12.9px] font-semibold transition-colors ${selected ? "bg-[#efecff] text-[#5e4bd5]" : "text-[#797e95] hover:bg-[#f5f4fb] hover:text-[#5140bf]"}`}
                    >
                      {selected && <span className="absolute inset-y-[10px] left-0 w-[3px] rounded-r bg-[#7060e9]" />}
                      <Icon size={19} strokeWidth={1.8} className="shrink-0" />
                      <span className="flex-1 whitespace-nowrap">{label}</span>
                      {badge && <span className="rounded-[7px] bg-[#ffedf0] px-[7px] py-[2px] text-[10px] font-extrabold text-[#e06470]">{badge}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-[13px] pb-3 pt-3">
          <div className="relative flex items-center gap-2.5 border-t border-[#f1f1f6] px-2 pt-3.5">
            <span className="grid h-[35px] w-[35px] shrink-0 place-items-center rounded-xl bg-[#e3ddff] text-[11px] font-extrabold text-[#5b49cb]">{avatarText || "U"}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-bold text-[#2d3149]">{accountName}</p>
              <p className="truncate text-[10.5px] text-[#989aab]">{profile?.username ? `@${profile.username}` : "Tài khoản đang đăng nhập"}</p>
            </div>
            <button
              type="button"
              aria-label="Mở menu tài khoản"
              aria-haspopup="menu"
              aria-expanded={accountMenuOpen}
              onClick={() => setAccountMenuOpen((current) => !current)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#a2a3b3] hover:bg-[#f5f4fb] hover:text-[#5b49cb]"
            >
              <MoreHorizontal size={18} />
            </button>
            {accountMenuOpen && (
              <div role="menu" className="absolute bottom-[52px] right-0 z-[60] w-52 rounded-xl border border-[#ececf3] bg-white p-1.5 shadow-xl">
                <button type="button" role="menuitem" onClick={showAccountInfo} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-[#3a3e55] hover:bg-[#f5f4fb]">
                  <UserRound size={17} className="text-[#777b90]" />
                  Thông tin tài khoản
                </button>
                <button type="button" role="menuitem" onClick={handleLogout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50">
                  <LogOut size={17} />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {profileOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button type="button" aria-label="Đóng thông tin tài khoản" onClick={() => setProfileOpen(false)} className="absolute inset-0 bg-[#242443]/40 backdrop-blur-[2px]" />
          <section role="dialog" aria-modal="true" aria-labelledby="account-dialog-title" className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 id="account-dialog-title" className="text-lg font-bold text-[#252941]">Thông tin tài khoản</h2>
              <button type="button" aria-label="Đóng" onClick={() => setProfileOpen(false)} className="rounded-lg p-1.5 text-[#777b90] hover:bg-[#f5f4fb]">
                <X size={18} />
              </button>
            </div>
            {profileLoading ? (
              <p className="text-sm text-slate-500">Đang tải thông tin...</p>
            ) : profileError ? (
              <p role="alert" className="text-sm text-rose-600">{profileError}</p>
            ) : profile ? (
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-slate-500">Họ tên</dt>
                  <dd className="mt-1 font-semibold text-[#252941]">{profile.fullName || "Chưa cập nhật"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Tên đăng nhập</dt>
                  <dd className="mt-1 font-semibold text-[#252941]">{profile.username}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-slate-500">Không có thông tin tài khoản.</p>
            )}
          </section>
        </div>
      )}
    </>
  );
}
