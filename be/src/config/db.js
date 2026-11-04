import mongoose from "mongoose";

const connectDB = async () => {
    try {
        console.log("Đang kết nối MongoDB Atlas...");
        const connect = await mongoose.connect(process.env.MONGODBATLAS);
        console.log("Kết nối MongoDB thành công!");
    } catch (error) {
        console.error("Lỗi kết nối MongoDB:", error.message || error);
    }
};
export default connectDB