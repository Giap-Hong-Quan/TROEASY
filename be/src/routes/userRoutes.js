import express from "express";
import {
    createUser,
    deleteUser,
    getUser,
    getUsers,
    updateUser,
} from "../controllers/userController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
    createUserSchema,
    updateUserSchema,
    userIdSchema,
} from "../validators/userZod.js";

const userRouter = express.Router();
userRouter.use(verifyToken);

/**
 * @openapi
 * /api/users:
 *   post:
 *     summary: Tạo tài khoản user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Nguyen Van A
 *               username:
 *                 type: string
 *                 example: user01
 *               password:
 *                 type: string
 *                 format: password
 *                 example: user123
 *     responses:
 *       201:
 *         description: Tạo tài khoản thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Thiếu hoặc sai token
 *       409:
 *         description: Username đã được sử dụng
 *   get:
 *     summary: Lấy danh sách user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách tài khoản
 *       401:
 *         description: Thiếu hoặc sai token
 */
userRouter.route("/")
    .post(validate(createUserSchema), createUser)
    .get(getUsers);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Lấy thông tin user
 *     tags: [Users]
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
 *         description: Thông tin user
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Thiếu hoặc sai token
 *       404:
 *         description: Không tìm thấy user
 *   patch:
 *     summary: Cập nhật user
 *     tags: [Users]
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
 *               fullName:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật user thành công
 *       400:
 *         description: ID hoặc dữ liệu không hợp lệ
 *       401:
 *         description: Thiếu hoặc sai token
 *       404:
 *         description: Không tìm thấy user
 *       409:
 *         description: Username đã được sử dụng
 *   delete:
 *     summary: Ngừng hoạt động user
 *     description: Đặt isActive thành false, không xóa vĩnh viễn tài khoản.
 *     tags: [Users]
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
 *         description: User đã bị ngừng hoạt động
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Thiếu hoặc sai token
 *       404:
 *         description: Không tìm thấy user
 */
userRouter.route("/:id")
    .get(validate(userIdSchema), getUser)
    .patch(validate(updateUserSchema), updateUser)
    .delete(validate(userIdSchema), deleteUser);

export default userRouter;
