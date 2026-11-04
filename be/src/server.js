import dotenv from "dotenv";
import "colors";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import connectDB from "./config/db.js";
import swaggerDocs from "./config/swagger.js";
import { errorHandle } from "./middlewares/errorMiddleware.js";
import router from "./routes/index.js";
import Logger from "./utils/logging.js";

dotenv.config();
const app = express();
const port = Number(process.env.PORT) || 9000;

app.use(cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware bắt log HTTP request có màu chuẩn app.apis
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const logMsg = `${ip}: ${req.method.toUpperCase()} ${req.originalUrl} --> ${statusCode} (${duration}ms)`;

        if (statusCode <= 304) {
            Logger.info(logMsg.green);
        } else {
            Logger.error(logMsg.red);
        }
    });
    next();
});

app.use('/api',router);
app.get("/", (_req, res) => {
    res.json({ success: true, message: "Troeasy API is running" });
});

swaggerDocs(app);
app.use(errorHandle);

const startServer = async () => {
    await connectDB();
    app.listen(port, () => {
        console.log(`Troeasy API listening at http://localhost:${port}`);
    });
};

startServer();

export default app;
