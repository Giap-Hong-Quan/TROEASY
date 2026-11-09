import { apiClient } from "./apiclient.js";

export const getAreas = async () => {
    const response = await apiClient.get("/areas");
    return response?.data?.areas ?? [];
};

export const getAreaById = async (id) => {
    const response = await apiClient.get(`/areas/${id}`);
    return response?.data?.area;
};

export const createArea = async (areaData) => {
    const response = await apiClient.post("/areas", areaData);
    return response?.data?.area;
};

export const updateArea = async (id, areaData) => {
    const response = await apiClient.patch(`/areas/${id}`, areaData);
    return response?.data?.area;
};

export const deleteArea = async (id) => {
    const response = await apiClient.delete(`/areas/${id}`);
    return response?.data?.area;
};

