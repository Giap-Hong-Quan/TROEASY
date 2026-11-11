import express from "express";
import {
    createMaintenanceController,
    deleteMaintenanceController,
    getMaintenancesController,
    updateMaintenanceController,
} from "../controllers/maintenanceController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
    createMaintenanceSchema,
    listMaintenancesSchema,
    maintenanceIdSchema,
    updateMaintenanceSchema,
} from "../validators/maintenanceZod.js";

const maintenanceRouter = express.Router();
maintenanceRouter.use(verifyToken);

maintenanceRouter
    .route("/")
    .get(validate(listMaintenancesSchema), getMaintenancesController)
    .post(validate(createMaintenanceSchema), createMaintenanceController);

maintenanceRouter
    .route("/:id")
    .patch(validate(updateMaintenanceSchema), updateMaintenanceController)
    .delete(validate(maintenanceIdSchema), deleteMaintenanceController);

export default maintenanceRouter;

