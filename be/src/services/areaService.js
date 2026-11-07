import ApiError from "../exceptions/ApiError.js";
import Area from "../models/Area.js";

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
