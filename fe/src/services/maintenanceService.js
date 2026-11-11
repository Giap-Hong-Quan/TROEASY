import { apiClient } from "./apiclient.js";

export const getMaintenances = async (params) => {
  const response = await apiClient.get("/maintenances", { params });
  return (
    response?.data ?? {
      tickets: [],
      summary: {
        totalCount: 0,
        openCount: 0,
        inProgressCount: 0,
        resolvedCount: 0,
        cancelledCount: 0,
        urgentCount: 0,
        totalCost: 0,
      },
    }
  );
};

export const createMaintenance = async (payload) => {
  const response = await apiClient.post("/maintenances", payload);
  return response?.data?.ticket;
};

export const updateMaintenance = async ({ id, ...payload }) => {
  const response = await apiClient.patch(`/maintenances/${id}`, payload);
  return response?.data?.ticket;
};

export const deleteMaintenance = async (id) => {
  const response = await apiClient.delete(`/maintenances/${id}`);
  return response?.data?.ticket;
};

