import User from "../models/User.js";
import Friend from "../models/Friend.js";
import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";
import { broadcastOnlineUsers, io } from "../socket/index.js";

export const authMe = async (req, res) => {
  try {
    const user = req.user; 

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Lỗi khi gọi authMe", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const searchUserByUsername = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || username.trim() === "") {
      return res.status(400).json({ message: "Cần cung cấp username trong query." });
    }

    const user = await User.findOne({ username }).select(
      "_id displayName username avatarUrl"
    );

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi xảy ra khi searchUserByUsername", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const uploadAvatar = async (req, res) => {
   try {
    const file = req.file;
    const userId = req.user._id;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await uploadImageFromBuffer(file.buffer);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        avatarUrl: result.secure_url,
        avatarId: result.public_id,
      },
      {
        new: true,
      }
    ).select("avatarUrl");

    if (!updatedUser.avatarUrl) {
      return res.status(400).json({ message: "Avatar trả về null" });
    }

    return res.status(200).json({ avatarUrl: updatedUser.avatarUrl });
  } catch (error) {
    console.error("Lỗi xảy ra khi upload avatar", error);
    return res.status(500).json({ message: "Upload failed" });
  }
}

import bcrypt from "bcrypt";

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id; 

    const { displayName, phoneNumber, bio, showOnline, allowNotifications } = req.body;

    const updateFields = {};
    if (displayName) updateFields.displayName = displayName;
    if (phoneNumber !== undefined) updateFields.phoneNumber = phoneNumber;
    if (bio !== undefined) updateFields.bio = bio;
    if (showOnline !== undefined) updateFields.showOnline = showOnline;
    if (allowNotifications !== undefined) updateFields.allowNotifications = allowNotifications;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateFields,
      { new: true, runValidators: true }
    ).select("-hashedPassword");

    res.status(200).json({
      message: "Cập nhật hồ sơ thành công",
      user: updatedUser
    });

  } catch (error) {
    console.error("Lỗi trong updateProfile:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi cập nhật hồ sơ" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Thiếu mật khẩu cũ hoặc mật khẩu mới." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại." });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.hashedPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu cũ không chính xác." });
    }

    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.hashedPassword = hashedPassword;
    await user.save();

    return res.status(200).json({ message: "Đổi mật khẩu thành công." });
  } catch (error) {
    console.error("Lỗi trong changePassword:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi đổi mật khẩu" });
  }
};

export const blockUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.params;

    if (userId.toString() === targetUserId) {
      return res.status(400).json({ message: "Bạn không thể tự chặn chính mình." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    if (!user.blockedUsers.includes(targetUserId)) {
      user.blockedUsers.push(targetUserId);
      await user.save();
    }

    // Phát lại danh sách online cập nhật trạng thái block
    await broadcastOnlineUsers();

    // Phát sự kiện socket để cập nhật giao diện lập tức cho cả 2 bên
    if (io) {
      io.to(userId.toString()).emit("block-update", { blockerId: userId.toString(), blockedId: targetUserId, isBlocked: true });
      io.to(targetUserId).emit("block-update", { blockerId: userId.toString(), blockedId: targetUserId, isBlocked: true });
    }

    return res.status(200).json({ message: "Đã chặn người dùng này thành công." });
  } catch (error) {
    console.error("Lỗi khi chặn người dùng:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi chặn người dùng" });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== targetUserId);
    await user.save();

    // Phát lại danh sách online cập nhật trạng thái block
    await broadcastOnlineUsers();

    // Phát sự kiện socket để cập nhật giao diện lập tức cho cả 2 bên
    if (io) {
      io.to(userId.toString()).emit("block-update", { blockerId: userId.toString(), blockedId: targetUserId, isBlocked: false });
      io.to(targetUserId).emit("block-update", { blockerId: userId.toString(), blockedId: targetUserId, isBlocked: false });
    }

    return res.status(200).json({ message: "Đã bỏ chặn người dùng này thành công." });
  } catch (error) {
    console.error("Lỗi khi bỏ chặn người dùng:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi bỏ chặn người dùng" });
  }
};

export const getBlockedList = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate("blockedUsers", "_id displayName avatarUrl username").lean();
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    return res.status(200).json({ blockedUsers: user.blockedUsers || [] });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách chặn:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách chặn" });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("_id displayName username avatarUrl bio phoneNumber").lean();
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }
    return res.status(200).json({ user });
  } catch (error) {
    console.error("Lỗi xảy ra khi lấy profile người dùng:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};