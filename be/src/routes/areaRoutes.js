import express from "express";
import {
    createAreaController,
    deleteArea,
    getArea,
    getAreas,
    updateAreaController,
} from "../controllers/areaController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
    areaIdSchema,
    createAreaSchema,
    updateAreaSchema,
} from "../validators/areaZod.js";

const areaRouter = express.Router();
areaRouter.use(verifyToken);

/**
 * @openapi
 * /api/areas:
 *   post:
 *     summary: Tạo khu vực
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, address]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Khu A
 *               address:
 *                 type: string
 *                 example: 12 Nguyễn Trãi, Hà Nội
 *     responses:
 *       201:
 *         description: Tạo khu vực thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Thiếu hoặc sai token
 *   get:
 *     summary: Lấy danh sách khu vực
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách khu vực
 *       401:
 *         description: Thiếu hoặc sai token
 */
areaRouter.route("/")
    .post(validate(createAreaSchema), createAreaController)
    .get(getAreas);

/**
 * @openapi
 * /api/areas/{id}:
 *   get:
 *     summary: Lấy chi tiết khu vực
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 665f1a2b3c4d5e6f78901234
 *     responses:
 *       200:
 *         description: Thông tin khu vực
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Thiếu hoặc sai token
 *       404:
 *         description: Không tìm thấy khu vực
 *   patch:
 *     summary: Cập nhật khu vực
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật khu vực thành công
 *       400:
 *         description: ID hoặc dữ liệu không hợp lệ
 *       401:
 *         description: Thiếu hoặc sai token
 *       404:
 *         description: Không tìm thấy khu vực
 *   delete:
 *     summary: Ngừng hoạt động khu vực
 *     description: Đặt isActive thành false, không xóa vĩnh viễn dữ liệu.
 *     tags: [Areas]
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
 *         description: Đã ngừng hoạt động khu vực
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Thiếu hoặc sai token
 *       404:
 *         description: Không tìm thấy khu vực
 */
areaRouter.route("/:id")
    .get(validate(areaIdSchema), getArea)
    .patch(validate(updateAreaSchema), updateAreaController)
    .delete(validate(areaIdSchema), deleteArea);

export default areaRouter;
