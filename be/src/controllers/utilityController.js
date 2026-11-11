import {
    bulkUpsertReadings,
    deleteUtilityReading as deleteUtilityReadingService,
    getUtilitySheet as getUtilitySheetService,
    listUtilityReadings,
    upsertSingleReading,
} from "../services/utilityService.js";
import { success } from "../utils/success.js";

export const getUtilitySheetController = async (req, res, next) => {
    try {
        const sheet = await getUtilitySheetService(req.query);
        return success(
            res,
            sheet,
            "Lấy bảng chỉ số điện nước theo kỳ thành công.",
            200,
        );
    } catch (error) {
        return next(error);
    }
};

export const getUtilityReadingsController = async (req, res, next) => {
    try {
        const readings = await listUtilityReadings(req.query);
        return success(
            res,
            { readings },
            "Lấy danh sách chỉ số điện nước thành công.",
            200,
        );
    } catch (error) {
        return next(error);
    }
};

export const upsertUtilityReadingController = async (req, res, next) => {
    try {
        const reading = await upsertSingleReading(req.body);
        return success(
            res,
            { reading },
            "Đã lưu chỉ số điện nước thành công.",
            200,
        );
    } catch (error) {
        return next(error);
    }
};

export const bulkUpsertUtilityReadingsController = async (req, res, next) => {
    try {
        const readings = await bulkUpsertReadings(req.body);
        return success(
            res,
            { readings, savedCount: readings.length },
            `Đã lưu chỉ số điện nước cho ${readings.length} phòng.`,
            200,
        );
    } catch (error) {
        return next(error);
    }
};

export const deleteUtilityReadingController = async (req, res, next) => {
    try {
        const reading = await deleteUtilityReadingService(req.params.id);
        return success(res, { reading }, "Đã xóa bản ghi điện nước.", 200);
    } catch (error) {
        return next(error);
    }
};

