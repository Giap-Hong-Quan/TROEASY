// import User from "../models/User.js";
// import { verifyAccessToken } from "../utils/jwt.js";

// /**
//  * 1. Middleware Xác thực (Authentication)
//  * Kiểm tra Token hợp lệ, tài khoản tồn tại và đang hoạt động
//  */
// export const verifyToken = async (req, res, next) => {
//     try {
//         const authHeader = req.headers.authorization;
//         if (!authHeader || !authHeader.startsWith("Bearer ")) {
//             return res.status(401).json({ message: "Vui lòng đăng nhập để thực hiện chức năng này" });
//         }
//         const token = authHeader.split(" ")[1];
//         const decoded = verifyAccessToken(token);
//         // Lấy thông tin user từ DB & Populate role
//         const user = await User.findById(decoded.id)
//             .select("-password")
//             .populate("role", "name");
//         if (!user) {
//             return res.status(401).json({ message: "Tài khoản không tồn tại" });
//         }
//         // Kiểm tra tài khoản có bị khóa hoặc đã bị xóa hay không
//         if (user.isActive === false || (user.deletedAt && user.deletedAt !== null)) {
//             return res.status(401).json({ message: "Tài khoản của bạn đã bị khóa hoặc không còn hoạt động" });
//         }
//         // Gán thông tin user vào request
//         req.user = user;
//         next();
//     } catch (error) {
//         return res.status(401).json({ message: error.message || "Token không hợp lệ hoặc đã hết hạn" });
//     }
// };

// /**
//  * 2. Middleware Phân quyền (Authorization - RBAC)
//  * Dùng cho các route yêu cầu role cụ thể: authorizeRoles('admin'), authorizeRoles('staff', 'admin')
//  */
// export const authorizeRoles = (...allowedRoles) => {
//     return (req, res, next) => {
//         if (!req.user || !req.user.role) {
//             return res.status(403).json({ message: "Không tìm thấy thông tin quyền truy cập" });
//         }

//         // Lấy tên role (xử lý cả trường hợp role là string hoặc object đã populate)
//         const userRoleName = typeof req.user.role === "object" ? req.user.role.name : req.user.role;

//         if (!allowedRoles.includes(userRoleName)) {
//             return res.status(403).json({ 
//                 message: `Quyền '${userRoleName}' không có quyền truy cập tài nguyên này` 
//             });
//         }

//         next();
//     };
// };

// /**
//  * Middleware tiện ích dành riêng cho Admin (Hỗ trợ tương thích ngược)
//  */
// export const verifyTokenAdmin = [verifyToken, authorizeRoles("admin")];