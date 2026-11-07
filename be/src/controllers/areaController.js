import {
    createArea as createAreaService,
    deactivateArea,
    getAreaById,
    listAreas,
    updateArea as updateAreaService,
} from "../services/areaService.js";
import { success } from "../utils/success.js";

export const createAreaController = async (req, res, next) => {
    try {
        const area = await createAreaService(req.body);
        return success(res, { area }, "Tạo khu vực thành công.", 201);
    } catch (error) {
        return next(error);
    }
};

export const getAreas = async (_req, res, next) => {
    try {
        return success(res, { areas: await listAreas() }, "Lấy danh sách khu vực thành công.", 200);
    } catch (error) {
        return next(error);
    }
};

export const getArea = async (req, res, next) => {
    try {
        return success(res, { area: await getAreaById(req.params.id) }, "Lấy khu vực thành công.", 200);
    } catch (error) {
        return next(error);
    }
};

export const updateAreaController = async (req, res, next) => {
    try {
        const area = await updateAreaService(req.params.id, req.body);
        return success(res, { area }, "Cập nhật khu vực thành công.", 200);
    } catch (error) {
        return next(error);
    }
};

export const deleteArea = async (req, res, next) => {
    try {
        const area = await deactivateArea(req.params.id);
        return success(res, { area }, "Đã ngừng hoạt động khu vực.", 200);
    } catch (error) {
        return next(error);
    }
};
