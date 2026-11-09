import { z } from "zod";
import { ROOM_STATUSES } from "../models/Room.js";

const roomId = z.string().regex(/^[a-f\d]{24}$/i, "id phòng không hợp lệ.");
const areaId = z.string().regex(/^[a-f\d]{24}$/i, "id khu vực không hợp lệ.");
const rowId = z.string().regex(/^[a-f\d]{24}$/i, "id dãy không hợp lệ.");
const contractId = z.string().regex(/^[a-f\d]{24}$/i, "id hợp đồng không hợp lệ.");

export const listRoomsSchema = z.object({
    query: z.object({
        areaId: areaId.optional(),
        rowId: rowId.optional(),
        status: z.enum(ROOM_STATUSES).optional(),
        row: z.string().trim().min(1).optional(),
    }),
});

export const createRoomSchema = z.object({
    body: z.object({
        areaId,
        rowId: rowId.optional(),
        code: z.string().trim().min(1).max(50),
        row: z.string().trim().min(1).max(50).optional(),
        basePrice: z.number().min(0).optional(),
        status: z.enum(ROOM_STATUSES).optional(),
        currentContractId: contractId.nullable().optional(),
        qrAccessToken: z.string().trim().min(1).optional(),
        assets: z.array(z.string().trim().min(1)).optional(),
    }).strict(),
});

export const roomIdSchema = z.object({
    params: z.object({ id: roomId }),
});

export const updateRoomSchema = z.object({
    params: z.object({ id: roomId }),
    body: z.object({
        areaId: areaId.optional(),
        rowId: rowId.nullable().optional(),
        code: z.string().trim().min(1).max(50).optional(),
        row: z.string().trim().min(1).max(50).optional(),
        basePrice: z.number().min(0).optional(),
        status: z.enum(ROOM_STATUSES).optional(),
        currentContractId: contractId.nullable().optional(),
        qrAccessToken: z.string().trim().min(1).optional(),
        assets: z.array(z.string().trim().min(1)).optional(),
    }).strict().refine((body) => Object.keys(body).length > 0, "Cần gửi ít nhất một trường để cập nhật."),
});
