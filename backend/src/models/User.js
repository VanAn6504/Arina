import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String, default: "" // link CDN để hiển thị hình
    },
    avatarId: {
      type: String, default: "" // Cloudinary public_id để xoá hình
    },
    bio: {
      type: String,
      maxlength: 500, default: "" 
    },
    phone: {
      type: String,
      sparse: true, 
      unique: true, // Thêm unique để sparse phát huy tác dụng
    },
    isOnline: { 
      type: Boolean, 
      default: false 
    },
    lastActiveAt: { 
      type: Date, 
      default: Date.now 
    },
    fcmTokens: [
      { type: String } // Lưu token thiết bị để gửi Push Notification
    ], 
    blockedUsers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" } // Danh sách user bị chặn
    ]
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;