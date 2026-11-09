import { z } from "zod";
import { TENANT_STATUSES } from "../models/Tenant.js";

const objectIdRegex = /^[a-f\d]{24}$/i;
const objectId = (field) => z.string().regex(objectIdRegex, `${field} không hợp lệ.`);

export const listTenantsSchema = z.object({
    query: z.object({
        areaId: objectId("id khu vực").optional(),
        roomId: objectId("id phòng").optional(),
        status: z.enum(TENANT_STATUSES).optional(),
        search: z.string().trim().optional(),
    }),
});

export const tenantIdSchema = z.object({
    params: z.object({
        id: objectId("id khách thuê"),
    }),
});

export const createTenantSchema = z.object({
    body: z.object({
        areaId: objectId("id khu vực"),
        roomId: objectId("id phòng").nullable().optional(),
        fullName: z.string().trim().min(1, "Họ và tên là bắt buộc.").max(100),
        phone: z.string().trim().min(8, "Số điện thoại không hợp lệ.").max(20),
        citizenId: z.string().trim().max(30).optional().default(""),
        isRepresentative: z.boolean().optional().default(true),
        status: z.enum(TENANT_STATUSES).optional().default("active"),
        startDate: z.string().datetime({ offset: true }).or(z.string().date()).or(z.date()).optional(),
        depositAmount: z.number().min(0, "Tiền cọc không được nhỏ hơn 0.").optional().default(0),
        notes: z.string().trim().max(500).optional().default(""),
    }),
});

export const updateTenantSchema = z.object({
    params: z.object({
        id: objectId("id khách thuê"),
    }),
    body: z.object({
        areaId: objectId("id khu vực").optional(),
        roomId: objectId("id phòng").nullable().optional(),
        fullName: z.string().trim().min(1).max(100).optional(),
        phone: z.string().trim().min(8).max(20).optional(),
        citizenId: z.string().trim().max(30).optional(),
        isRepresentative: z.boolean().optional(),
        status: z.enum(TENANT_STATUSES).optional(),
        startDate: z.string().datetime({ offset: true }).or(z.string().date()).or(z.date()).optional(),
        depositAmount: z.number().min(0).optional(),
        notes: z.string().trim().max(500).optional(),
    }).strict().refine((body) => Object.keys(body).length > 0, "Cần gửi ít nhất một trường để cập nhật."),
});

