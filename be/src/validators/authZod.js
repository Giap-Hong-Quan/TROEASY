import { z } from "zod";

export const loginSchema = z.object({
    body: z.object({
        username: z.string().trim().min(1, "Vui lòng nhập username."),
        password: z.string().min(1, "Vui lòng nhập mật khẩu."),
    }).strict(),
});
