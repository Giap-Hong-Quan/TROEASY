import express from "express";
import {
    createTenantController,
    deleteTenantController,
    getTenant,
    getTenants,
    updateTenantController,
} from "../controllers/tenantController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
    createTenantSchema,
    listTenantsSchema,
    tenantIdSchema,
    updateTenantSchema,
} from "../validators/tenantZod.js";

const tenantRouter = express.Router();
tenantRouter.use(verifyToken);

/**
 * @openapi
 * /api/tenants:
 *   get:
 *     summary: Lấy danh sách khách thuê
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: areaId
 *         schema:
 *           type: string
 *       - in: query
 *         name: roomId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, checkout]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *   post:
 *     summary: Thêm khách thuê mới
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [areaId, fullName, phone]
 *             properties:
 *               areaId:
 *                 type: string
 *               roomId:
 *                 type: string
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               citizenId:
 *                 type: string
 *               isRepresentative:
 *                 type: boolean
 *               status:
 *                 type: string
 *                 enum: [active, checkout]
 *               depositAmount:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Thêm khách thuê thành công
 */
tenantRouter
    .route("/")
    .get(validate(listTenantsSchema), getTenants)
    .post(validate(createTenantSchema), createTenantController);

/**
 * @openapi
 * /api/tenants/{id}:
 *   get:
 *     summary: Lấy chi tiết khách thuê
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *   put:
 *     summary: Cập nhật thông tin khách thuê
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa khách thuê
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
tenantRouter
    .route("/:id")
    .get(validate(tenantIdSchema), getTenant)
    .put(validate(updateTenantSchema), updateTenantController)
    .delete(validate(tenantIdSchema), deleteTenantController);

export default tenantRouter;

