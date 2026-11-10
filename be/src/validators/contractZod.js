import { z } from "zod";
import { CONTRACT_STATUSES } from "../models/Contract.js";

const objectId = (field) => z.string().regex(/^[a-f\d]{24}$/i, `${field} không hợp lệ.`);

const serviceFeesSchema = z.object({
    electricityPrice: z.number().min(0).optional(),
    waterPrice: z.number().min(0).optional(),
    internetPrice: z.number().min(0).optional(),
    garbagePrice: z.number().min(0).optional(),
}).strict();

export const listContractsSchema = z.object({
    query: z.object({
        areaId: objectId("id khu vực").optional(),
        roomId: objectId("id phòng").optional(),
        tenantId: objectId("id khách thuê").optional(),
        status: z.enum(CONTRACT_STATUSES).optional(),
        search: z.string().trim().optional(),
    }),
});

export const contractIdSchema = z.object({
    params: z.object({ id: objectId("id hợp đồng") }),
});

export const createContractSchema = z.object({
    body: z.object({
        contractCode: z.string().trim().max(40).optional(),
        areaId: objectId("id khu vực"),
        roomId: objectId("id phòng"),
        tenantId: objectId("id khách thuê"),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        rentalPrice: z.number().min(0, "Giá thuê không được âm."),
        depositAmount: z.number().min(0).optional(),
        billingDay: z.number().int().min(1).max(31).optional(),
        paymentCycle: z.number().int().min(1).optional(),
        serviceFees: serviceFeesSchema.optional(),
        status: z.enum(CONTRACT_STATUSES).optional(),
        notes: z.string().trim().max(1000).optional(),
    }).strict().refine((b) => b.endDate > b.startDate, {
        message: "Ngày kết thúc phải sau ngày bắt đầu.",
        path: ["endDate"],
    }),
});

export const updateContractSchema = z.object({
    params: z.object({ id: objectId("id hợp đồng") }),
    body: z.object({
        tenantId: objectId("id khách thuê").optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        rentalPrice: z.number().min(0).optional(),
        depositAmount: z.number().min(0).optional(),
        billingDay: z.number().int().min(1).max(31).optional(),
        paymentCycle: z.number().int().min(1).optional(),
        serviceFees: serviceFeesSchema.optional(),
        status: z.enum(CONTRACT_STATUSES).optional(),
        notes: z.string().trim().max(1000).optional(),
    }).strict().refine((b) => Object.keys(b).length > 0, "Cần gửi ít nhất một trường để cập nhật."),
});

