import { apiClient } from "./apiclient.js";

export const getExpenses = async (params) => {
    const response = await apiClient.get("/expenses", { params });
    return response?.data?.expenses ?? [];
};

export const getExpenseById = async (id) => {
    const response = await apiClient.get(`/expenses/${id}`);
    return response?.data?.expense;
};

export const createExpense = async (expenseData) => {
    const response = await apiClient.post("/expenses", expenseData);
    return response?.data?.expense;
};

export const updateExpense = async (id, expenseData) => {
    const response = await apiClient.patch(`/expenses/${id}`, expenseData);
    return response?.data?.expense;
};

export const deleteExpense = async (id) => {
    const response = await apiClient.delete(`/expenses/${id}`);
    return response?.data?.expense;
};

