import express from "express";
import {
    bulkUpsertUtilityReadingsController,
    deleteUtilityReadingController,
    getUtilityReadingsController,
    getUtilitySheetController,
    upsertUtilityReadingController,
} from "../controllers/utilityController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
    bulkUpsertUtilityReadingsSchema,
    getUtilitySheetSchema,
    listUtilityReadingsSchema,
    upsertUtilityReadingSchema,
    utilityIdSchema,
} from "../validators/utilityZod.js";

const utilityRouter = express.Router();
utilityRouter.use(verifyToken);

utilityRouter
    .route("/sheet")
    .get(validate(getUtilitySheetSchema), getUtilitySheetController);

utilityRouter
    .route("/bulk")
    .post(
        validate(bulkUpsertUtilityReadingsSchema),
        bulkUpsertUtilityReadingsController,
    );

utilityRouter
    .route("/")
    .get(validate(listUtilityReadingsSchema), getUtilityReadingsController)
    .post(validate(upsertUtilityReadingSchema), upsertUtilityReadingController);

utilityRouter
    .route("/:id")
    .delete(validate(utilityIdSchema), deleteUtilityReadingController);

export default utilityRouter;

