import {
    createRoom as createRoomService,
    deleteRoomAndTenants,
    getRoomById,
    getRoomOccupancyStats,
    listRooms,
    updateRoom as updateRoomService,
} from "../services/roomService.js";
import { success } from "../utils/success.js";

export const createRoomController = async (req, res, next) => {
    try {
        const room = await createRoomService(req.body);
        return success(res, { room }, "Tạo phòng thành công.", 201);
    } catch (error) {
        return next(error);
    }
};

export const getRooms = async (req, res, next) => {
    try {
        const rooms = await listRooms(req.query);
        return success(res, { rooms }, "Lấy danh sách phòng thành công.", 200);
    } catch (error) {
        return next(error);
    }
};

export const getRoom = async (req, res, next) => {
    try {
        const room = await getRoomById(req.params.id);
        return success(res, { room }, "Lấy thông tin phòng thành công.", 200);
    } catch (error) {
        return next(error);
    }
};

export const updateRoomController = async (req, res, next) => {
    try {
        const room = await updateRoomService(req.params.id, req.body);
        return success(res, { room }, "Cập nhật phòng thành công.", 200);
    } catch (error) {
        return next(error);
    }
};

export const deleteRoom = async (req, res, next) => {
    try {
        const result = await deleteRoomAndTenants(req.params.id);
        return success(res, result, "Đã xóa phòng thành công.", 200);
    } catch (error) {
        return next(error);
    }
};

export const getOccupancyStats = async (req, res, next) => {
    try {
        const stats = await getRoomOccupancyStats(req.query);
        return success(res, { stats }, "Lấy thống kê tỷ lệ lấp đầy phòng thành công.", 200);
    } catch (error) {
        return next(error);
    }
};

