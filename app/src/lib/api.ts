import * as SecureStore from 'expo-secure-store';

import { getApiUrl } from './config';

const TOKEN_KEY = 'troeasy_access_token';
const TIMEOUT_MS = 15000;

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}

export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

export async function loadStoredToken() {
  try {
    token = await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    token = null;
  }
  return token;
}

export async function saveToken(value: string | null) {
  token = value;
  try {
    if (value) await SecureStore.setItemAsync(TOKEN_KEY, value);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // bỏ qua lỗi lưu trữ, token vẫn còn trong bộ nhớ
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
type Options = { params?: Record<string, any>; body?: any };

const buildQuery = (params?: Record<string, any>) => {
  if (!params) return '';
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
};

/** Gọi API, trả về phần `data` trong response `{ success, message, data }`. */
export async function request<T = any>(method: Method, path: string, options: Options = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const url = `${getApiUrl()}${path}${buildQuery(options.params)}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    let json: any = null;
    try {
      json = await response.json();
    } catch {
      json = null;
    }

    if (!response.ok) {
      if (response.status === 401 && token) {
        onUnauthorized?.();
      }
      throw new ApiError(json?.message || `Yêu cầu thất bại (${response.status}).`, response.status);
    }

    return (json?.data ?? json) as T;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    if (error?.name === 'AbortError') {
      throw new ApiError('Kết nối máy chủ quá thời gian. Kiểm tra mạng và địa chỉ API.');
    }
    throw new ApiError(`Không kết nối được máy chủ (${getApiUrl()}). Hãy chắc chắn backend đang chạy và điện thoại cùng Wi-Fi với máy tính.`);
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  get: <T = any>(path: string, params?: Record<string, any>) => request<T>('GET', path, { params }),
  post: <T = any>(path: string, body?: any) => request<T>('POST', path, { body }),
  patch: <T = any>(path: string, body?: any) => request<T>('PATCH', path, { body }),
  put: <T = any>(path: string, body?: any) => request<T>('PUT', path, { body }),
  delete: <T = any>(path: string) => request<T>('DELETE', path),
};

export const errorMessage = (error: any, fallback = 'Đã có lỗi xảy ra.') =>
  error?.message || fallback;

