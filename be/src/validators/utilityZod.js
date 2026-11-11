import { z } from "zod";
import { UTILITY_READING_STATUSES } from "../models/UtilityReading.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "ID không hợp lệ.");

const meterInputSchema = z.object({
    oldIndex: z.coerce.number().min(0, "Chỉ số cũ không được âm.").default(0),
    newIndex: z.coerce.number().min(0, "Chỉ số mới không được âm."),
    unitPrice: z.coerce.number().min(0, "Đơn giá không được âm.").default(0),
});

export const getUtilitySheetSchema = z.object({
    query: z.object({
        areaId: objectId.optional(),
        month: z.coerce.number().int().min(1).max(12).optional(),
        year: z.coerce.number().int().min(2000).max(2100).optional(),
    }),
});

export const listUtilityReadingsSchema = z.object({
    query: z.object({
        areaId: objectId.optional(),
        roomId: objectId.optional(),
        month: z.coerce.number().int().min(1).max(12).optional(),
        year: z.coerce.number().int().min(2000).max(2100).optional(),
        status: z.enum(UTILITY_READING_STATUSES).optional(),
    }),
});

export const upsertUtilityReadingSchema = z.object({
    body: z.object({
        roomId: objectId,
        month: z.coerce.number().int().min(1).max(12),
        year: z.coerce.number().int().min(2000).max(2100),
        electricity: meterInputSchema,
        water: meterInputSchema,
        status: z.enum(UTILITY_READING_STATUSES).optional(),
        notes: z.string().trim().max(500).optional(),
    }),
});

export const bulkUpsertUtilityReadingsSchema = z.object({
    body: z.object({
        month: z.coerce.number().int().min(1).max(12),
        year: z.coerce.number().int().min(2000).max(2100),
        readings: z
            .array(
                z.object({
                    roomId: objectId,
                    electricity: meterInputSchema,
                    water: meterInputSchema,
                    status: z.enum(UTILITY_READING_STATUSES).optional(),
                    notes: z.string().trim().max(500).optional(),
                }),
            )
            .min(1, "Cần ít nhất 1 phòng để lưu chỉ số."),
    }),
});

export const utilityIdSchema = z.object({
    params: z.object({ id: objectId }),
});

