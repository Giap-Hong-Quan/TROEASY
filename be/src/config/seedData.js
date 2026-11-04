import bcrypt from "bcrypt";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import User, { USER_ROLES } from "../models/User.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(currentDir, "../../.env") });

await mongoose.connect(process.env.MONGODBATLAS);

await User.create({
    username: "admin",
    password: await bcrypt.hash("admin", 10),
    role: USER_ROLES.OWNER,
});

console.log("Đã tạo tài khoản admin.");
await mongoose.disconnect();
