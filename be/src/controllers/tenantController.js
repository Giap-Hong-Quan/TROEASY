import {
    createTenant as createTenantService,
    deleteTenant as deleteTenantService,
    getTenantById as getTenantByIdService,
    listTenants as listTenantsService,
    updateTenant as updateTenantService,
} from "../services/tenantService.js";
import { success } from "../utils/success.js";

export const getTenants = async (req, res, next) => {
    try {
        const tenants = await listTenantsService(req.query);
        return success(res, { tenants }, "Lấy danh sách khách thuê thành công.", 200);
    } catch (error) {
        return next(error);
    }
};

export const getTenant = async (req, res, next) => {
    try {
        const tenant = await getTenantByIdService(req.params.id);
        return success(res, { tenant }, "Lấy thông tin khách thuê thành công.", 200);
    } catch (error) {
        return next(error);
    }
};

export const createTenantController = async (req, res, next) => {
    try {
        const tenant = await createTenantService(req.body);
        return success(res, { tenant }, "Thêm khách thuê thành công.", 201);
    } catch (error) {
        return next(error);
    }
};

export const updateTenantController = async (req, res, next) => {
    try {
        const tenant = await updateTenantService(req.params.id, req.body);
        return success(res, { tenant }, "Cập nhật thông tin khách thuê thành công.", 200);
    } catch (error) {
        return next(error);
    }
};

export const deleteTenantController = async (req, res, next) => {
    try {
        const tenant = await deleteTenantService(req.params.id);
        return success(res, { tenant }, "Xóa khách thuê thành công.", 200);
    } catch (error) {
        return next(error);
    }
};

