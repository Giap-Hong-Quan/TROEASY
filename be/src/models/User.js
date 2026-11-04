import mongoose from "mongoose";

export const USER_ROLES = Object.freeze({
    OWNER: "owner",
    MANAGER: "manager",
});

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            trim: true,
            maxlength: 120,
        },
        username: {
            type: String,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        role: {
            type: String,
            enum: Object.values(USER_ROLES),
            default: USER_ROLES.MANAGER,
        },
        // Manager được gắn với một khu; owner quản lý toàn bộ và không có areaId.
        areaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Area",
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        
    },
    { timestamps: true },
);

userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ areaId: 1, role: 1 });

userSchema.pre("validate", function validateRoleArea() {
    if (this.role === USER_ROLES.OWNER && this.areaId != null) {
        this.invalidate("areaId", "Owner không được gắn với một khu riêng");
    }
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
