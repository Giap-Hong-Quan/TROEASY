import {
    createRow as createRowService,
    deleteRowAndRooms,
    getRowById,
    listRows,
    updateRow as updateRowService,
} from "../services/rowService.js";
import { success } from "../utils/success.js";

export const createRowController = async (req, res, next) => {
    try {
        const row = await createRowService(req.body);
        return success(res, { row }, "Tạo dãy phòng thành công.", 201);
    } catch (error) {
        return next(error);
    }
};

export const getRows = async (req, res, next) => {
    try {
        const rows = await listRows(req.query);
        return success(res, { rows }, "Lấy danh sách dãy phòng thành công.", 200);
    } catch (error) {
        return next(error);
    }
};

export const getRow = async (req, res, next) => {
    try {
        const row = await getRowById(req.params.id);
        return success(res, { row }, "Lấy thông tin dãy phòng thành công.", 200);
    } catch (error) {
        return next(error);
    }
};

export const updateRowController = async (req, res, next) => {
    try {
        const row = await updateRowService(req.params.id, req.body);
        return success(res, { row }, "Cập nhật dãy phòng thành công.", 200);
    } catch (error) {
        return next(error);
    }
};

export const deleteRow = async (req, res, next) => {
    try {
        const result = await deleteRowAndRooms(req.params.id);
        return success(res, result, "Đã xóa dãy và toàn bộ phòng thuộc dãy.", 200);
    } catch (error) {
        return next(error);
    }
};
