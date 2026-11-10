import { z } from "zod";

const expenseId = z.string().regex(/^[a-f\d]{24}$/i, "id khoản chi không hợp lệ.");
const areaId = z.string().regex(/^[a-f\d]{24}$/i, "id khu vực không hợp lệ.");

export const listExpensesSchema = z.object({
    query: z.object({
        areaId: areaId.optional(),
    }),
});

export const createExpenseSchema = z.object({
    body: z.object({
        areaId,
        name: z.string().trim().min(1, "Tên khoản chi là bắt buộc.").max(200, "Tên khoản chi tối đa 200 ký tự."),
        amount: z.coerce.number().min(0, "Số tiền không được âm."),
    }).strict(),
});

export const expenseIdSchema = z.object({
    params: z.object({ id: expenseId }),
});

export const updateExpenseSchema = z.object({
    params: z.object({ id: expenseId }),
    body: z.object({
        name: z.string().trim().min(1, "Tên khoản chi không được để trống.").max(200).optional(),
        amount: z.coerce.number().min(0, "Số tiền không được âm.").optional(),
    }).strict().refine((body) => Object.keys(body).length > 0, "Cần gửi ít nhất một trường để cập nhật."),
});

