import { apiClient } from "./apiclient.js";

export const getContracts = async (params) => {
    const response = await apiClient.get("/contracts", { params });
    return response?.data?.contracts ?? [];
};

export const getContractById = async (id) => {
    const response = await apiClient.get(`/contracts/${id}`);
    return response?.data?.contract;
};

export const createContract = async (contractData) => {
    const response = await apiClient.post("/contracts", contractData);
    return response?.data?.contract;
};

export const updateContract = async (id, contractData) => {
    const response = await apiClient.patch(`/contracts/${id}`, contractData);
    return response?.data?.contract;
};

export const deleteContract = async (id) => {
    const response = await apiClient.delete(`/contracts/${id}`);
    return response?.data?.contract;
};

