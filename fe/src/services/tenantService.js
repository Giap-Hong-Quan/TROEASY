import { apiClient } from "./apiclient.js";

export const getTenants = async (params) => {
    const response = await apiClient.get("/tenants", { params });
    return response?.data?.tenants ?? [];
};

export const getTenantById = async (id) => {
    const response = await apiClient.get(`/tenants/${id}`);
    return response?.data?.tenant;
};

export const createTenant = async (tenantData) => {
    const response = await apiClient.post("/tenants", tenantData);
    return response?.data?.tenant;
};

export const updateTenant = async (id, tenantData) => {
    const response = await apiClient.put(`/tenants/${id}`, tenantData);
    return response?.data?.tenant;
};

export const deleteTenant = async (id) => {
    const response = await apiClient.delete(`/tenants/${id}`);
    return response?.data?.tenant;
};

