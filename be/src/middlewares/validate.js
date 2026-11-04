// src/middlewares/validate.js
import ApiError from "../exceptions/ApiError.js";

export const validate = (schema) => (req, res, next) => {
    try {
        const parsed = schema.parse({
            body: req.body,
            params: req.params,
            query: req.query,
        });
        if (parsed.body) req.body = parsed.body;
        if (parsed.query) {
            Object.defineProperty(req, "query", {
                value: parsed.query,
                writable: true,
                enumerable: true,
                configurable: true,
            });
        }
        if (parsed.params) {
            Object.defineProperty(req, "params", {
                value: parsed.params,
                writable: true,
                enumerable: true,
                configurable: true,
            });
        }

        next();
    } catch (error) {
        if (error?.issues?.length || error?.errors?.length) {
            const firstErrorMessage =
                error.issues?.[0]?.message ||
                error.errors?.[0]?.message ||
                "Dữ liệu không hợp lệ";
            return next(new ApiError(400, firstErrorMessage));
        }
        next(error);
    }
};
