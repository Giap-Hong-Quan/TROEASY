import {
    bulkGenerateInvoices,
    deleteInvoice as deleteInvoiceService,
    getInvoiceSheet as getInvoiceSheetService,
    listInvoices,
    recordInvoicePayment,
    upsertSingleInvoice,
} from "../services/invoiceService.js";
import { success } from "../utils/success.js";

export const getInvoicesController = async (req, res, next) => {
    try {
        const data = await listInvoices(req.query);
        return success(
            res,
            data,
            "Lấy danh sách hóa đơn thành công.",
            200,
        );
    } catch (error) {
        return next(error);
    }
};

export const getInvoiceSheetController = async (req, res, next) => {
    try {
        const sheet = await getInvoiceSheetService(req.query);
        return success(
            res,
            sheet,
            "Lấy bảng dự thảo hóa đơn theo kỳ thành công.",
            200,
        );
    } catch (error) {
        return next(error);
    }
};

export const upsertInvoiceController = async (req, res, next) => {
    try {
        const invoice = await upsertSingleInvoice(req.body);
        return success(
            res,
            { invoice },
            "Đã lưu hóa đơn thành công.",
            200,
        );
    } catch (error) {
        return next(error);
    }
};

export const bulkGenerateInvoicesController = async (req, res, next) => {
    try {
        const invoices = await bulkGenerateInvoices(req.body);
        return success(
            res,
            { invoices, savedCount: invoices.length },
            `Đã lập hóa đơn cho ${invoices.length} phòng.`,
            200,
        );
    } catch (error) {
        return next(error);
    }
};

export const payInvoiceController = async (req, res, next) => {
    try {
        const invoice = await recordInvoicePayment(req.params.id, req.body);
        return success(
            res,
            { invoice },
            "Đã cập nhật thu tiền hóa đơn.",
            200,
        );
    } catch (error) {
        return next(error);
    }
};

export const deleteInvoiceController = async (req, res, next) => {
    try {
        const invoice = await deleteInvoiceService(req.params.id);
        return success(res, { invoice }, "Đã xóa hóa đơn.", 200);
    } catch (error) {
        return next(error);
    }
};

