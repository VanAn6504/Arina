import User from "../models/User.js";
import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";

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

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id; 

    const { displayName, phoneNumber, bio } = req.body;

    const updateFields = {};
    if (displayName) updateFields.displayName = displayName;
    if (phoneNumber !== undefined) updateFields.phoneNumber = phoneNumber;
    if (bio !== undefined) updateFields.bio = bio;

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