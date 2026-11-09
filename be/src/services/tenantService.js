import ApiError from "../exceptions/ApiError.js";
import Area from "../models/Area.js";
import Room from "../models/Room.js";
import Tenant from "../models/Tenant.js";

/**
 * Lấy danh sách khách thuê có hỗ trợ lọc theo areaId, roomId, status, hoặc tìm kiếm (tên, SĐT, CCCD)
 */
export const listTenants = async (query = {}) => {
    const filter = {};

    if (query.areaId) {
        filter.areaId = query.areaId;
    }
    if (query.roomId) {
        filter.roomId = query.roomId;
    }
    if (query.status) {
        filter.status = query.status;
    }
    if (query.search) {
        const regex = new RegExp(query.search.trim(), "i");
        filter.$or = [
            { fullName: regex },
            { phone: regex },
            { citizenId: regex },
        ];
    }

    const tenants = await Tenant.find(filter)
        .populate("roomId", "code status basePrice row")
        .populate("areaId", "name address")
        .sort({ createdAt: -1 });

    return tenants;
};

/**
 * Lấy chi tiết 1 khách thuê theo ID
 */
export const getTenantById = async (id) => {
    const tenant = await Tenant.findById(id)
        .populate("roomId", "code status basePrice row")
        .populate("areaId", "name address");

    if (!tenant) {
        throw new ApiError(404, "Không tìm thấy thông tin khách thuê.");
    }
    return tenant;
};

/**
 * Tạo mới 1 khách thuê
 * - Kiểm tra khu vực tồn tại
 * - Nếu có gán vào phòng (roomId): kiểm tra phòng và tự động cập nhật trạng thái phòng sang 'renting' nếu phòng đang 'vacant'
 */
export const createTenant = async (data) => {
    const area = await Area.findById(data.areaId);
    if (!area) {
        throw new ApiError(404, "Khu vực không tồn tại.");
    }

    if (data.roomId) {
        const room = await Room.findById(data.roomId);
        if (!room) {
            throw new ApiError(404, "Phòng không tồn tại.");
        }
        if (room.areaId.toString() !== data.areaId.toString()) {
            throw new ApiError(400, "Phòng được chọn không thuộc khu vực này.");
        }

        // Nếu phòng đang trống và khách vào ở (active) -> đổi trạng thái phòng sang 'renting'
        if (room.status === "vacant" && (!data.status || data.status === "active")) {
            room.status = "renting";
            await room.save();
        }
    }

    const tenant = await Tenant.create(data);
    return await getTenantById(tenant._id);
};

/**
 * Cập nhật thông tin khách thuê
 */
export const updateTenant = async (id, data) => {
    const tenant = await Tenant.findById(id);
    if (!tenant) {
        throw new ApiError(404, "Không tìm thấy thông tin khách thuê.");
    }

    if (data.areaId) {
        const area = await Area.findById(data.areaId);
        if (!area) {
            throw new ApiError(404, "Khu vực không tồn tại.");
        }
    }

    if (data.roomId) {
        const room = await Room.findById(data.roomId);
        if (!room) {
            throw new ApiError(404, "Phòng không tồn tại.");
        }
    }

    Object.assign(tenant, data);
    await tenant.save();

    return await getTenantById(tenant._id);
};

/**
 * Xóa khách thuê
 */
export const deleteTenant = async (id) => {
    const tenant = await Tenant.findByIdAndDelete(id);
    if (!tenant) {
        throw new ApiError(404, "Không tìm thấy thông tin khách thuê để xóa.");
    }
    return tenant;
};
