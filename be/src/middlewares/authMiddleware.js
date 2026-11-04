import User from "../models/User.js";
import { verifyAccessToken } from "../utils/jwt.js";

export const verifyToken = async (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Vui lòng đăng nhập." });
    }

    let payload;
    try {
        const token = authorization.slice("Bearer ".length);
        payload = verifyAccessToken(token);
    } catch {
        return res.status(401).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn." });
    }

    if (typeof payload === "string" || !payload.sub) {
        return res.status(401).json({ success: false, message: "Token không hợp lệ." });
    }

    try {
        const user = await User.findById(payload.sub);
        if (!user || !user.isActive) {
            return res.status(401).json({ success: false, message: "Tài khoản không hoạt động." });
        }
        req.user = user;
        return next();
    } catch (error) {
        return next(error);
    }
};

export const requireRoles = (...roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Vui lòng đăng nhập." });
    }
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: "Bạn không có quyền thực hiện thao tác này." });
    }
    return next();
};

export const requireAreaAccess = (paramName = "areaId") => (req, res, next) => {
    if (req.user?.role === "owner") return next();
    if (req.user?.role === "manager" && String(req.user.areaId) === req.params[paramName]) {
        return next();
    }
    return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập khu này." });
};
