import { z } from "zod";

const rowId = z.string().regex(/^[a-f\d]{24}$/i, "id dãy không hợp lệ.");
const areaId = z.string().regex(/^[a-f\d]{24}$/i, "id khu vực không hợp lệ.");

export const listRowsSchema = z.object({
    query: z.object({
        areaId: areaId.optional(),
    }),
});

export const createRowSchema = z.object({
    body: z.object({
        areaId,
        name: z.string().trim().min(1, "Tên dãy là bắt buộc.").max(80),
    }).strict(),
});

export const rowIdSchema = z.object({
    params: z.object({ id: rowId }),
});

export const updateRowSchema = z.object({
    params: z.object({ id: rowId }),
    body: z.object({
        name: z.string().trim().min(1).max(80).optional(),
        isActive: z.boolean().optional(),
    }).strict().refine((body) => Object.keys(body).length > 0, "Cần gửi ít nhất một trường để cập nhật."),
});

