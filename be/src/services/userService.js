import ApiError from "../exceptions/ApiError.js";
import User from "../models/User.js";
import { hashPassword } from "../utils/password.js";

const toPublicUser = (user) => ({
    id: user._id,
    username: user.username,
    fullName: user.fullName,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});

const getUserOrThrow = async (id) => {
    const user = await User.findById(id);
    if (!user) throw new ApiError(404, "Không tìm thấy user.");
    return user;
};

const ensureUsernameAvailable = async (username, exceptId) => {
    const query = { username: username.trim().toLowerCase() };
    if (exceptId) query._id = { $ne: exceptId };
    if (await User.exists(query)) throw new ApiError(409, "Username đã được sử dụng.");
};

const handleDuplicateUsername = (error) => {
    if (error?.code === 11000) throw new ApiError(409, "Username đã được sử dụng.");
    throw error;
};

export const createUser = async ({ fullName, username, password }) => {
    const normalizedUsername = username.trim().toLowerCase();
    await ensureUsernameAvailable(normalizedUsername);

    try {
        const user = await User.create({
            fullName,
            username: normalizedUsername,
            password: await hashPassword(password),
        });
        return toPublicUser(user);
    } catch (error) {
        return handleDuplicateUsername(error);
    }
};

export const listUsers = async () => {
    const users = await User.find().sort({ createdAt: -1 });
    return users.map(toPublicUser);
};

export const getUserById = async (id) => toPublicUser(await getUserOrThrow(id));

export const updateUser = async (id, updates) => {
    const user = await getUserOrThrow(id);

    if (updates.username !== undefined) {
        updates.username = updates.username.trim().toLowerCase();
        await ensureUsernameAvailable(updates.username, user._id);
    }
    if (updates.password !== undefined) updates.password = await hashPassword(updates.password);

    Object.assign(user, updates);
    try {
        await user.save();
    } catch (error) {
        return handleDuplicateUsername(error);
    }
    return toPublicUser(user);
};

export const deactivateUser = async (id) => {
    const user = await getUserOrThrow(id);
    user.isActive = false;
    await user.save();
    return toPublicUser(user);
};
