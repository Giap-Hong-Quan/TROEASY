import express from "express";
import {
    createRowController,
    deleteRow,
    getRow,
    getRows,
    updateRowController,
} from "../controllers/rowController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
    createRowSchema,
    listRowsSchema,
    rowIdSchema,
    updateRowSchema,
} from "../validators/rowZod.js";

const rowRouter = express.Router();
rowRouter.use(verifyToken);

/**
 * @openapi
 * /api/rows:
 *   post:
 *     summary: Tạo dãy phòng mới trong khu vực
 *     tags: [Rows]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [areaId, name]
 *             properties:
 *               areaId:
 *                 type: string
 *                 example: 665f1a2b3c4d5e6f78901234
 *               name:
 *                 type: string
 *                 example: Dãy 1
 *     responses:
 *       201:
 *         description: Tạo dãy phòng thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Thiếu hoặc sai token
 *       404:
 *         description: Không tìm thấy khu vực
 *       409:
 *         description: Tên dãy đã tồn tại trong khu vực
 *   get:
 *     summary: Lấy danh sách dãy phòng
 *     tags: [Rows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: areaId
 *         schema:
 *           type: string
 *         description: Lọc theo ID khu vực
 *     responses:
 *       200:
 *         description: Danh sách dãy phòng
 *       401:
 *         description: Thiếu hoặc sai token
 */
rowRouter.route("/")
    .post(validate(createRowSchema), createRowController)
    .get(validate(listRowsSchema), getRows);

/**
 * @openapi
 * /api/rows/{id}:
 *   get:
 *     summary: Lấy chi tiết dãy phòng
 *     tags: [Rows]
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
 *         description: Thông tin dãy phòng
 *       404:
 *         description: Không tìm thấy dãy phòng
 *   patch:
 *     summary: Cập nhật dãy phòng
 *     tags: [Rows]
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
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật dãy phòng thành công
 *   delete:
 *     summary: Xóa dãy phòng và toàn bộ phòng thuộc dãy
 *     tags: [Rows]
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
 *         description: Đã xóa dãy và toàn bộ phòng thuộc dãy
 */
rowRouter.route("/:id")
    .get(validate(rowIdSchema), getRow)
    .patch(validate(updateRowSchema), updateRowController)
    .delete(validate(rowIdSchema), deleteRow);

export default rowRouter;

