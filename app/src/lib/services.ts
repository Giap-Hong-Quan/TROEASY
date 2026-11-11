import { api } from './api';

/* ---------- Auth ---------- */
export const loginRequest = async (username: string, password: string) => {
  const data = await api.post('/auth/login', { username, password });
  if (!data?.accessToken) throw new Error('API không trả về access token.');
  return data as { accessToken: string; user?: any };
};
export const getCurrentUser = async () => (await api.get('/auth/me'))?.user;

/* ---------- Areas / Rows ---------- */
export const getAreas = async () => (await api.get('/areas'))?.areas ?? [];
export const createArea = async (body: { name: string; address: string }) =>
  (await api.post('/areas', body))?.area;
export const deleteArea = async (id: string) => (await api.delete(`/areas/${id}`))?.area;

export const getRows = async (params?: { areaId?: string }) => (await api.get('/rows', params))?.rows ?? [];
export const createRow = async (body: { areaId: string; name: string }) => (await api.post('/rows', body))?.row;
export const deleteRow = async (id: string) => (await api.delete(`/rows/${id}`))?.row;

/* ---------- Rooms ---------- */
export const getRooms = async (params?: Record<string, any>) => (await api.get('/rooms', params))?.rooms ?? [];
export const createRoom = async (body: any) => (await api.post('/rooms', body))?.room;
export const updateRoom = async (id: string, body: any) => (await api.patch(`/rooms/${id}`, body))?.room;
export const deleteRoom = async (id: string) => (await api.delete(`/rooms/${id}`))?.room;
export const getRoomOccupancyStats = async (params?: Record<string, any>) =>
  (await api.get('/rooms/stats/occupancy', params))?.stats;

/* ---------- Tenants ---------- */
export const getTenants = async (params?: Record<string, any>) => (await api.get('/tenants', params))?.tenants ?? [];
export const createTenant = async (body: any) => (await api.post('/tenants', body))?.tenant;
export const updateTenant = async (id: string, body: any) => (await api.put(`/tenants/${id}`, body))?.tenant;
export const deleteTenant = async (id: string) => (await api.delete(`/tenants/${id}`))?.tenant;

/* ---------- Contracts ---------- */
export const getContracts = async (params?: Record<string, any>) => (await api.get('/contracts', params))?.contracts ?? [];
export const createContract = async (body: any) => (await api.post('/contracts', body))?.contract;
export const updateContract = async (id: string, body: any) => (await api.patch(`/contracts/${id}`, body))?.contract;
export const deleteContract = async (id: string) => (await api.delete(`/contracts/${id}`))?.contract;

/* ---------- Expenses ---------- */
export const getExpenses = async (params?: Record<string, any>) => (await api.get('/expenses', params))?.expenses ?? [];
export const createExpense = async (body: { areaId: string; name: string; amount: number }) =>
  (await api.post('/expenses', body))?.expense;
export const updateExpense = async (id: string, body: { name?: string; amount?: number }) =>
  (await api.patch(`/expenses/${id}`, body))?.expense;
export const deleteExpense = async (id: string) => (await api.delete(`/expenses/${id}`))?.expense;

/* ---------- Utilities (điện nước) ---------- */
export const getUtilitySheet = async (params?: Record<string, any>) =>
  (await api.get('/utilities/sheet', params)) ?? { items: [] };
export const saveUtilityReading = async (body: any) => (await api.post('/utilities', body))?.reading;
export const bulkSaveUtilityReadings = async (body: any) => await api.post('/utilities/bulk', body);
export const deleteUtilityReading = async (id: string) => (await api.delete(`/utilities/${id}`))?.reading;

/* ---------- Invoices ---------- */
export const getInvoices = async (params?: Record<string, any>) =>
  (await api.get('/invoices', params)) ?? { invoices: [], summary: {} };
export const getInvoiceSheet = async (params?: Record<string, any>) =>
  (await api.get('/invoices/sheet', params)) ?? { items: [] };
export const saveInvoice = async (body: any) => (await api.post('/invoices', body))?.invoice;
export const bulkGenerateInvoices = async (body: any) => await api.post('/invoices/generate', body);
export const payInvoice = async (id: string, body: any) => (await api.patch(`/invoices/${id}/pay`, body))?.invoice;
export const deleteInvoice = async (id: string) => (await api.delete(`/invoices/${id}`))?.invoice;

/* ---------- Maintenance ---------- */
export const getMaintenances = async (params?: Record<string, any>) =>
  (await api.get('/maintenances', params)) ?? { tickets: [], summary: {} };
export const createMaintenance = async (body: any) => (await api.post('/maintenances', body))?.ticket;
export const updateMaintenance = async (id: string, body: any) => (await api.patch(`/maintenances/${id}`, body))?.ticket;
export const deleteMaintenance = async (id: string) => (await api.delete(`/maintenances/${id}`))?.ticket;

