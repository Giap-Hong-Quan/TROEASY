import { loginUser } from "../services/authService.js";
import { success } from "../utils/success.js";

const publicUser = (user) => ({
    id: user._id,
    username: user.username,
    fullName: user.fullName,
});

export const login = async (req, res, next) => {
    try {
        const data = await loginUser(req.body);
        return success(res, data, "Đăng nhập thành công.", 200);
    } catch (error) {
        return next(error);
    }
};

export const getMe = (req, res) => success(
    res,
    { user: publicUser(req.user) },
    "Lấy thông tin tài khoản thành công.",
    200,
);
