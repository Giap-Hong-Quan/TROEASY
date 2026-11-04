import bcrypt from "bcrypt";
import User from "../models/User.js";
import { accessToken } from "../utils/jwt.js";

const publicUser = (user) => ({
    id: user._id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    areaId: user.areaId,
});

export const login = async (req, res, next) => {
    try {
        const username = req.body.username.toLowerCase();
        const user = await User.findOne({ username }).select("+password");

        if (!user || !user.isActive || !(await bcrypt.compare(req.body.password, user.password))) {
            return res.status(401).json({ success: false, message: "Username hoặc mật khẩu không đúng." });
        }

        return res.status(200).json({
            success: true,
            message: "Đăng nhập thành công.",
            data: {
                accessToken: accessToken({ sub: user._id.toString() }),
                user: publicUser(user),
            },
        });
    } catch (error) {
        return next(error);
    }
};

export const getMe = (req, res) => res.status(200).json({
    success: true,
    data: { user: publicUser(req.user) },
});
