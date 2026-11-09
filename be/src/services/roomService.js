import ApiError from "../exceptions/ApiError.js";
import Area from "../models/Area.js";
import Room from "../models/Room.js";
import Row from "../models/Row.js";
import Tenant from "../models/Tenant.js";

const toRoom = (room) => ({
    id: room._id,
    areaId: room.areaId,
    rowId: room.rowId,
    code: room.code,
    row: room.row,
    basePrice: room.basePrice,
    status: room.status,
    currentContractId: room.currentContractId,
    qrAccessToken: room.qrAccessToken,
    assets: room.assets,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
});

const getRoomOrThrow = async (id) => {
    const room = await Room.findById(id);
    if (!room) throw new ApiError(404, "Không tìm thấy phòng.");
    return room;
};

const ensureAreaExists = async (areaId) => {
    if (!(await Area.exists({ _id: areaId }))) {
        throw new ApiError(404, "Không tìm thấy khu vực.");
    }
};

const resolveRowForArea = async (areaId, { rowId, row }) => {
    if (rowId) {
        const rowDoc = await Row.findById(rowId);
        if (!rowDoc) throw new ApiError(404, "Không tìm thấy dãy phòng.");
        if (String(rowDoc.areaId) !== String(areaId)) {
            throw new ApiError(400, "Dãy phòng không thuộc khu vực đã chọn.");
        }
        return { rowId: rowDoc._id, row: rowDoc.name };
    }
    if (row) {
        const trimmedName = row.trim();
        let rowDoc = await Row.findOne({ areaId, name: trimmedName });
        if (!rowDoc) {
            rowDoc = await Row.create({ areaId, name: trimmedName });
        }
        return { rowId: rowDoc._id, row: rowDoc.name };
    }
    return { rowId: null, row: undefined };
};

const ensureRoomCodeAvailable = async (areaId, code, exceptId) => {
    const query = { areaId, code: code.trim().toUpperCase() };
    if (exceptId) query._id = { $ne: exceptId };
    if (await Room.exists(query)) {
        throw new ApiError(409, "Mã phòng đã tồn tại trong khu vực này.");
    }
};

const handleDuplicateRoomError = (error) => {
    if (error?.code === 11000) {
        if (error?.keyPattern?.qrAccessToken) {
            throw new ApiError(409, "qrAccessToken đã được sử dụng.");
        }
        throw new ApiError(409, "Mã phòng đã tồn tại trong khu vực này.");
    }
    throw error;
};

export const createRoom = async (roomData) => {
    const normalizedCode = roomData.code.trim().toUpperCase();
    await ensureAreaExists(roomData.areaId);
    await ensureRoomCodeAvailable(roomData.areaId, normalizedCode);

    const resolvedRow = await resolveRowForArea(roomData.areaId, {
        rowId: roomData.rowId,
        row: roomData.row,
    });

    try {
        const room = await Room.create({
            ...roomData,
            code: normalizedCode,
            rowId: resolvedRow.rowId,
            row: resolvedRow.row,
        });
        return toRoom(room);
    } catch (error) {
        return handleDuplicateRoomError(error);
    }
};

export const listRooms = async (filters = {}) => {
    const query = {};
    if (filters.areaId) query.areaId = filters.areaId;
    if (filters.rowId) query.rowId = filters.rowId;
    if (filters.status) query.status = filters.status;
    if (filters.row !== undefined) query.row = filters.row;

    const rooms = await Room.find(query).sort({ createdAt: 1, _id: 1 });
    return rooms.map(toRoom);
};

export const getRoomById = async (id) => toRoom(await getRoomOrThrow(id));

export const updateRoom = async (id, updates) => {
    const room = await getRoomOrThrow(id);

    const targetAreaId = updates.areaId ?? room.areaId;
    const targetCode = updates.code !== undefined ? updates.code.trim().toUpperCase() : room.code;

    if (updates.areaId !== undefined) {
        await ensureAreaExists(updates.areaId);
    }

    if (updates.areaId !== undefined || updates.code !== undefined) {
        await ensureRoomCodeAvailable(targetAreaId, targetCode, room._id);
    }

    if (updates.rowId !== undefined || updates.row !== undefined) {
        if (updates.rowId === null) {
            updates.row = undefined;
        } else {
            const resolvedRow = await resolveRowForArea(targetAreaId, {
                rowId: updates.rowId,
                row: updates.row,
            });
            updates.rowId = resolvedRow.rowId;
            updates.row = resolvedRow.row;
        }
    }

    if (updates.code !== undefined) {
        updates.code = targetCode;
    }

    Object.assign(room, updates);
    try {
        await room.save();
    } catch (error) {
        return handleDuplicateRoomError(error);
    }
    return toRoom(room);
};

export const deactivateRoom = async (id) => {
    const room = await getRoomOrThrow(id);
    room.status = "stop";
    await room.save();
    return toRoom(room);
};

// Xóa phòng khỏi CSDL nhưng KHÔNG xóa người thuê,
// chỉ ngắt liên kết roomId về null để bảo toàn hồ sơ khách thuê
export const deleteRoomAndTenants = async (id) => {
    const room = await getRoomOrThrow(id);
    const roomData = toRoom(room);

    // Cập nhật roomId của khách về null
    await Tenant.updateMany({ roomId: room._id }, { $set: { roomId: null } });
    await room.deleteOne();

    return {
        room: roomData,
    };
};
