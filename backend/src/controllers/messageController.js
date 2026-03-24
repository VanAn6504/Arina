import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import {
  emitNewMessage,
  updateConversationAfterCreateMessage,
} from "../utils/messageHelper.js";
import { io } from "../socket/index.js";

export const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId, content, conversationId } = req.body;
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
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();
    
    // if (!conversation && recipientId) {
    //   conversation = await Conversation.findOne({
    //     type: "direct",
    //     "participants.userId": { $all: [senderId, recipientId] }, // Tìm phòng có ĐỦ mặt 2 người này
    //   });
    // }

    // // 3. Nếu thực sự chưa từng chat -> TẠO MỚI (Chỉ dùng 'new', chưa lưu vội)
    // if (!conversation) {
    //   conversation = new Conversation({
    //     type: "direct",
    //     participants: [
    //       { userId: senderId, joinedAt: new Date() },
    //       { userId: recipientId, joinedAt: new Date() },
    //     ],
    //     lastMessageAt: new Date(),
    //     unreadCounts: new Map(), // Mongoose tự động hiểu đây là Map rỗng
    //   });
    // }

    // // 4. Tạo Object Tin nhắn (Cũng dùng 'new', chưa lưu)
    // const message = new Message({
    //   conversationId: conversation._id, // Lấy ID của conversation ở trên
    //   senderId,
    //   content,
    // });

    // // 5. Cập nhật các thông số (lastMessage, unreadCounts)
    // updateConversationAfterCreateMessage(conversation, message, senderId);

    // // 6. LƯU ĐỒNG THỜI VÀO DB (Tối ưu tốc độ ánh sáng)
    // // Thay vì await 3 lần rời rạc, Promise.all giúp lưu cả 2 bảng cùng 1 lúc
    // await Promise.all([
    //     conversation.save(), 
    //     message.save()
    // ]);

    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn trực tiếp", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user._id;
    const conversation = req.conversation;

    if (!content) {
      return res.status(400).json("Thiếu nội dung");
    }

    const message = await Message.create({
      conversationId,
      senderId,
      content,
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);

    await conversation.save();
    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Lỗi xảy ra khi gửi tin nhắn nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
