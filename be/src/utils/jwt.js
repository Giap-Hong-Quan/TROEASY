import jwt from "jsonwebtoken"

const getSecret = (name) => {
    const secret = process.env[name];
    if (!secret) throw new Error(`${name} chưa được cấu hình.`);
    return secret;
};

export const accessToken = (payload) => {
    return jwt.sign(payload, getSecret("JWT_ACCESS_SECRET"), { expiresIn: "1d", algorithm: "HS256" });
}
export const verifyAccessToken = (token) => {
    return jwt.verify(token, getSecret("JWT_ACCESS_SECRET"), { algorithms: ["HS256"] });
}
export const refreshToken = (payload) => {
    return jwt.sign(payload, getSecret("JWT_REFRESH_SECRET"), { expiresIn: "7d", algorithm: "HS256" });
}
export const verifyRefreshToken = (token) => {
    return jwt.verify(token, getSecret("JWT_REFRESH_SECRET"), { algorithms: ["HS256"] });
}
