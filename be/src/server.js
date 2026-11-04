import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import connectDB from "./config/db.js";
import swaggerDocs from "./config/swagger.js";
import { errorHandle } from "./middleware/errorMiddleware.js";
import router from "./router/index.js";

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

app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on("finish", () => {
        console.log(
            `${req.method} ${req.originalUrl} ${res.statusCode} (${Date.now() - startedAt}ms)`,
        );
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
    // The DB helper reports connection errors itself; the API can still start
    // so routes that do not need MongoDB (health/docs) remain available.
    await connectDB();
    app.listen(port, () => {
        console.log(`Troeasy API listening at http://localhost:${port}`);
    });
};

startServer();

export default app;
