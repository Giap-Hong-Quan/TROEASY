import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

// Map đường dẫn -> tên menu để Sidebar/Header luôn đúng kể cả khi reload trang.
const PAGE_BY_PATH = {
  "/": "Tổng quan",
  "/rooms": "Sơ đồ phòng",
  "/tenants": "Khách thuê",
};

// Layout chung cho các trang cần đăng nhập.
export default function Index() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const activePage = PAGE_BY_PATH[pathname] || "Tổng quan";

  const selectPage = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] font-sans text-[#20243c]">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activePage={activePage}
        onSelectPage={selectPage}
      />
      <div className="min-h-screen lg:ml-[252px]">
        <Header pageTitle={activePage} onMenuClick={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-[1640px] px-1 py-2 sm:px-1 lg:px-1 lg:py-3">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
