import { z } from "zod";
import { MAINTENANCE_STATUSES } from "../models/MaintenanceTicket.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "ID không hợp lệ.");

export const listMaintenancesSchema = z.object({
    query: z.object({
        areaId: objectId.optional(),
        roomId: objectId.optional(),
        status: z.enum(MAINTENANCE_STATUSES).optional(),
    }),
});

export const createMaintenanceSchema = z.object({
    body: z.object({
        areaId: objectId.optional(),
        roomId: objectId,
        title: z
            .string()
            .trim()
            .min(1, "Vui lòng nhập tên bảo trì.")
            .max(200, "Tên bảo trì tối đa 200 ký tự."),
        description: z.string().trim().max(1000).optional(),
        status: z.enum(MAINTENANCE_STATUSES).optional(),
    }),
});

export const updateMaintenanceSchema = z.object({
    params: z.object({ id: objectId }),
    body: z.object({
        roomId: objectId.optional(),
        title: z.string().trim().min(1).max(200).optional(),
        description: z.string().trim().max(1000).optional(),
        status: z.enum(MAINTENANCE_STATUSES).optional(),
    }),
});

export const maintenanceIdSchema = z.object({
    params: z.object({ id: objectId }),
});
