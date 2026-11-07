import { apiClient } from "./apiclient.js";

export const login = async ({ username, password }) => {
    const response = await apiClient.post("/auth/login", { username, password });
    const authData = response?.data;

    if (!authData?.accessToken) {
        throw new Error("API không trả về access token.");
    }

    localStorage.setItem("accessToken", authData.accessToken);
    return authData;
};

export const getCurrentUser = async () => {
    const response = await apiClient.get("/auth/me");
    return response?.data?.user;
};

export const logout = () => {
    localStorage.removeItem("accessToken");
};
