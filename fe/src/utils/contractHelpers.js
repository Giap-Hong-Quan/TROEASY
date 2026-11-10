// Cấu hình & hàm tiện ích dùng chung cho các màn hình Hợp đồng.
// Tách ra file .js riêng để các file .jsx chỉ export component (giữ Fast Refresh hoạt động).

export const CONTRACT_STATUS = {
  draft: {
    label: "Nháp",
    badgeClass: "bg-[#efedff] text-[#6b59da] border-[#dad3fd]",
    dotClass: "bg-[#6b59da]",
  },
  active: {
    label: "Đang hiệu lực",
    badgeClass: "bg-[#e3f8f0] text-[#159878] border-[#a8edd8]",
    dotClass: "bg-[#159878]",
  },
  expired: {
    label: "Hết hạn",
    badgeClass: "bg-[#fff2de] text-[#bf8a37] border-[#fae0b8]",
    dotClass: "bg-[#bf8a37]",
  },
  terminated: {
    label: "Đã thanh lý",
    badgeClass: "bg-[#edf0f4] text-[#8d95a1] border-[#d8dce2]",
    dotClass: "bg-[#8d95a1]",
  },
};

export const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || "";
};

export const formatMoney = (value) => {
  if (value === undefined || value === null || value === "") return "—";
  return `${Number(value).toLocaleString("vi-VN")} đ`;
};

export const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export const toInputDate = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

export const addMonths = (dateStr, months) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  date.setMonth(date.getMonth() + Number(months || 0));
  return toInputDate(date);
};

// Số ngày còn lại tới ngày hết hạn (âm nếu đã quá hạn)
export const daysUntil = (value) => {
  if (!value) return null;
  const end = new Date(value);
  if (Number.isNaN(end.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.round((end - today) / 86400000);
};

