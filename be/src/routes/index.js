import express from "express";
import areaRouter from "./areaRoutes.js";
import authRouter from "./authRoutes.js";
import roomRouter from "./roomRoutes.js";
import rowRouter from "./rowRoutes.js";
import tenantRouter from "./tenantRoutes.js";
import userRouter from "./userRoutes.js";

const router = express.Router();
router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/areas", areaRouter);
router.use("/rows", rowRouter);
router.use("/rooms", roomRouter);
router.use("/tenants", tenantRouter);

export default router;
