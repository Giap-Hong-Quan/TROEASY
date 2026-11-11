import { apiClient } from "./apiclient.js";

export const getInvoices = async (params) => {
    const response = await apiClient.get("/invoices", { params });
    return (
        response?.data ?? {
            invoices: [],
            summary: {
                totalCount: 0,
                paidCount: 0,
                partialCount: 0,
                unpaidCount: 0,
                totalAmount: 0,
                paidAmount: 0,
                remainingAmount: 0,
            },
        }
    );
};

export const getInvoiceSheet = async (params) => {
    const response = await apiClient.get("/invoices/sheet", { params });
    return (
        response?.data ?? {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            items: [],
        }
    );
};

export const saveInvoice = async (payload) => {
    const response = await apiClient.post("/invoices", payload);
    return response?.data?.invoice;
};

export const bulkGenerateInvoices = async (payload) => {
    const response = await apiClient.post("/invoices/generate", payload);
    return response?.data;
};

export const payInvoice = async ({ id, ...payload }) => {
    const response = await apiClient.patch(`/invoices/${id}/pay`, payload);
    return response?.data?.invoice;
};

export const deleteInvoice = async (id) => {
    const response = await apiClient.delete(`/invoices/${id}`);
    return response?.data?.invoice;
};

