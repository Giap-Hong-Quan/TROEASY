import Constants from 'expo-constants';

const API_PORT = 9000;

export const DELETE_PASSWORD = process.env.EXPO_PUBLIC_DELETE_PASSWORD || '1111';

/**
 * Địa chỉ API backend.
 * - Ưu tiên biến môi trường EXPO_PUBLIC_API_URL (vd: http://192.168.1.10:9000/api)
 * - Nếu không có: tự lấy IP máy đang chạy `expo start` (cùng Wi-Fi với điện thoại) + cổng 9000.
 */
export function getApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];
  return `http://${host || 'localhost'}:${API_PORT}/api`;
}

