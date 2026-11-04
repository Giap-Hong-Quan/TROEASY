import express from "express";
import { getMe, login } from "../controllers/authController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { loginSchema } from "../validators/authZod.js";

const authRouter = express.Router();

authRouter.post("/login", validate(loginSchema), login);
authRouter.get("/me", verifyToken, getMe);

export default authRouter;
