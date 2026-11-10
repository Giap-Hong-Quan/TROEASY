import express from "express";
import {
    createContractController,
    deleteContractController,
    getContract,
    getContracts,
    updateContractController,
} from "../controllers/contractController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
    contractIdSchema,
    createContractSchema,
    listContractsSchema,
    updateContractSchema,
} from "../validators/contractZod.js";

const contractRouter = express.Router();
contractRouter.use(verifyToken);

/**
 * @openapi
 * /api/contracts:
 *   get:
 *     summary: Lấy danh sách hợp đồng
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: areaId, schema: { type: string } }
 *       - { in: query, name: roomId, schema: { type: string } }
 *       - { in: query, name: tenantId, schema: { type: string } }
 *       - { in: query, name: status, schema: { type: string, enum: [draft, active, expired, terminated] } }
 *       - { in: query, name: search, schema: { type: string } }
 *     responses:
 *       200: { description: Thành công }
 *   post:
 *     summary: Tạo hợp đồng mới
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [areaId, roomId, tenantId, startDate, endDate, rentalPrice]
 *             properties:
 *               contractCode: { type: string, example: HD-P101-2026 }
 *               areaId: { type: string }
 *               roomId: { type: string }
 *               tenantId: { type: string }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *               rentalPrice: { type: number, example: 3500000 }
 *               depositAmount: { type: number, example: 3500000 }
 *               billingDay: { type: number, example: 5 }
 *               paymentCycle: { type: number, example: 1 }
 *               serviceFees:
 *                 type: object
 *                 properties:
 *                   electricityPrice: { type: number, example: 3500 }
 *                   waterPrice: { type: number, example: 20000 }
 *                   internetPrice: { type: number, example: 100000 }
 *                   garbagePrice: { type: number, example: 30000 }
 *               status: { type: string, enum: [draft, active, expired, terminated] }
 *               notes: { type: string }
 *     responses:
 *       201: { description: Tạo thành công }
 */
contractRouter
    .route("/")
    .get(validate(listContractsSchema), getContracts)
    .post(validate(createContractSchema), createContractController);

/**
 * @openapi
 * /api/contracts/{id}:
 *   get:
 *     summary: Lấy chi tiết hợp đồng
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Thành công }
 *   patch:
 *     summary: Cập nhật hợp đồng (gia hạn, thanh lý, đổi giá...)
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Cập nhật thành công }
 *   delete:
 *     summary: Xóa hợp đồng
 *     tags: [Contracts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Xóa thành công }
 */
contractRouter
    .route("/:id")
    .get(validate(contractIdSchema), getContract)
    .patch(validate(updateContractSchema), updateContractController)
    .delete(validate(contractIdSchema), deleteContractController);

export default contractRouter;

