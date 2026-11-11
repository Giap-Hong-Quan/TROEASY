import ApiError from "../exceptions/ApiError.js";
import Area from "../models/Area.js";
import Contract from "../models/Contract.js";
import Invoice from "../models/Invoice.js";
import Room from "../models/Room.js";
import Tenant from "../models/Tenant.js";
import UtilityReading from "../models/UtilityReading.js";

const buildInvoiceCode = (roomCode, month, year, roomId) => {
    const mm = String(month).padStart(2, "0");
    const cleanRoom = String(roomCode || "P")
        .replace(/[^A-Za-z0-9]/g, "")
        .toUpperCase();
    const suffix = String(roomId).slice(-4).toUpperCase();
    return `HD-${year}${mm}-${cleanRoom}-${suffix}`;
};

const formatInvoiceDoc = (doc, { areaMap, roomMap, tenantMap, contractMap } = {}) => {
    const areaIdStr = String(doc.areaId?._id || doc.areaId || "");
    const roomIdStr = String(doc.roomId?._id || doc.roomId || "");
    const tenantIdStr = String(doc.tenantId?._id || doc.tenantId || "");
    const contractIdStr = String(doc.contractId?._id || doc.contractId || "");

    const roomObj = roomMap?.get(roomIdStr) || (doc.roomId?.code ? doc.roomId : null);
    const areaObj = areaMap?.get(areaIdStr) || (doc.areaId?.name ? doc.areaId : null);
    const tenantObj =
        tenantMap?.get(tenantIdStr) || (doc.tenantId?.fullName ? doc.tenantId : null);
    const contractObj =
        contractMap?.get(contractIdStr) ||
        (doc.contractId?.contractCode ? doc.contractId : null);

    const eAmount = Number(doc.electricity?.amount) || 0;
    const wAmount = Number(doc.water?.amount) || 0;
    const serviceAmount =
        (Number(doc.internetFee) || 0) +
        (Number(doc.garbageFee) || 0) +
        (Number(doc.otherFee) || 0);

    return {
        id: doc._id,
        invoiceCode: doc.invoiceCode,
        areaId: doc.areaId?._id || doc.areaId,
        areaName: areaObj?.name || "",
        roomId: doc.roomId?._id || doc.roomId,
        roomCode: roomObj?.code || "",
        row: roomObj?.row || "",
        contractId: doc.contractId?._id || doc.contractId || null,
        contractCode: contractObj?.contractCode || "",
        tenantId: doc.tenantId?._id || doc.tenantId || null,
        tenantName: tenantObj?.fullName || "",
        tenantPhone: tenantObj?.phone || "",
        utilityReadingId: doc.utilityReadingId || null,
        month: doc.month,
        year: doc.year,
        roomPrice: Number(doc.roomPrice) || 0,
        electricity: {
            oldIndex: doc.electricity?.oldIndex ?? 0,
            newIndex: doc.electricity?.newIndex ?? 0,
            usage: doc.electricity?.usage ?? 0,
            unitPrice: doc.electricity?.unitPrice ?? 0,
            amount: eAmount,
        },
        water: {
            oldIndex: doc.water?.oldIndex ?? 0,
            newIndex: doc.water?.newIndex ?? 0,
            usage: doc.water?.usage ?? 0,
            unitPrice: doc.water?.unitPrice ?? 0,
            amount: wAmount,
        },
        utilityAmount: eAmount + wAmount,
        internetFee: Number(doc.internetFee) || 0,
        garbageFee: Number(doc.garbageFee) || 0,
        otherFee: Number(doc.otherFee) || 0,
        serviceAmount,
        discount: Number(doc.discount) || 0,
        totalAmount: Number(doc.totalAmount) || 0,
        paidAmount: Number(doc.paidAmount) || 0,
        remainingAmount: Number(doc.remainingAmount) || 0,
        status: doc.status,
        paymentMethod: doc.paymentMethod || "",
        dueDate: doc.dueDate || null,
        paidAt: doc.paidAt || null,
        notes: doc.notes ?? "",
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
};

/**
 * Lấy danh sách hóa đơn đã lập theo bộ lọc + thống kê tổng hợp.
 */
export const listInvoices = async (filters = {}) => {
    const query = {};
    if (filters.areaId) query.areaId = filters.areaId;
    if (filters.roomId) query.roomId = filters.roomId;
    if (filters.month) query.month = Number(filters.month);
    if (filters.year) query.year = Number(filters.year);
    if (filters.status) query.status = filters.status;

    const docs = await Invoice.find(query)
        .populate("areaId", "name")
        .populate("roomId", "code row status")
        .populate("tenantId", "fullName phone")
        .populate("contractId", "contractCode billingDay")
        .sort({ year: -1, month: -1, createdAt: -1 })
        .lean();

    const invoices = docs.map((d) => formatInvoiceDoc(d));
    invoices.sort((a, b) =>
        String(a.roomCode).localeCompare(String(b.roomCode), "vi", {
            numeric: true,
        }),
    );

    const summary = invoices.reduce(
        (acc, inv) => {
            acc.totalCount += 1;
            acc.totalAmount += inv.totalAmount;
            acc.paidAmount += inv.paidAmount;
            acc.remainingAmount += inv.remainingAmount;
            if (inv.status === "paid") acc.paidCount += 1;
            else if (inv.status === "partial") acc.partialCount += 1;
            else acc.unpaidCount += 1;
            return acc;
        },
        {
            totalCount: 0,
            paidCount: 0,
            partialCount: 0,
            unpaidCount: 0,
            totalAmount: 0,
            paidAmount: 0,
            remainingAmount: 0,
        },
    );

    return { invoices, summary };
};

/**
 * Lấy bảng dự thảo / đối soát lập hóa đơn theo kỳ (month, year, areaId).
 * Gom toàn bộ phòng đang thuê ("renting") cùng hợp đồng, chỉ số điện nước kỳ đó
 * và trạng thái hóa đơn hiện tại để chủ trọ lập nhanh.
 */
export const getInvoiceSheet = async ({ areaId, month, year } = {}) => {
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

    const [activeContracts, activeTenants, utilityReadings, existingInvoices] =
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
            Invoice.find({
                roomId: { $in: roomIds },
                month: targetMonth,
                year: targetYear,
            }).lean(),
        ]);

    const contractByRoom = new Map();
    for (const c of activeContracts) {
        contractByRoom.set(String(c.roomId), c);
    }

    const tenantByRoom = new Map();
    for (const t of activeTenants) {
        const key = String(t.roomId);
        if (!tenantByRoom.has(key)) tenantByRoom.set(key, t);
    }

    const utilityByRoom = new Map();
    for (const u of utilityReadings) {
        utilityByRoom.set(String(u.roomId), u);
    }

    const invoiceByRoom = new Map();
    for (const inv of existingInvoices) {
        invoiceByRoom.set(String(inv.roomId), inv);
    }

    const items = rooms.map((room) => {
        const key = String(room._id);
        const contract = contractByRoom.get(key);
        const fallbackTenant = tenantByRoom.get(key);
        const utility = utilityByRoom.get(key);
        const invoice = invoiceByRoom.get(key);

        const roomPrice = invoice
            ? invoice.roomPrice
            : (contract?.rentalPrice ?? room.basePrice ?? 0);
        const internetFee = invoice
            ? invoice.internetFee
            : (contract?.serviceFees?.internetPrice ?? 100000);
        const garbageFee = invoice
            ? invoice.garbageFee
            : (contract?.serviceFees?.garbagePrice ?? 30000);
        const otherFee = invoice ? invoice.otherFee : 0;
        const discount = invoice ? invoice.discount : 0;

        const elec = utility?.electricity || invoice?.electricity || {
            oldIndex: 0,
            newIndex: 0,
            usage: 0,
            unitPrice: contract?.serviceFees?.electricityPrice ?? 3500,
            amount: 0,
        };
        const water = utility?.water || invoice?.water || {
            oldIndex: 0,
            newIndex: 0,
            usage: 0,
            unitPrice: contract?.serviceFees?.waterPrice ?? 20000,
            amount: 0,
        };

        const utilityAmount =
            (Number(elec.amount) || 0) + (Number(water.amount) || 0);
        const serviceAmount =
            (Number(internetFee) || 0) +
            (Number(garbageFee) || 0) +
            (Number(otherFee) || 0);
        const totalAmount = Math.max(
            0,
            Math.round(
                (Number(roomPrice) || 0) +
                    utilityAmount +
                    serviceAmount -
                    (Number(discount) || 0),
            ),
        );

        return {
            roomId: room._id,
            areaId: room.areaId,
            areaName: areaMap.get(String(room.areaId)) || "",
            roomCode: room.code,
            row: room.row || "",
            contractId: contract?._id || null,
            contractCode: contract?.contractCode || "",
            tenantId: contract?.tenantId?._id || fallbackTenant?._id || null,
            tenantName:
                contract?.tenantId?.fullName || fallbackTenant?.fullName || "",
            tenantPhone:
                contract?.tenantId?.phone || fallbackTenant?.phone || "",
            isUtilityRecorded: Boolean(utility),
            utilityReadingId: utility?._id || null,
            isInvoiced: Boolean(invoice),
            invoiceId: invoice?._id || null,
            invoiceCode: invoice?.invoiceCode || "",
            status: invoice?.status || "unbilled",
            roomPrice,
            electricity: elec,
            water,
            utilityAmount,
            internetFee,
            garbageFee,
            otherFee,
            serviceAmount,
            discount,
            totalAmount: invoice ? invoice.totalAmount : totalAmount,
            paidAmount: invoice?.paidAmount ?? 0,
            remainingAmount: invoice
                ? invoice.remainingAmount
                : totalAmount,
            notes: invoice?.notes ?? "",
        };
    });

    return {
        month: targetMonth,
        year: targetYear,
        items,
    };
};

/**
 * Tạo hoặc cập nhật hóa đơn cho 1 phòng trong kỳ (month, year).
 */
export const upsertSingleInvoice = async ({
    roomId,
    month,
    year,
    roomPrice,
    internetFee,
    garbageFee,
    otherFee,
    discount,
    paidAmount,
    paymentMethod,
    notes,
}) => {
    const targetMonth = Number(month);
    const targetYear = Number(year);

    const room = await Room.findById(roomId);
    if (!room) throw new ApiError(404, "Không tìm thấy phòng.");

    const [activeContract, fallbackTenant, utilityReading] = await Promise.all([
        Contract.findOne({ roomId: room._id, status: "active" }),
        Tenant.findOne({
            roomId: room._id,
            status: { $ne: "checkout" },
        }).sort({ isRepresentative: -1, createdAt: 1 }),
        UtilityReading.findOne({
            roomId: room._id,
            month: targetMonth,
            year: targetYear,
        }),
    ]);

    let doc = await Invoice.findOne({
        roomId: room._id,
        month: targetMonth,
        year: targetYear,
    });

    const billingDay = activeContract?.billingDay || 5;
    const dueDate = new Date(targetYear, targetMonth - 1, billingDay);

    if (!doc) {
        doc = new Invoice({
            invoiceCode: buildInvoiceCode(
                room.code,
                targetMonth,
                targetYear,
                room._id,
            ),
            areaId: room.areaId,
            roomId: room._id,
            contractId: activeContract?._id || null,
            tenantId:
                activeContract?.tenantId || fallbackTenant?._id || null,
            utilityReadingId: utilityReading?._id || null,
            month: targetMonth,
            year: targetYear,
            dueDate,
        });
    } else {
        doc.areaId = room.areaId;
        doc.contractId = activeContract?._id || doc.contractId;
        doc.tenantId =
            activeContract?.tenantId || fallbackTenant?._id || doc.tenantId;
        doc.utilityReadingId = utilityReading?._id || doc.utilityReadingId;
    }

    doc.roomPrice =
        roomPrice !== undefined
            ? Number(roomPrice)
            : (doc.roomPrice || activeContract?.rentalPrice || room.basePrice || 0);

    doc.internetFee =
        internetFee !== undefined
            ? Number(internetFee)
            : (doc.internetFee ??
              activeContract?.serviceFees?.internetPrice ??
              100000);

    doc.garbageFee =
        garbageFee !== undefined
            ? Number(garbageFee)
            : (doc.garbageFee ??
              activeContract?.serviceFees?.garbagePrice ??
              30000);

    if (otherFee !== undefined) doc.otherFee = Number(otherFee) || 0;
    if (discount !== undefined) doc.discount = Number(discount) || 0;

    if (utilityReading) {
        doc.electricity = {
            oldIndex: utilityReading.electricity?.oldIndex ?? 0,
            newIndex: utilityReading.electricity?.newIndex ?? 0,
            usage: utilityReading.electricity?.usage ?? 0,
            unitPrice: utilityReading.electricity?.unitPrice ?? 0,
            amount: utilityReading.electricity?.amount ?? 0,
        };
        doc.water = {
            oldIndex: utilityReading.water?.oldIndex ?? 0,
            newIndex: utilityReading.water?.newIndex ?? 0,
            usage: utilityReading.water?.usage ?? 0,
            unitPrice: utilityReading.water?.unitPrice ?? 0,
            amount: utilityReading.water?.amount ?? 0,
        };
    }

    if (paidAmount !== undefined) doc.paidAmount = Number(paidAmount) || 0;
    if (paymentMethod !== undefined) doc.paymentMethod = paymentMethod;
    if (notes !== undefined) doc.notes = notes;

    await doc.save();

    if (utilityReading) {
        const nextUtilityStatus = doc.status === "paid" ? "paid" : "invoiced";
        if (utilityReading.status !== nextUtilityStatus) {
            utilityReading.status = nextUtilityStatus;
            await utilityReading.save();
        }
    }

    const populated = await Invoice.findById(doc._id)
        .populate("areaId", "name")
        .populate("roomId", "code row status")
        .populate("tenantId", "fullName phone")
        .populate("contractId", "contractCode billingDay")
        .lean();

    return formatInvoiceDoc(populated);
};

/**
 * Lập hóa đơn hàng loạt cho kỳ (month, year).
 */
export const bulkGenerateInvoices = async ({
    month,
    year,
    areaId,
    roomIds,
    items,
}) => {
    const targetMonth = Number(month);
    const targetYear = Number(year);

    let itemList = Array.isArray(items) && items.length > 0 ? items : null;

    if (!itemList) {
        const roomQuery = { status: "renting" };
        if (areaId) roomQuery.areaId = areaId;
        if (Array.isArray(roomIds) && roomIds.length > 0) {
            roomQuery._id = { $in: roomIds };
        }
        const rooms = await Room.find(roomQuery).select("_id").lean();
        itemList = rooms.map((r) => ({ roomId: String(r._id) }));
    }

    const saved = [];
    for (const item of itemList) {
        const inv = await upsertSingleInvoice({
            roomId: item.roomId,
            month: targetMonth,
            year: targetYear,
            roomPrice: item.roomPrice,
            internetFee: item.internetFee,
            garbageFee: item.garbageFee,
            otherFee: item.otherFee,
            discount: item.discount,
            notes: item.notes,
        });
        saved.push(inv);
    }

    return saved;
};

/**
 * Ghi nhận thu tiền cho 1 hóa đơn (thu đủ hoặc thu 1 phần).
 */
export const recordInvoicePayment = async (
    id,
    { paidAmount, addAmount, payFull, paymentMethod, notes } = {},
) => {
    const doc = await Invoice.findById(id);
    if (!doc) throw new ApiError(404, "Không tìm thấy hóa đơn.");

    if (payFull) {
        doc.paidAmount = doc.totalAmount;
    } else if (addAmount !== undefined) {
        doc.paidAmount = Math.min(
            doc.totalAmount,
            (Number(doc.paidAmount) || 0) + (Number(addAmount) || 0),
        );
    } else if (paidAmount !== undefined) {
        doc.paidAmount = Math.min(doc.totalAmount, Number(paidAmount) || 0);
    }

    if (paymentMethod !== undefined) {
        doc.paymentMethod = paymentMethod;
    }
    if (notes !== undefined) {
        doc.notes = notes;
    }
    doc.paidAt = doc.paidAmount > 0 ? new Date() : null;

    await doc.save();

    if (doc.utilityReadingId) {
        const nextUtilityStatus = doc.status === "paid" ? "paid" : "invoiced";
        await UtilityReading.findByIdAndUpdate(doc.utilityReadingId, {
            status: nextUtilityStatus,
        });
    }

    const populated = await Invoice.findById(doc._id)
        .populate("areaId", "name")
        .populate("roomId", "code row status")
        .populate("tenantId", "fullName phone")
        .populate("contractId", "contractCode billingDay")
        .lean();

    return formatInvoiceDoc(populated);
};

/**
 * Xóa hóa đơn và trả trạng thái bản ghi điện nước về "recorded".
 */
export const deleteInvoice = async (id) => {
    const doc = await Invoice.findById(id);
    if (!doc) throw new ApiError(404, "Không tìm thấy hóa đơn.");

    if (doc.utilityReadingId) {
        await UtilityReading.findByIdAndUpdate(doc.utilityReadingId, {
            status: "recorded",
        });
    }

    const formatted = formatInvoiceDoc(doc.toObject());
    await doc.deleteOne();
    return formatted;
};

