import {
    createContract,
    deleteContract,
    getContractById,
    listContracts,
    updateContract,
} from "../services/contractService.js";
import { success } from "../utils/success.js";

export const getContracts = async (req, res, next) => {
    try {
        const contracts = await listContracts(req.query);
        return success(res, { contracts }, "Lấy danh sách hợp đồng thành công.", 200);
    } catch (error) {
        return next(error);
    }
};

export const getContract = async (req, res, next) => {
    try {
        const contract = await getContractById(req.params.id);
        return success(res, { contract }, "Lấy thông tin hợp đồng thành công.", 200);
    } catch (error) {
        return next(error);
    }
};

export const createContractController = async (req, res, next) => {
    try {
        const contract = await createContract(req.body);
        return success(res, { contract }, "Tạo hợp đồng thành công.", 201);
    } catch (error) {
        return next(error);
    }
};

export const updateContractController = async (req, res, next) => {
    try {
        const contract = await updateContract(req.params.id, req.body);
        return success(res, { contract }, "Cập nhật hợp đồng thành công.", 200);
    } catch (error) {
        return next(error);
    }
};

export const deleteContractController = async (req, res, next) => {
    try {
        const contract = await deleteContract(req.params.id);
        return success(res, { contract }, "Xóa hợp đồng thành công.", 200);
    } catch (error) {
        return next(error);
    }
};

