import ApiError from "../exceptions/ApiError.js";
import MaintenanceTicket from "../models/MaintenanceTicket.js";
import Room from "../models/Room.js";

const formatTicketDoc = (doc) => ({
    id: doc._id,
    areaId: doc.areaId?._id || doc.areaId,
    areaName: doc.areaId?.name || "",
    roomId: doc.roomId?._id || doc.roomId,
    roomCode: doc.roomId?.code || "",
    row: doc.roomId?.row || "",
    title: doc.title,
    description: doc.description || "",
    status: doc.status || "open",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
});

export const listMaintenanceTickets = async (filters = {}) => {
    const query = {};
    if (filters.areaId) query.areaId = filters.areaId;
    if (filters.roomId) query.roomId = filters.roomId;
    if (filters.status) query.status = filters.status;

    const docs = await MaintenanceTicket.find(query)
        .populate("areaId", "name")
        .populate("roomId", "code row status")
        .sort({ createdAt: -1 })
        .lean();

    const tickets = docs.map(formatTicketDoc);

    const summary = tickets.reduce(
        (acc, t) => {
            acc.totalCount += 1;
            if (t.status === "open") acc.openCount += 1;
            else if (t.status === "in_progress") acc.inProgressCount += 1;
            else if (t.status === "resolved") acc.resolvedCount += 1;
            return acc;
        },
        {
            totalCount: 0,
            openCount: 0,
            inProgressCount: 0,
            resolvedCount: 0,
        },
    );

    return { tickets, summary };
};

let droppedLegacyIndex = false;
const ensureLegacyIndexCleaned = async () => {
    if (droppedLegacyIndex) return;
    droppedLegacyIndex = true;
    try {
        await MaintenanceTicket.collection.dropIndex("ticketCode_1");
    } catch {
        // Index không tồn tại hoặc đã xóa
    }
};

export const createMaintenanceTicket = async ({
    roomId,
    title,
    description,
    status,
}) => {
    await ensureLegacyIndexCleaned();
    const room = await Room.findById(roomId);
    if (!room) throw new ApiError(404, "Không tìm thấy phòng.");

    const doc = await MaintenanceTicket.create({
        areaId: room.areaId,
        roomId: room._id,
        title,
        description: description || "",
        status: status || "open",
    });

    const populated = await MaintenanceTicket.findById(doc._id)
        .populate("areaId", "name")
        .populate("roomId", "code row status")
        .lean();

    return formatTicketDoc(populated);
};

export const updateMaintenanceTicket = async (id, payload = {}) => {
    const doc = await MaintenanceTicket.findById(id);
    if (!doc) throw new ApiError(404, "Không tìm thấy phiếu bảo trì.");

    if (payload.roomId) {
        const room = await Room.findById(payload.roomId);
        if (!room) throw new ApiError(404, "Không tìm thấy phòng.");
        doc.roomId = room._id;
        doc.areaId = room.areaId;
    }
    if (payload.title !== undefined) doc.title = payload.title;
    if (payload.description !== undefined) doc.description = payload.description;
    if (payload.status !== undefined) doc.status = payload.status;

    await doc.save();

    const populated = await MaintenanceTicket.findById(doc._id)
        .populate("areaId", "name")
        .populate("roomId", "code row status")
        .lean();

    return formatTicketDoc(populated);
};

export const deleteMaintenanceTicket = async (id) => {
    const doc = await MaintenanceTicket.findById(id);
    if (!doc) throw new ApiError(404, "Không tìm thấy phiếu bảo trì.");

    const data = formatTicketDoc(doc.toObject());
    await doc.deleteOne();
    return data;
};
