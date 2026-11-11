import ApiError from "../exceptions/ApiError.js";
import Area from "../models/Area.js";
import Contract from "../models/Contract.js";
import Room from "../models/Room.js";
import Tenant from "../models/Tenant.js";
import UtilityReading from "../models/UtilityReading.js";

const toUtilityReading = (doc) => ({
    id: doc._id,
    areaId: doc.areaId,
    roomId: doc.roomId,
    contractId: doc.contractId,
    month: doc.month,
    year: doc.year,
    readingDate: doc.readingDate,
    electricity: {
        oldIndex: doc.electricity?.oldIndex ?? 0,
        newIndex: doc.electricity?.newIndex ?? 0,
        usage: doc.electricity?.usage ?? 0,
        unitPrice: doc.electricity?.unitPrice ?? 0,
        amount: doc.electricity?.amount ?? 0,
    },
    water: {
        oldIndex: doc.water?.oldIndex ?? 0,
        newIndex: doc.water?.newIndex ?? 0,
        usage: doc.water?.usage ?? 0,
        unitPrice: doc.water?.unitPrice ?? 0,
        amount: doc.water?.amount ?? 0,
    },
    totalAmount: doc.totalAmount ?? 0,
    status: doc.status,
    notes: doc.notes ?? "",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
});

/**
 * Lấy bảng chỉ số điện nước theo kỳ (month, year) và khu vực (areaId tùy chọn).
 * Tự động điền:
 *  - oldIndex từ newIndex của kỳ gần nhất trước đó (nếu kỳ này chưa ghi).
 *  - unitPrice từ hợp đồng active của phòng (fallback: điện 3500, nước 20000).
 */
export const getUtilitySheet = async ({ areaId, month, year } = {}) => {
    const now = new Date();
    const targetMonth = Number(month) || now.getMonth() + 1;
    const targetYear = Number(year) || now.getFullYear();

    const roomQuery = { status: "renting" };
    if (areaId) roomQuery.areaId = areaId;

    const [areas, rooms] = await Promise.all([
        Area.find().lean(),
        Room.find(roomQuery).sort({ areaId: 1, row: 1, code: 1 }).lean(),
    ]);

    const areaMap = new Map(areas.map((a) => [String(a._id), a.name]));
    const roomIds = rooms.map((r) => r._id);

    const [activeContracts, activeTenants, currentReadings, prevReadings] =
        await Promise.all([
            Contract.find({
                roomId: { $in: roomIds },
                status: "active",
            })
                .populate("tenantId", "fullName phone")
                .lean(),
            Tenant.find({
                roomId: { $in: roomIds },
                status: { $ne: "checkout" },
            })
                .sort({ isRepresentative: -1, createdAt: 1 })
                .lean(),
            UtilityReading.find({
                roomId: { $in: roomIds },
                month: targetMonth,
                year: targetYear,
            }).lean(),
            UtilityReading.find({
                roomId: { $in: roomIds },
                $or: [
                    { year: { $lt: targetYear } },
                    { year: targetYear, month: { $lt: targetMonth } },
                ],
            })
                .sort({ year: -1, month: -1 })
                .lean(),
        ]);

    const contractByRoom = new Map();
    for (const c of activeContracts) {
        contractByRoom.set(String(c.roomId), c);
    }

    const tenantByRoom = new Map();
    for (const t of activeTenants) {
        const key = String(t.roomId);
        if (!tenantByRoom.has(key)) {
            tenantByRoom.set(key, t);
        }
    }

    const currentReadingByRoom = new Map();
    for (const r of currentReadings) {
        currentReadingByRoom.set(String(r.roomId), r);
    }

    // Lấy bản ghi kỳ gần nhất trước (targetYear, targetMonth) cho từng phòng
    const prevReadingByRoom = new Map();
    for (const r of prevReadings) {
        const key = String(r.roomId);
        if (!prevReadingByRoom.has(key)) {
            prevReadingByRoom.set(key, r);
        }
    }

    const items = rooms.map((room) => {
        const key = String(room._id);
        const contract = contractByRoom.get(key);
        const fallbackTenant = tenantByRoom.get(key);
        const current = currentReadingByRoom.get(key);
        const prev = prevReadingByRoom.get(key);

        const defaultElecPrice =
            contract?.serviceFees?.electricityPrice ?? 3500;
        const defaultWaterPrice = contract?.serviceFees?.waterPrice ?? 20000;

        const elecOld = current
            ? current.electricity.oldIndex
            : (prev?.electricity?.newIndex ?? 0);
        const elecNew = current ? current.electricity.newIndex : null;
        const elecPrice = current
            ? current.electricity.unitPrice
            : defaultElecPrice;
        const elecUsage = current ? current.electricity.usage : 0;
        const elecAmount = current ? current.electricity.amount : 0;

        const waterOld = current
            ? current.water.oldIndex
            : (prev?.water?.newIndex ?? 0);
        const waterNew = current ? current.water.newIndex : null;
        const waterPrice = current ? current.water.unitPrice : defaultWaterPrice;
        const waterUsage = current ? current.water.usage : 0;
        const waterAmount = current ? current.water.amount : 0;

        return {
            roomId: room._id,
            areaId: room.areaId,
            areaName: areaMap.get(String(room.areaId)) || "",
            roomCode: room.code,
            row: room.row || "",
            roomStatus: room.status,
            contractId: contract?._id || null,
            tenantName:
                contract?.tenantId?.fullName || fallbackTenant?.fullName || "",
            readingId: current?._id || null,
            isRecorded: Boolean(current),
            status: current?.status || "unrecorded",
            readingDate: current?.readingDate || null,
            prevPeriod: prev
                ? { month: prev.month, year: prev.year }
                : null,
            electricity: {
                oldIndex: elecOld,
                newIndex: elecNew,
                usage: elecUsage,
                unitPrice: elecPrice,
                amount: elecAmount,
            },
            water: {
                oldIndex: waterOld,
                newIndex: waterNew,
                usage: waterUsage,
                unitPrice: waterPrice,
                amount: waterAmount,
            },
            totalAmount: current?.totalAmount ?? 0,
            notes: current?.notes ?? "",
        };
    });

    return {
        month: targetMonth,
        year: targetYear,
        items,
    };
};

export const listUtilityReadings = async (filters = {}) => {
    const query = {};
    if (filters.areaId) query.areaId = filters.areaId;
    if (filters.roomId) query.roomId = filters.roomId;
    if (filters.month) query.month = Number(filters.month);
    if (filters.year) query.year = Number(filters.year);
    if (filters.status) query.status = filters.status;

    const docs = await UtilityReading.find(query).sort({
        year: -1,
        month: -1,
        createdAt: -1,
    });
    return docs.map(toUtilityReading);
};

export const upsertSingleReading = async ({
    roomId,
    month,
    year,
    electricity,
    water,
    status,
    notes,
}) => {
    const room = await Room.findById(roomId);
    if (!room) throw new ApiError(404, "Không tìm thấy phòng.");

    const activeContract = await Contract.findOne({
        roomId: room._id,
        status: "active",
    }).select("_id");

    let doc = await UtilityReading.findOne({
        roomId: room._id,
        month: Number(month),
        year: Number(year),
    });

    if (!doc) {
        doc = new UtilityReading({
            areaId: room.areaId,
            roomId: room._id,
            contractId: activeContract?._id || null,
            month: Number(month),
            year: Number(year),
        });
    } else {
        doc.areaId = room.areaId;
        if (!doc.contractId && activeContract?._id) {
            doc.contractId = activeContract._id;
        }
    }

    doc.electricity = {
        oldIndex: Number(electricity.oldIndex) || 0,
        newIndex: Number(electricity.newIndex) || 0,
        unitPrice: Number(electricity.unitPrice) || 0,
    };
    doc.water = {
        oldIndex: Number(water.oldIndex) || 0,
        newIndex: Number(water.newIndex) || 0,
        unitPrice: Number(water.unitPrice) || 0,
    };
    doc.readingDate = new Date();
    if (status) doc.status = status;
    if (notes !== undefined) doc.notes = notes;

    try {
        await doc.save();
    } catch (error) {
        if (error?.name === "ValidationError") {
            const firstMsg =
                Object.values(error.errors)[0]?.message ||
                "Dữ liệu chỉ số điện nước không hợp lệ.";
            throw new ApiError(400, firstMsg);
        }
        throw error;
    }

    return toUtilityReading(doc);
};

export const bulkUpsertReadings = async ({ month, year, readings }) => {
    const saved = [];
    for (const item of readings) {
        const result = await upsertSingleReading({
            roomId: item.roomId,
            month,
            year,
            electricity: item.electricity,
            water: item.water,
            status: item.status,
            notes: item.notes,
        });
        saved.push(result);
    }
    return saved;
};

export const deleteUtilityReading = async (id) => {
    const doc = await UtilityReading.findById(id);
    if (!doc) throw new ApiError(404, "Không tìm thấy bản ghi điện nước.");
    const data = toUtilityReading(doc);
    await doc.deleteOne();
    return data;
};

