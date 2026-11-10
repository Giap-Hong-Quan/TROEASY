/**
 * Mật khẩu xác nhận các thao tác nguy hiểm (Xóa khu, xóa dãy phòng...).
 * Có thể cấu hình thay đổi linh hoạt qua biến môi trường VITE_DELETE_PASSWORD trong file .env
 */
export const DELETE_PASSWORD =
  import.meta.env.VITE_DELETE_PASSWORD || "1111";

