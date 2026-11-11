import { z } from "zod";
import { INVOICE_STATUSES, PAYMENT_METHODS } from "../models/Invoice.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "ID không hợp lệ.");

export const listInvoicesSchema = z.object({
    query: z.object({
        areaId: objectId.optional(),
        roomId: objectId.optional(),
        month: z.coerce.number().int().min(1).max(12).optional(),
        year: z.coerce.number().int().min(2000).max(2100).optional(),
        status: z.enum(INVOICE_STATUSES).optional(),
    }),
});

export const previewInvoicesSchema = z.object({
    query: z.object({
        areaId: objectId.optional(),
        month: z.coerce.number().int().min(1).max(12).optional(),
        year: z.coerce.number().int().min(2000).max(2100).optional(),
    }),
});

export const upsertInvoiceSchema = z.object({
    body: z.object({
        roomId: objectId,
        month: z.coerce.number().int().min(1).max(12),
        year: z.coerce.number().int().min(2000).max(2100),
        roomPrice: z.coerce.number().min(0).optional(),
        internetFee: z.coerce.number().min(0).optional(),
        garbageFee: z.coerce.number().min(0).optional(),
        otherFee: z.coerce.number().min(0).optional(),
        discount: z.coerce.number().min(0).optional(),
        paidAmount: z.coerce.number().min(0).optional(),
        paymentMethod: z.enum(PAYMENT_METHODS).optional(),
        notes: z.string().trim().max(500).optional(),
    }),
});

export const bulkGenerateInvoicesSchema = z.object({
    body: z.object({
        month: z.coerce.number().int().min(1).max(12),
        year: z.coerce.number().int().min(2000).max(2100),
        areaId: objectId.optional(),
        roomIds: z.array(objectId).optional(),
        items: z
            .array(
                z.object({
                    roomId: objectId,
                    roomPrice: z.coerce.number().min(0).optional(),
                    internetFee: z.coerce.number().min(0).optional(),
                    garbageFee: z.coerce.number().min(0).optional(),
                    otherFee: z.coerce.number().min(0).optional(),
                    discount: z.coerce.number().min(0).optional(),
                    notes: z.string().trim().max(500).optional(),
                }),
            )
            .optional(),
    }),
});

export const payInvoiceSchema = z.object({
    params: z.object({ id: objectId }),
    body: z.object({
        paidAmount: z.coerce.number().min(0, "Số tiền thu không được âm.").optional(),
        addAmount: z.coerce.number().min(0, "Số tiền thu thêm không được âm.").optional(),
        payFull: z.boolean().optional(),
        paymentMethod: z.enum(PAYMENT_METHODS).optional(),
        notes: z.string().trim().max(500).optional(),
    }),
});

export const invoiceIdSchema = z.object({
    params: z.object({ id: objectId }),
});

