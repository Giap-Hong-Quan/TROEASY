import { z } from "zod";

const areaId = z.string().regex(/^[a-f\d]{24}$/i, "id khu vực không hợp lệ.");

export const createAreaSchema = z.object({
    body: z.object({
        name: z.string().trim().min(1).max(120),
        address: z.string().trim().min(1).max(300),
    }).strict(),
});

export const areaIdSchema = z.object({
    params: z.object({ id: areaId }),
});

export const updateAreaSchema = z.object({
    params: z.object({ id: areaId }),
    body: z.object({
        name: z.string().trim().min(1).max(120).optional(),
        address: z.string().trim().min(1).max(300).optional(),
        isActive: z.boolean().optional(),
    }).strict().refine((body) => Object.keys(body).length > 0, "Cần gửi ít nhất một trường để cập nhật."),
});
