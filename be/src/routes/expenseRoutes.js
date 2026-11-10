import express from "express";
import {
    createExpenseController,
    deleteExpenseController,
    getExpense,
    getExpenses,
    updateExpenseController,
} from "../controllers/expenseController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
    createExpenseSchema,
    expenseIdSchema,
    listExpensesSchema,
    updateExpenseSchema,
} from "../validators/expenseZod.js";

const expenseRouter = express.Router();
expenseRouter.use(verifyToken);

/**
 * @openapi
 * /api/expenses:
 *   post:
 *     summary: Tạo khoản chi mới cho khu trọ
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [areaId, name, amount]
 *             properties:
 *               areaId:
 *                 type: string
 *               name:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Tạo khoản chi thành công
 *   get:
 *     summary: Lấy danh sách khoản chi (có thể lọc theo khu vực)
 *     tags: [Expenses]
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
 *         description: Danh sách khoản chi
 */
expenseRouter
    .route("/")
    .post(validate(createExpenseSchema), createExpenseController)
    .get(validate(listExpensesSchema), getExpenses);

/**
 * @openapi
 * /api/expenses/{id}:
 *   get:
 *     summary: Lấy chi tiết khoản chi
 *     tags: [Expenses]
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
 *         description: Thông tin khoản chi
 *   patch:
 *     summary: Cập nhật khoản chi
 *     tags: [Expenses]
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
 *         description: Cập nhật khoản chi thành công
 *   delete:
 *     summary: Xóa khoản chi
 *     tags: [Expenses]
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
 *         description: Đã xóa khoản chi
 */
expenseRouter
    .route("/:id")
    .get(validate(expenseIdSchema), getExpense)
    .patch(validate(updateExpenseSchema), updateExpenseController)
    .delete(validate(expenseIdSchema), deleteExpenseController);

export default expenseRouter;

