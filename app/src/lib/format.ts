import { colors } from './theme';

export const money = (value: any) => {
  const n = Number(value);
  if (value === undefined || value === null || value === '' || Number.isNaN(n)) return '—';
  return `${n.toLocaleString('vi-VN')} đ`;
};

export const moneyShort = (value: any) => {
  const n = Number(value) || 0;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}tr`;
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)}k`;
  return `${n}`;
};

export const formatDate = (value: any) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
};

/** Date -> "YYYY-MM-DD" để đưa vào ô nhập / gửi lên API. */
export const toInputDate = (value: any) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

export const isValidInputDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());

export const addMonths = (dateStr: string, months: number) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  d.setMonth(d.getMonth() + Number(months || 0));
  return toInputDate(d);
};

/** Số ngày còn lại tới ngày hết hạn (âm nếu đã quá hạn). */
export const daysUntil = (value: any): number | null => {
  if (!value) return null;
  const end = new Date(value);
  if (Number.isNaN(end.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / 86400000);
};

export const parseNumber = (value: string | number | undefined | null) => {
  if (value === undefined || value === null || value === '') return 0;
  const n = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isNaN(n) ? 0 : n;
};

export const getId = (item: any): string => String(item?.id || item?._id || '');

/** Lấy id từ trường tham chiếu: có thể là chuỗi id hoặc object đã populate. */
export const refId = (value: any): string => (typeof value === 'string' ? value : getId(value));

export const initials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts
    .slice(-2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
};

type Tone = { label: string; fg: string; bg: string };

export const ROOM_STATUS: Record<string, Tone> = {
  vacant: { label: 'Trống', fg: colors.danger, bg: colors.dangerBg },
  renting: { label: 'Đang thuê', fg: colors.success, bg: colors.successBg },
  deposit: { label: 'Đã cọc', fg: colors.primary, bg: colors.primarySoft },
  repair: { label: 'Đang sửa', fg: colors.warn, bg: colors.warnBg },
  stop: { label: 'Tạm ngưng', fg: colors.gray, bg: colors.grayBg },
};

export const TENANT_STATUS: Record<string, Tone> = {
  active: { label: 'Đang ở', fg: colors.success, bg: colors.successBg },
  checkout: { label: 'Đã trả phòng', fg: colors.gray, bg: colors.grayBg },
};

export const CONTRACT_STATUS: Record<string, Tone> = {
  draft: { label: 'Nháp', fg: colors.warn, bg: colors.warnBg },
  active: { label: 'Hiệu lực', fg: colors.success, bg: colors.successBg },
  expired: { label: 'Hết hạn', fg: colors.danger, bg: colors.dangerBg },
  terminated: { label: 'Đã thanh lý', fg: colors.gray, bg: colors.grayBg },
};

export const INVOICE_STATUS: Record<string, Tone> = {
  unbilled: { label: 'Chưa lập', fg: colors.gray, bg: colors.grayBg },
  unpaid: { label: 'Chưa thu', fg: colors.danger, bg: colors.dangerBg },
  partial: { label: 'Thu một phần', fg: colors.warn, bg: colors.warnBg },
  paid: { label: 'Đã thu', fg: colors.success, bg: colors.successBg },
};

export const MAINTENANCE_STATUS: Record<string, Tone> = {
  open: { label: 'Chờ xử lý', fg: colors.danger, bg: colors.dangerBg },
  in_progress: { label: 'Đang sửa', fg: colors.warn, bg: colors.warnBg },
  resolved: { label: 'Đã xong', fg: colors.success, bg: colors.successBg },
};

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Tiền mặt' },
  { value: 'transfer', label: 'Chuyển khoản' },
];

export const SUGGESTED_ASSETS = [
  'Điều hòa',
  'Bình nóng lạnh',
  'Tủ lạnh',
  'Gác lửng',
  'Kệ bếp',
  'Giường nệm',
  'Tủ quần áo',
  'Wifi',
];
