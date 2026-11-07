import { z } from "zod";

const userId = z.string().regex(/^[a-f\d]{24}$/i, "id không hợp lệ.");

export const createUserSchema = z.object({
    body: z.object({
        fullName: z.string().trim().max(120).optional(),
        username: z.string().trim().min(1).max(80),
        password: z.string().min(1),
    }).strict(),
});

export const userIdSchema = z.object({
    params: z.object({ id: userId }),
});

export const updateUserSchema = z.object({
    params: z.object({ id: userId }),
    body: z.object({
        fullName: z.string().trim().max(120).optional(),
        username: z.string().trim().min(1).max(80).optional(),
        password: z.string().min(1).optional(),
        isActive: z.boolean().optional(),
    }).strict().refine((body) => Object.keys(body).length > 0, "Cần gửi ít nhất một trường để cập nhật."),
});
