import { apiClient } from "./apiclient.js";

export const getUsers = async () => {
    const response = await apiClient.get("/users");
    return response?.data?.users ?? [];
};

export const getUserById = async (id) => {
    const response = await apiClient.get(`/users/${id}`);
    return response?.data?.user;
};

export const createUser = async (userData) => {
    const response = await apiClient.post("/users", userData);
    return response?.data?.user;
};

export const updateUser = async (id, userData) => {
    const response = await apiClient.patch(`/users/${id}`, userData);
    return response?.data?.user;
};

export const deleteUser = async (id) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response?.data?.user;
};
