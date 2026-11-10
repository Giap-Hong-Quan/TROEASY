import ApiError from "../exceptions/ApiError.js";
import Area from "../models/Area.js";
import Contract from "../models/Contract.js";
import Room from "../models/Room.js";
import Tenant from "../models/Tenant.js";

const POPULATE = [
    { path: "areaId", select: "name address" },
    { path: "roomId", select: "code row basePrice status" },
    { path: "tenantId", select: "fullName phone citizenId" },
];

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getContractOrThrow = async (id) => {
    const contract = await Contract.findById(id);
    if (!contract) throw new ApiError(404, "Không tìm thấy hợp đồng.");
    return contract;
};

// Sinh mã hợp đồng tự động: HD-<MÃ PHÒNG>-<YYYYMMDD>-<4 ký tự ngẫu nhiên>
const generateContractCode = (roomCode = "") => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `HD-${roomCode || "P"}-${date}-${random}`;
};

// Đồng bộ phòng khi hợp đồng có hiệu lực / kết thúc
const syncRoomWithContract = async (contract) => {
    const room = await Room.findById(contract.roomId);
    if (!room) return;

    if (contract.status === "active") {
        room.currentContractId = contract._id;
        if (room.status === "vacant" || room.status === "deposit") room.status = "renting";
    } else if (String(room.currentContractId) === String(contract._id)) {
        room.currentContractId = null;
    }
    await room.save();
};

export const listContracts = async (query = {}) => {
    const filter = {};
    if (query.areaId) filter.areaId = query.areaId;
    if (query.roomId) filter.roomId = query.roomId;
    if (query.tenantId) filter.tenantId = query.tenantId;
    if (query.status) filter.status = query.status;

    if (query.search) {
        const regex = new RegExp(escapeRegex(query.search.trim()), "i");
        const [tenantIds, roomIds] = await Promise.all([
            Tenant.find({ $or: [{ fullName: regex }, { phone: regex }] }).distinct("_id"),
            Room.find({ code: regex }).distinct("_id"),
        ]);
        filter.$or = [
            { contractCode: regex },
            { tenantId: { $in: tenantIds } },
            { roomId: { $in: roomIds } },
        ];
    }

    return Contract.find(filter).populate(POPULATE).sort({ createdAt: -1 });
};

export const getContractById = async (id) => {
    const contract = await Contract.findById(id).populate(POPULATE);
    if (!contract) throw new ApiError(404, "Không tìm thấy hợp đồng.");
    return contract;
};

export const createContract = async (data) => {
    const [area, room, tenant] = await Promise.all([
        Area.findById(data.areaId),
        Room.findById(data.roomId),
        Tenant.findById(data.tenantId),
    ]);

    if (!area) throw new ApiError(404, "Khu vực không tồn tại.");
    if (!room) throw new ApiError(404, "Phòng không tồn tại.");
    if (!tenant) throw new ApiError(404, "Khách thuê không tồn tại.");
    if (String(room.areaId) !== String(area._id)) {
        throw new ApiError(400, "Phòng không thuộc khu vực đã chọn.");
    }

    const status = data.status || "active";

    // Mỗi phòng chỉ có tối đa 1 hợp đồng đang hiệu lực
    if (status === "active") {
        const existed = await Contract.exists({ roomId: room._id, status: "active" });
        if (existed) throw new ApiError(409, `Phòng ${room.code} đã có hợp đồng đang hiệu lực.`);
    }

    const contractCode = data.contractCode?.trim().toUpperCase() || generateContractCode(room.code);
    if (await Contract.exists({ contractCode })) {
        throw new ApiError(409, "Mã hợp đồng đã tồn tại.");
    }

    const contract = await Contract.create({ ...data, contractCode, status });
    await syncRoomWithContract(contract);

    return getContractById(contract._id);
};

export const updateContract = async (id, data) => {
    const contract = await getContractOrThrow(id);

    if (data.tenantId && !(await Tenant.exists({ _id: data.tenantId }))) {
        throw new ApiError(404, "Khách thuê không tồn tại.");
    }

    const nextStart = data.startDate ?? contract.startDate;
    const nextEnd = data.endDate ?? contract.endDate;
    if (nextEnd <= nextStart) {
        throw new ApiError(400, "Ngày kết thúc phải sau ngày bắt đầu.");
    }

    if (data.status === "active" && contract.status !== "active") {
        const existed = await Contract.exists({
            roomId: contract.roomId,
            status: "active",
            _id: { $ne: contract._id },
        });
        if (existed) throw new ApiError(409, "Phòng đã có hợp đồng đang hiệu lực khác.");
    }

    if (data.serviceFees) {
        data.serviceFees = { ...(contract.toObject().serviceFees || {}), ...data.serviceFees };
    }

    Object.assign(contract, data);
    await contract.save();
    await syncRoomWithContract(contract);

    return getContractById(contract._id);
};

export const deleteContract = async (id) => {
    const contract = await getContractOrThrow(id);

    await Room.updateOne(
        { _id: contract.roomId, currentContractId: contract._id },
        { $set: { currentContractId: null } },
    );
    await contract.deleteOne();

    return contract;
};
