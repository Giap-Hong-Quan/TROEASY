import { apiClient } from "./apiclient.js";

export const getRows = async (params) => {
    const response = await apiClient.get("/rows", { params });
    return response?.data?.rows ?? [];
};

export const getRowById = async (id) => {
    const response = await apiClient.get(`/rows/${id}`);
    return response?.data?.row;
};

export const createRow = async (rowData) => {
    const response = await apiClient.post("/rows", rowData);
    return response?.data?.row;
};

export const updateRow = async (id, rowData) => {
    const response = await apiClient.patch(`/rows/${id}`, rowData);
    return response?.data?.row;
};

export const deleteRow = async (id) => {
    const response = await apiClient.delete(`/rows/${id}`);
    return response?.data?.row;
};

