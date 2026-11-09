import ApiError from "../exceptions/ApiError.js";
import Area from "../models/Area.js";
import Room from "../models/Room.js";
import Row from "../models/Row.js";
import Tenant from "../models/Tenant.js";

const toRow = (row) => ({
    id: row._id,
    areaId: row.areaId,
    name: row.name,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
});

const getRowOrThrow = async (id) => {
    const row = await Row.findById(id);
    if (!row) throw new ApiError(404, "Không tìm thấy dãy phòng.");
    return row;
};

const ensureAreaExists = async (areaId) => {
    if (!(await Area.exists({ _id: areaId }))) {
        throw new ApiError(404, "Không tìm thấy khu vực.");
    }
};

const ensureRowNameAvailable = async (areaId, name, exceptId) => {
    const escaped = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const query = {
        areaId,
        name: { $regex: new RegExp(`^${escaped}$`, "i") },
    };
    if (exceptId) query._id = { $ne: exceptId };
    if (await Row.exists(query)) {
        throw new ApiError(409, "Tên dãy đã tồn tại trong khu vực này.");
    }
};

const handleDuplicateRowError = (error) => {
    if (error?.code === 11000) {
        throw new ApiError(409, "Tên dãy đã tồn tại trong khu vực này.");
    }
    throw error;
};

let didSyncLegacyRows = false;
const syncLegacyRoomRowsIfNeeded = async () => {
    if (didSyncLegacyRows) return;
    didSyncLegacyRows = true;
    try {
        const unlinkedRooms = await Room.find({
            rowId: null,
            row: { $exists: true, $nin: [null, ""] },
        });
        for (const room of unlinkedRooms) {
            if (!room.areaId || !room.row) continue;
            const trimmedName = String(room.row).trim();
            if (!trimmedName) continue;
            let rowDoc = await Row.findOne({ areaId: room.areaId, name: trimmedName });
            if (!rowDoc) {
                rowDoc = await Row.create({ areaId: room.areaId, name: trimmedName });
            }
            room.rowId = rowDoc._id;
            room.row = rowDoc.name;
            await room.save();
        }
    } catch {
        // Ignore non-critical background sync errors
    }
};

export const createRow = async ({ areaId, name }) => {
    const trimmedName = name.trim();
    await ensureAreaExists(areaId);
    await ensureRowNameAvailable(areaId, trimmedName);

    try {
        const row = await Row.create({ areaId, name: trimmedName });
        return toRow(row);
    } catch (error) {
        return handleDuplicateRowError(error);
    }
};

export const listRows = async (filters = {}) => {
    await syncLegacyRoomRowsIfNeeded();
    const query = {};
    if (filters.areaId) query.areaId = filters.areaId;

    const rows = await Row.find(query).sort({ createdAt: 1, _id: 1 });
    return rows.map(toRow);
};

export const getRowById = async (id) => toRow(await getRowOrThrow(id));

export const updateRow = async (id, updates) => {
    const row = await getRowOrThrow(id);

    if (updates.name !== undefined) {
        updates.name = updates.name.trim();
        await ensureRowNameAvailable(row.areaId, updates.name, row._id);
    }

    Object.assign(row, updates);
    try {
        await row.save();
        if (updates.name !== undefined) {
            await Room.updateMany({ rowId: row._id }, { $set: { row: row.name } });
        }
    } catch (error) {
        return handleDuplicateRowError(error);
    }
    return toRow(row);
};

export const deleteRowAndRooms = async (id) => {
    const row = await getRowOrThrow(id);
    const rowData = toRow(row);

    const roomFilter = {
        $or: [
            { rowId: row._id },
            { areaId: row.areaId, row: row.name },
        ],
    };

    // Ngắt liên kết roomId của khách thuê về null để không làm mất hồ sơ khách thuê
    const roomIds = await Room.find(roomFilter).distinct("_id");
    await Tenant.updateMany({ roomId: { $in: roomIds } }, { $set: { roomId: null } });

    const deleteRoomsResult = await Room.deleteMany(roomFilter);

    await row.deleteOne();

    return {
        row: rowData,
        deletedRoomsCount: deleteRoomsResult.deletedCount ?? 0,
    };
};
