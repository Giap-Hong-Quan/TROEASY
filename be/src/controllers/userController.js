import {
    createUser as createUserService,
    deactivateUser,
    getUserById,
    listUsers,
    updateUser as updateUserService,
} from "../services/userService.js";
import { success } from "../utils/success.js";

export const createUser = async (req, res, next) => {
    try {
        const user = await createUserService(req.body);
        return success(res, { user }, "Tạo user thành công.", 201);
    } catch (error) {
        return next(error);
    }
};

export const getUsers = async (_req, res, next) => {
    try {
        return success(res, { users: await listUsers() }, "Lấy danh sách user thành công.", 200);
    } catch (error) {
        return next(error);
    }
};

export const getUser = async (req, res, next) => {
    try {
        return success(res, { user: await getUserById(req.params.id) }, "Lấy user thành công.", 200);
    } catch (error) {
        return next(error);
    }
};

export const updateUser = async (req, res, next) => {
    try {
        const user = await updateUserService(req.params.id, req.body);
        return success(res, { user }, "Cập nhật user thành công.", 200);
    } catch (error) {
        return next(error);
    }
};

export const deleteUser = async (req, res, next) => {
    try {
        const user = await deactivateUser(req.params.id);
        return success(res, { user }, "Đã ngừng hoạt động user.", 200);
    } catch (error) {
        return next(error);
    }
};
