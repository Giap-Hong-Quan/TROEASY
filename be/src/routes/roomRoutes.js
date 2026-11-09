import express from "express";
import {
    createRoomController,
    deleteRoom,
    getRoom,
    getRooms,
    updateRoomController,
} from "../controllers/roomController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
    createRoomSchema,
    listRoomsSchema,
    roomIdSchema,
    updateRoomSchema,
} from "../validators/roomZod.js";

const roomRouter = express.Router();
roomRouter.use(verifyToken);

/**
 * @openapi
 * /api/rooms:
 *   post:
 *     summary: Tạo phòng mới
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [areaId, code]
 *             properties:
 *               areaId:
 *                 type: string
 *                 example: 665f1a2b3c4d5e6f78901234
 *               code:
 *                 type: string
 *                 example: P101
 *               row:
 *                 type: string
 *                 example: Dãy 1
 *               basePrice:
 *                 type: number
 *                 example: 3500000
 *               status:
 *                 type: string
 *                 enum: [vacant, renting, deposit, repair, stop]
 *                 example: vacant
 *               currentContractId:
 *                 type: string
 *                 nullable: true
 *               qrAccessToken:
 *                 type: string
 *                 example: qr-token-p101
 *               assets:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Tạo phòng thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Thiếu hoặc sai token
 *       404:
 *         description: Không tìm thấy khu vực
 *       409:
 *         description: Mã phòng hoặc qrAccessToken đã tồn tại
 *   get:
 *     summary: Lấy danh sách phòng
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: areaId
 *         schema:
 *           type: string
 *         description: Lọc theo ID khu vực
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [vacant, renting, deposit, repair, stop]
 *         description: Lọc theo trạng thái phòng
 *       - in: query
 *         name: row
 *         schema:
 *           type: string
 *         description: Lọc theo dãy phòng
 *     responses:
 *       200:
 *         description: Danh sách phòng
 *       400:
 *         description: Tham số lọc không hợp lệ
 *       401:
 *         description: Thiếu hoặc sai token
 */
roomRouter.route("/")
    .post(validate(createRoomSchema), createRoomController)
    .get(validate(listRoomsSchema), getRooms);

/**
 * @openapi
 * /api/rooms/{id}:
 *   get:
 *     summary: Lấy chi tiết phòng
 *     tags: [Rooms]
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
 *         description: Thông tin chi tiết phòng
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Thiếu hoặc sai token
 *       404:
 *         description: Không tìm thấy phòng
 *   patch:
 *     summary: Cập nhật thông tin phòng
 *     tags: [Rooms]
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
 *               areaId:
 *                 type: string
 *               code:
 *                 type: string
 *               row:
 *                 type: string
 *               basePrice:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [vacant, renting, deposit, repair, stop]
 *               currentContractId:
 *                 type: string
 *                 nullable: true
 *               qrAccessToken:
 *                 type: string
 *               assets:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Cập nhật phòng thành công
 *       400:
 *         description: ID hoặc dữ liệu không hợp lệ
 *       401:
 *         description: Thiếu hoặc sai token
 *       404:
 *         description: Không tìm thấy phòng hoặc khu vực
 *       409:
 *         description: Mã phòng hoặc qrAccessToken đã tồn tại
 *   delete:
 *     summary: Tạm ngừng cho thuê phòng
 *     description: Đặt status thành stop, không xóa vĩnh viễn dữ liệu phòng.
 *     tags: [Rooms]
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
 *         description: Đã tạm ngừng cho thuê phòng
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Thiếu hoặc sai token
 *       404:
 *         description: Không tìm thấy phòng
 */
roomRouter.route("/:id")
    .get(validate(roomIdSchema), getRoom)
    .patch(validate(updateRoomSchema), updateRoomController)
    .delete(validate(roomIdSchema), deleteRoom);

export default roomRouter;
