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
/**
 * Đảm bảo tối đa 1 người đại diện đang ở trong cùng 1 phòng
 */
const demoteOtherRepresentatives = async (roomId, excludeTenantId = null) => {
    if (!roomId) return;
    const filter = {
        roomId,
        status: { $ne: "checkout" },
        isRepresentative: true,
    };
    if (excludeTenantId) {
        filter._id = { $ne: excludeTenantId };
    }
    await Tenant.updateMany(filter, { $set: { isRepresentative: false } });
};

/**
 * Tạo mới khách thuê:
 * - Nếu có gán vào phòng (roomId): kiểm tra phòng và tự động cập nhật trạng thái phòng sang 'renting' nếu phòng đang 'vacant'
 * - Đảm bảo mỗi phòng chỉ có tối đa 1 người đại diện đang ở
 */
export const createTenant = async (data) => {
    const area = await Area.findById(data.areaId);
    if (!area) {
        throw new ApiError(404, "Khu vực không tồn tại.");
    }

    const payload = { ...data };
    if (payload.status === "checkout") {
        payload.isRepresentative = false;
    }

    if (payload.roomId) {
        const room = await Room.findById(payload.roomId);
        if (!room) {
            throw new ApiError(404, "Phòng không tồn tại.");
        }
        if (room.areaId.toString() !== payload.areaId.toString()) {
            throw new ApiError(400, "Phòng được chọn không thuộc khu vực này.");
        }

        // Nếu phòng đang trống và khách vào ở (active) -> đổi trạng thái phòng sang 'renting'
        if (room.status === "vacant" && (!payload.status || payload.status === "active")) {
            room.status = "renting";
            await room.save();
        }

        if (payload.status !== "checkout" && payload.isRepresentative !== false) {
            await demoteOtherRepresentatives(payload.roomId);
        }
    }

    const tenant = await Tenant.create(payload);
    return await getTenantById(tenant._id);
};

/**
 * Cập nhật thông tin khách thuê
 * Trả về thêm needsNewRepresentative + remainingActiveTenants nếu người đại diện vừa trả phòng mà phòng vẫn còn khách đang ở
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

    const prevStatus = tenant.status;
    const wasRepresentative = tenant.isRepresentative === true;
    const prevRoomId = tenant.roomId ? tenant.roomId.toString() : null;

    Object.assign(tenant, data);

    if (tenant.status === "checkout") {
        tenant.isRepresentative = false;
    } else if (tenant.roomId && tenant.isRepresentative === true) {
        await demoteOtherRepresentatives(tenant.roomId, tenant._id);
    }

    await tenant.save();

    const targetRoomId = tenant.roomId ? tenant.roomId.toString() : prevRoomId;
    const checkedOutAsRep = wasRepresentative && prevStatus !== "checkout" && tenant.status === "checkout";

    let needsNewRepresentative = false;
    let remainingActiveTenants = [];

    if (checkedOutAsRep && targetRoomId) {
        const activeInRoom = await Tenant.find({
            roomId: targetRoomId,
            status: { $ne: "checkout" },
        })
            .select("_id fullName phone isRepresentative status")
            .sort({ createdAt: 1 })
            .lean();

        const hasRep = activeInRoom.some((item) => item.isRepresentative === true);
        if (activeInRoom.length > 0 && !hasRep) {
            needsNewRepresentative = true;
            remainingActiveTenants = activeInRoom.map((item) => ({
                ...item,
                id: item._id.toString(),
            }));
        }
    }

    const updatedTenant = await getTenantById(tenant._id);
    return {
        tenant: updatedTenant,
        needsNewRepresentative,
        remainingActiveTenants,
    };
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
