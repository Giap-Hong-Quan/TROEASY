import { apiClient } from "./apiclient.js";

export const getUtilitySheet = async (params) => {
    const response = await apiClient.get("/utilities/sheet", { params });
    return (
        response?.data ?? {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            items: [],
        }
    );
};

export const getUtilityReadings = async (params) => {
    const response = await apiClient.get("/utilities", { params });
    return response?.data?.readings ?? [];
};

export const saveUtilityReading = async (payload) => {
    const response = await apiClient.post("/utilities", payload);
    return response?.data?.reading;
};

export const bulkSaveUtilityReadings = async (payload) => {
    const response = await apiClient.post("/utilities/bulk", payload);
    return response?.data;
};

export const deleteUtilityReading = async (id) => {
    const response = await apiClient.delete(`/utilities/${id}`);
    return response?.data?.reading;
};

