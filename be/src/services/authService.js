import ApiError from "../exceptions/ApiError.js";
import User from "../models/User.js";
import { accessToken } from "../utils/jwt.js";
import { comparePassword } from "../utils/password.js";

const toPublicUser = (user) => ({
    id: user._id,
    username: user.username,
    fullName: user.fullName,
});

export const loginUser = async ({ username, password }) => {
    const user = await User.findOne({ username: username.trim().toLowerCase() }).select("+password");

    if (!user || !user.isActive || !(await comparePassword(password, user.password))) {
        throw new ApiError(401, "Username hoặc mật khẩu không đúng.");
    }

    return {
        accessToken: accessToken({ sub: user._id.toString() }),
        user: toPublicUser(user),
    };
};
