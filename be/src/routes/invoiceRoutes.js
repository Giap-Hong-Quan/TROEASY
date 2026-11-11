import express from "express";
import {
    bulkGenerateInvoicesController,
    deleteInvoiceController,
    getInvoiceSheetController,
    getInvoicesController,
    payInvoiceController,
    upsertInvoiceController,
} from "../controllers/invoiceController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
    bulkGenerateInvoicesSchema,
    invoiceIdSchema,
    listInvoicesSchema,
    payInvoiceSchema,
    previewInvoicesSchema,
    upsertInvoiceSchema,
} from "../validators/invoiceZod.js";

const invoiceRouter = express.Router();
invoiceRouter.use(verifyToken);

invoiceRouter
    .route("/sheet")
    .get(validate(previewInvoicesSchema), getInvoiceSheetController);

invoiceRouter
    .route("/generate")
    .post(
        validate(bulkGenerateInvoicesSchema),
        bulkGenerateInvoicesController,
    );

invoiceRouter
    .route("/")
    .get(validate(listInvoicesSchema), getInvoicesController)
    .post(validate(upsertInvoiceSchema), upsertInvoiceController);

invoiceRouter
    .route("/:id/pay")
    .patch(validate(payInvoiceSchema), payInvoiceController);

invoiceRouter
    .route("/:id")
    .delete(validate(invoiceIdSchema), deleteInvoiceController);

export default invoiceRouter;

