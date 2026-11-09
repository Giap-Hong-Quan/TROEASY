import { apiClient } from "./apiclient.js";

export const getRooms = async (params) => {
    const response = await apiClient.get("/rooms", { params });
    return response?.data?.rooms ?? [];
};

export const getRoomById = async (id) => {
    const response = await apiClient.get(`/rooms/${id}`);
    return response?.data?.room;
};

export const createRoom = async (roomData) => {
    const response = await apiClient.post("/rooms", roomData);
    return response?.data?.room;
};

export const updateRoom = async (id, roomData) => {
    const response = await apiClient.patch(`/rooms/${id}`, roomData);
    return response?.data?.room;
};

export const deleteRoom = async (id) => {
    const response = await apiClient.delete(`/rooms/${id}`);
    return response?.data?.room;
};

