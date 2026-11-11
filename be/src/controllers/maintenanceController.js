import {
    createMaintenanceTicket,
    deleteMaintenanceTicket,
    listMaintenanceTickets,
    updateMaintenanceTicket,
} from "../services/maintenanceService.js";
import { success } from "../utils/success.js";

export const getMaintenancesController = async (req, res, next) => {
    try {
        const data = await listMaintenanceTickets(req.query);
        return success(
            res,
            data,
            "Lấy danh sách phiếu bảo trì thành công.",
            200,
        );
    } catch (error) {
        return next(error);
    }
};

export const createMaintenanceController = async (req, res, next) => {
    try {
        const ticket = await createMaintenanceTicket(req.body);
        return success(
            res,
            { ticket },
            "Đã tạo phiếu bảo trì thành công.",
            201,
        );
    } catch (error) {
        return next(error);
    }
};

export const updateMaintenanceController = async (req, res, next) => {
    try {
        const ticket = await updateMaintenanceTicket(req.params.id, req.body);
        return success(
            res,
            { ticket },
            "Đã cập nhật phiếu bảo trì.",
            200,
        );
    } catch (error) {
        return next(error);
    }
};

export const deleteMaintenanceController = async (req, res, next) => {
    try {
        const ticket = await deleteMaintenanceTicket(req.params.id);
        return success(res, { ticket }, "Đã xóa phiếu bảo trì.", 200);
    } catch (error) {
        return next(error);
    }
};

