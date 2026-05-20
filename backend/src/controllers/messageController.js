import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import path from "path";
import {
  emitNewMessage,
  updateConversationAfterCreateMessage,
  emitMessageDeleted,
  emitMessageEdited,
  emitMessageReacted,
} from "../utils/messageHelper.js";
import { io } from "../socket/index.js";
import { uploadFileFromBuffer } from "../middlewares/uploadMiddleware.js";

export const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId, content, conversationId, replyTo, type, imgUrl, fileUrl } = req.body;
    const senderId = req.user._id;

    let conversation;

    if (!content && !imgUrl && !fileUrl) {
      return res.status(400).json({ message: "Thiếu nội dung tin nhắn" });
    }

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }

    // Tìm recipientId
    let finalRecipientId = recipientId;
    if (!finalRecipientId && conversation) {
      const other = conversation.participants.find(p => p.userId.toString() !== senderId.toString());
      if (other) finalRecipientId = other.userId.toString();
    }

    if (finalRecipientId) {
      const [senderUser, recipientUser] = await Promise.all([
        User.findById(senderId),
        User.findById(finalRecipientId),
      ]);

      if (senderUser && recipientUser) {
        if (senderUser.blockedUsers.includes(finalRecipientId)) {
          return res.status(403).json({ message: "Bạn đã chặn người dùng này. Vui lòng bỏ chặn để gửi tin nhắn." });
        }
        if (recipientUser.blockedUsers.includes(senderId)) {
          return res.status(403).json({ message: "Bạn không thể gửi tin nhắn cho người dùng này." });
        }
      }
    }

    if (!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        participants: [
          { userId: senderId, joinedAt: new Date() },
          { userId: recipientId, joinedAt: new Date() },
        ],
        lastMessageAt: new Date(),
        unreadCounts: new Map(),
      });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      content: content || "",
      replyTo: replyTo || null,
      type: type || "text",
      imgUrl: imgUrl || "",
      fileUrl: fileUrl || "",
    });

    await message.populate("replyTo", "content senderId");

    updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();

    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn trực tiếp", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { conversationId, content, replyTo, type, imgUrl, fileUrl } = req.body;
    const senderId = req.user._id;
    const conversation = req.conversation;

    if (!content && !imgUrl && !fileUrl) {
      return res.status(400).json("Thiếu nội dung");
    }

    const message = await Message.create({
      conversationId,
      senderId,
      content: content || "",
      replyTo: replyTo || null,
      type: type || "text",
      imgUrl: imgUrl || "",
      fileUrl: fileUrl || "",
    });

    await message.populate("replyTo", "content senderId");

    updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();
    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const senderId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
    if (message.senderId.toString() !== senderId.toString()) {
      return res.status(403).json({ message: "Không có quyền thu hồi tin nhắn này" });
    }

    message.isDeleted = true;
    message.content = "Tin nhắn đã bị thu hồi";
    await message.save();

    emitMessageDeleted(io, message.conversationId, message._id);

    return res.status(200).json({ message: "Đã thu hồi tin nhắn", data: message });
  } catch (error) {
    console.error("Lỗi khi thu hồi tin nhắn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const senderId = req.user._id;

    if (!content) return res.status(400).json({ message: "Thiếu nội dung" });

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
    if (message.isDeleted) return res.status(400).json({ message: "Không thể sửa tin nhắn đã bị thu hồi" });
    if (message.senderId.toString() !== senderId.toString()) {
      return res.status(403).json({ message: "Không có quyền sửa tin nhắn này" });
    }

    message.content = content;
    message.isEdited = true;
    await message.save();

    emitMessageEdited(io, message.conversationId, message);

    return res.status(200).json({ message: "Đã sửa tin nhắn", data: message });
  } catch (error) {
    console.error("Lỗi khi sửa tin nhắn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const reactMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) return res.status(400).json({ message: "Thiếu biểu tượng cảm xúc" });

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Không tìm thấy tin nhắn" });

    // Kiểm tra xem user đã thả cảm xúc này chưa
    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.userId.toString() === userId.toString()
    );

    if (existingReactionIndex !== -1) {
      if (message.reactions[existingReactionIndex].emoji === emoji) {
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        message.reactions[existingReactionIndex].emoji = emoji;
      }
    } else {
      message.reactions.push({ userId, emoji });
    }

    await message.save();

    emitMessageReacted(io, message.conversationId, message._id, message.reactions);

    return res.status(200).json({ message: "Đã thả cảm xúc", data: message });
  } catch (error) {
    console.error("Lỗi khi thả cảm xúc", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const uploadFile = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "Không tìm thấy tệp tải lên" });
    }

    // Xác định resource type của Cloudinary (image hoặc raw)
    let resourceType = "raw";
    let fileType = "file";
    if (file.mimetype.startsWith("image/")) {
      resourceType = "image";
      fileType = "image";
    }

    const originalName = file.originalname;
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const safeBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, "_");
    const uniqueId = `${safeBaseName}_${Date.now()}`;

    const options = {};
    if (resourceType === "raw") {
      options.public_id = `${uniqueId}${ext}`;
    } else {
      options.public_id = uniqueId;
    }

    // Upload lên Cloudinary
    const uploadResult = await uploadFileFromBuffer(file.buffer, resourceType, options);

    return res.status(200).json({
      url: uploadResult.secure_url,
      name: originalName,
      size: file.size,
      type: fileType,
    });
  } catch (error) {
    console.error("Lỗi khi tải tệp lên Cloudinary", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi tải tệp" });
  }
};

const makeVietnameseRegex = (keyword) => {
  if (!keyword) return "";
  const map = {
    a: "[aàáảãạăằắẳẵặâầấẩẫậ]",
    d: "[dđ]",
    e: "[eèéẻẽẹêềếểễệ]",
    i: "[iìíỉĩị]",
    o: "[oòóỏõọôồốổỗộơờớởỡợ]",
    u: "[uùúủũụưừứửữự]",
    y: "[yỳýỷỹỵ]",
  };

  let regexStr = "";
  for (const char of keyword.toLowerCase()) {
    if (map[char]) {
      regexStr += map[char];
    } else {
      regexStr += char.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    }
  }
  return new RegExp(regexStr, "i");
};

export const searchMessages = async (req, res) => {
  try {
    const { keyword, conversationId } = req.query;
    const userId = req.user._id;

    if (!keyword || keyword.trim() === "") {
      return res.status(200).json({ messages: [] });
    }

    let convoIds = [];
    if (conversationId) {
      convoIds = [conversationId];
    } else {
      // 1. Tìm tất cả các cuộc hội thoại mà user là participant
      const conversations = await Conversation.find({
        "participants.userId": userId,
      }).select("_id");
      convoIds = conversations.map((c) => c._id);
    }

    // 2. Tìm kiếm tin nhắn khớp keyword trong các cuộc hội thoại đó
    const regex = makeVietnameseRegex(keyword);
    const messages = await Message.find({
      conversationId: { $in: convoIds },
      type: { $in: ["text", "file"] },
      isDeleted: false,
      content: { $regex: regex },
    })
      .populate("senderId", "displayName avatarUrl")
      .populate({
        path: "conversationId",
        populate: {
          path: "participants.userId",
          select: "displayName avatarUrl",
        },
      })
      .sort({ createdAt: -1 })
      .limit(100);

    // 3. Định dạng lại kết quả để trả về kèm thông tin phòng chat
    const formatted = messages
      .filter((m) => m.conversationId)
      .map((m) => {
        const convo = m.conversationId;
        let convoName = "";
        let convoAvatar = "";

        if (convo.type === "direct") {
          const otherParticipant = convo.participants.find(
            (p) => p.userId && p.userId._id.toString() !== userId.toString()
          );
          convoName = otherParticipant?.userId?.displayName || "Người dùng";
          convoAvatar = otherParticipant?.userId?.avatarUrl || "";
        } else {
          convoName = convo.group?.name || "Nhóm trò chuyện";
          convoAvatar = convo.group?.avatarUrl || "";
        }

        return {
          _id: m._id,
          content: m.content,
          type: m.type,
          fileUrl: m.fileUrl,
          createdAt: m.createdAt,
          sender: {
            _id: m.senderId?._id || "",
            displayName: m.senderId?.displayName || "Thành viên",
            avatarUrl: m.senderId?.avatarUrl || "",
          },
          conversation: {
            _id: convo._id,
            name: convoName,
            avatarUrl: convoAvatar,
            type: convo.type,
          },
        };
      });

    return res.status(200).json({ messages: formatted });
  } catch (error) {
    console.error("Lỗi xảy ra khi tìm kiếm tin nhắn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
