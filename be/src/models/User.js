import mongoose from "mongoose";

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
        isActive: {
            type: Boolean,
            default: true,
        },
        
    },
    { timestamps: true },
);

userSchema.index({ username: 1 }, { unique: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
