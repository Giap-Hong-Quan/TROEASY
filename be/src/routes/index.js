import express from "express";
import areaRouter from "./areaRoutes.js";
import authRouter from "./authRoutes.js";
import contractRouter from "./contractRoutes.js";
import expenseRouter from "./expenseRoutes.js";
import invoiceRouter from "./invoiceRoutes.js";
import maintenanceRouter from "./maintenanceRoutes.js";
import roomRouter from "./roomRoutes.js";
import rowRouter from "./rowRoutes.js";
import tenantRouter from "./tenantRoutes.js";
import userRouter from "./userRoutes.js";
import utilityRouter from "./utilityRoutes.js";

const router = express.Router();
router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/areas", areaRouter);
router.use("/rows", rowRouter);
router.use("/rooms", roomRouter);
router.use("/tenants", tenantRouter);
router.use("/contracts", contractRouter);
router.use("/expenses", expenseRouter);
router.use("/utilities", utilityRouter);
router.use("/invoices", invoiceRouter);
router.use("/maintenances", maintenanceRouter);

export default router;
