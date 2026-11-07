import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import User from "../models/User.js";
import { hashPassword } from "../utils/password.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(currentDir, "../../.env") });

await mongoose.connect(process.env.MONGODBATLAS);

await User.create({
    username: "admin",
    password: await hashPassword("admin"),
});

console.log("Đã tạo tài khoản admin.");
await mongoose.disconnect();
