import {
    createExpense as createExpenseService,
    deleteExpense as deleteExpenseService,
    getExpenseById,
    listExpenses,
    updateExpense as updateExpenseService,
} from "../services/expenseService.js";
import { success } from "../utils/success.js";

export const createExpenseController = async (req, res, next) => {
    try {
        const expense = await createExpenseService(req.body);
        return success(res, { expense }, "Tạo khoản chi thành công.", 201);
    } catch (error) {
        return next(error);
    }
};

export const getExpenses = async (req, res, next) => {
    try {
        const expenses = await listExpenses(req.query);
        return success(res, { expenses }, "Lấy danh sách khoản chi thành công.", 200);
    } catch (error) {
        return next(error);
    }
};

export const getExpense = async (req, res, next) => {
    try {
        const expense = await getExpenseById(req.params.id);
        return success(res, { expense }, "Lấy thông tin khoản chi thành công.", 200);
    } catch (error) {
        return next(error);
    }
};

export const updateExpenseController = async (req, res, next) => {
    try {
        const expense = await updateExpenseService(req.params.id, req.body);
        return success(res, { expense }, "Cập nhật khoản chi thành công.", 200);
    } catch (error) {
        return next(error);
    }
};

export const deleteExpenseController = async (req, res, next) => {
    try {
        const expense = await deleteExpenseService(req.params.id);
        return success(res, { expense }, "Đã xóa khoản chi.", 200);
    } catch (error) {
        return next(error);
    }
};

