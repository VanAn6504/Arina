import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import {
  emitNewMessage,
  updateConversationAfterCreateMessage,
  emitMessageDeleted,
  emitMessageEdited,
  emitMessageReacted,
} from "../utils/messageHelper.js";
import { io } from "../socket/index.js";

export const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId, content, conversationId, replyTo } = req.body;
    const senderId = req.user._id;

    let conversation;

    if (!content) {
      return res.status(400).json({ message: "Thiếu nội dung" });
    }

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
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
      content,
      replyTo: replyTo || null,
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
    const { conversationId, content, replyTo } = req.body;
    const senderId = req.user._id;
    const conversation = req.conversation;

    if (!content) {
      return res.status(400).json("Thiếu nội dung");
    }

    const message = await Message.create({
      conversationId,
      senderId,
      content,
      replyTo: replyTo || null,
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
