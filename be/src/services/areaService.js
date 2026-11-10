import ApiError from "../exceptions/ApiError.js";
import Area from "../models/Area.js";
import Room from "../models/Room.js";
import Row from "../models/Row.js";
import Tenant from "../models/Tenant.js";

const toArea = (area) => ({
    id: area._id,
    name: area.name,
    address: area.address,
    isActive: area.isActive,
    createdAt: area.createdAt,
    updatedAt: area.updatedAt,
});

const getAreaOrThrow = async (id) => {
    const area = await Area.findById(id);
    if (!area) throw new ApiError(404, "Không tìm thấy khu vực.");
    return area;
};

export const createArea = async ({ name, address }) => {
    const area = await Area.create({ name, address });
    return toArea(area);
};

export const listAreas = async () => {
    const areas = await Area.find().sort({ createdAt: -1 });
    return areas.map(toArea);
};

export const getAreaById = async (id) => toArea(await getAreaOrThrow(id));

export const updateArea = async (id, updates) => {
    const area = await getAreaOrThrow(id);
    Object.assign(area, updates);
    await area.save();
    return toArea(area);
};

export const deactivateArea = async (id) => {
    const area = await getAreaOrThrow(id);
    area.isActive = false;
    await area.save();
    return toArea(area);
};

// Xóa khu vực và các phòng/dãy thuộc khu,
// bảo toàn hồ sơ khách thuê (chỉ ngắt liên kết roomId về null)
export const deleteAreaAndRelations = async (id) => {
    const area = await getAreaOrThrow(id);
    const areaData = toArea(area);

    // 1. Bảo toàn hồ sơ khách thuê: ngắt liên kết phòng
    await Tenant.updateMany(
        { areaId: area._id },
        { $set: { roomId: null } }
    );

    // 2. Xóa tất cả các phòng và dãy thuộc khu vực này
    await Room.deleteMany({ areaId: area._id });
    await Row.deleteMany({ areaId: area._id });

    // 3. Xóa khu vực khỏi CSDL
    await area.deleteOne();

    return areaData;
};
