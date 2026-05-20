import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { io } from "../socket/index.js";
import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";

export const createConversation = async (req, res) => {
  try {
    const { type, name, memberIds } = req.body;
    const userId = req.user._id;

    if (
      !type ||
      (type === "group" && !name) ||
      !memberIds ||
      !Array.isArray(memberIds) ||
      memberIds.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Tên nhóm và danh sách thành viên là bắt buộc" });
    }

    let conversation;

    if (type === "direct") { //check xem da co cuoc tro chuyen truc tiep giua 2 nguoi chua, neu chua thi tao moi, neu co roi thi tra ve cuoc do
      const participantId = memberIds[0];

      conversation = await Conversation.findOne({
        type: "direct",
        "participants.userId": { $all: [userId, participantId] },
      });

      if (!conversation) {
        conversation = new Conversation({
          type: "direct",
          participants: [{ userId }, { userId: participantId }],
          lastMessageAt: new Date(),
        });

        await conversation.save();
      }
    }

    if (type === "group") {//doi voi cuoc tro chuyen nhom thi chi can tao moi, khong can check
      conversation = new Conversation({
        type: "group",
        participants: [{ userId }, ...memberIds.map((id) => ({ userId: id }))],
        group: {
          name,
          createdBy: userId,
        },
        lastMessageAt: new Date(),
      });

      await conversation.save();
    }

    if (!conversation) {
      return res.status(400).json({ message: "Conversation type không hợp lệ" });
    }

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl blockedUsers" },
      {
        path: "seenBy",
        select: "displayName avatarUrl",
      },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" },
    ]);

    const participants = (conversation.participants || []).map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      blockedUsers: (p.userId?.blockedUsers || []).map((id) => id.toString()),
      joinedAt: p.joinedAt,
    }));

    const formatted = { ...conversation.toObject(), participants };

    if (type === "group") {
      memberIds.forEach((userId) => {
        io.to(userId).emit("new-group", formatted);
      });
    }

    if (type === "direct") {
      io.to(userId).emit("new-group", formatted);
      io.to(memberIds[0]).emit("new-group", formatted);
    }
    return res.status(201).json({ conversation: formatted });
    
  } catch (error) {
    console.error("Lỗi khi tạo conversation", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({
      "participants.userId": userId,
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate({
        path: "participants.userId",
        select: "displayName avatarUrl blockedUsers",
      })
      .populate({
        path: "lastMessage.senderId",
        select: "displayName avatarUrl",
      })
      .populate({
        path: "seenBy",
        select: "displayName avatarUrl",
      });

    const formatted = conversations.map((convo) => { // dinh dang lai cho thong tin de dung
      const participants = (convo.participants || []).map((p) => ({
        _id: p.userId?._id,
        displayName: p.userId?.displayName,
        avatarUrl: p.userId?.avatarUrl ?? null,
        blockedUsers: (p.userId?.blockedUsers || []).map((id) => id.toString()),
        joinedAt: p.joinedAt,
      }));

      return {
        ...convo.toObject(),//chuyen mongo ve objeck
        unreadCounts: convo.unreadCounts || {},
        participants,
      };
    });

    return res.status(200).json({ conversations: formatted });
  } catch (error) {
    console.error("Lỗi xảy ra khi lấy conversations", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, cursor, aroundMessageId } = req.query;

    if (aroundMessageId) {
      const targetMsg = await Message.findById(aroundMessageId);
      if (!targetMsg) {
        return res.status(404).json({ message: "Không tìm thấy tin nhắn gốc" });
      }

      // Lấy 15 tin nhắn cũ hơn (bao gồm tin nhắn targetMsg)
      const olderMessages = await Message.find({
        conversationId,
        createdAt: { $lte: targetMsg.createdAt },
      })
        .sort({ createdAt: -1 })
        .limit(15)
        .populate("replyTo", "content senderId");

      // Lấy 15 tin nhắn mới hơn
      const newerMessages = await Message.find({
        conversationId,
        createdAt: { $gt: targetMsg.createdAt },
      })
        .sort({ createdAt: 1 })
        .limit(15)
        .populate("replyTo", "content senderId");

      // Ghép lại và sắp xếp theo trình tự thời gian (từ cũ đến mới)
      const merged = [...olderMessages.reverse(), ...newerMessages];
      merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // Xác định nextCursor cho việc tải các tin nhắn cũ hơn
      let nextCursor = null;
      if (merged.length > 0) {
        const oldestMsg = merged[0];
        const hasOlder = await Message.exists({
          conversationId,
          createdAt: { $lt: oldestMsg.createdAt },
        });
        if (hasOlder) {
          nextCursor = oldestMsg.createdAt.toISOString();
        }
      }

      return res.status(200).json({
        messages: merged,
        nextCursor,
      });
    }

    const query = { conversationId }; //doi tuong query

    if (cursor) {//neu dang load tn cu thi can lay tn cu hon
      query.createdAt = { $lt: new Date(cursor) };//lt nho hon
    }

    let messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) + 1) //lay them 1 tn de biet co tn tiep theo hay khong
      .populate("replyTo", "content senderId");

    let nextCursor = null;

    if (messages.length > Number(limit)) {//neu co tn tiep theo thi lay ngay tao cua tn cuoi cung lam cursor cho lan load tiep theo
      const nextMessage = messages[messages.length - 1];
      nextCursor = nextMessage.createdAt.toISOString(); //danh dau vi tri phan trang tiep theo
      messages.pop();
    }

    messages = messages.reverse(); //dao nguoc thu tu de tin moi nhat nam o cuoi thi ms dung thu tu

    return res.status(200).json({
      messages,
      nextCursor,
    });
  } catch (error) {
    console.error("Lỗi xảy ra khi lấy messages", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getUserConversationsForSocketIO = async (userId) => {
  try {
    const conversations = await Conversation.find(
      { "participants.userId": userId },
      { _id: 1 },
    );

    return conversations.map((c) => c._id.toString());
  } catch (error) {
    console.error("Lỗi khi fetch conversations: ", error);
    return [];
  }
};

export const markAsSeen = async (req, res) => { 
  try {
    const { conversationId } = req.params;
    const userId = req.user._id.toString();

    const conversation = await Conversation.findById(conversationId).lean();

    if (!conversation) {
      return res.status(404).json({ message: "Conversation không tồn tại" });
    }

    const last = conversation.lastMessage;

    if (!last) {
      return res.status(200).json({ message: "Không có tin nhắn để mark as seen" });
    }

    if (last.senderId.toString() === userId) {
      return res.status(200).json({ message: "Sender không cần mark as seen" });
    }

    const updated = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $addToSet: { seenBy: userId }, //thêm user này vào danh sách seenBy
        $set: { [`unreadCounts.${userId}`]: 0 },//reset số lượng tin nhắn chưa đọc của user này về 0
      },
      {
        new: true,
      },
    );

    io.to(conversationId).emit("read-message", {
      conversation: updated,
      lastMessage: {
        _id: updated?.lastMessage._id,
        content: updated?.lastMessage.content,
        createdAt: updated?.lastMessage.createdAt,
        sender: {
          _id: updated?.lastMessage.senderId,
        },
      },
    });

    return res.status(200).json({
      message: "Marked as seen",
      seenBy: updated?.sennBy || [],
      myUnreadCount: updated?.unreadCounts[userId] || 0,
    });
  } catch (error) {
    console.error("Lỗi khi mark as seen", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const addMembers = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { memberIds } = req.body;
    const userId = req.user._id;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: "Danh sách thành viên không hợp lệ" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy cuộc hội thoại" });
    }

    if (conversation.type !== "group") {
      return res.status(400).json({ message: "Cuộc hội thoại không phải là nhóm" });
    }

    // Kiểm tra xem người yêu cầu có trong nhóm không
    const isMember = conversation.participants.some(p => p.userId.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "Bạn không phải thành viên nhóm này" });
    }

    const addedUserIds = [];
    for (const memberId of memberIds) {
      const exists = conversation.participants.some(p => p.userId.toString() === memberId.toString());
      if (!exists) {
        conversation.participants.push({ userId: memberId, joinedAt: new Date() });
        addedUserIds.push(memberId);
      }
    }

    if (addedUserIds.length === 0) {
      return res.status(400).json({ message: "Các thành viên đều đã có trong nhóm" });
    }

    await conversation.save();

    // Populate thông tin
    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      { path: "seenBy", select: "displayName avatarUrl" },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" }
    ]);

    const participants = conversation.participants.map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      joinedAt: p.joinedAt,
    }));

    const formatted = { ...conversation.toObject(), participants };

    // Emit "new-group" đến các thành viên mới để họ cập nhật sidebar
    addedUserIds.forEach((id) => {
      io.to(id.toString()).emit("new-group", formatted);
    });

    // Tạo tin nhắn hệ thống
    const adminUser = participants.find(p => p._id.toString() === userId.toString());
    const adminName = adminUser ? adminUser.displayName : "Ai đó";

    for (const id of addedUserIds) {
      const addedUser = participants.find(p => p._id.toString() === id.toString());
      const addedName = addedUser ? addedUser.displayName : "Thành viên mới";
      const systemContent = `${adminName} đã thêm ${addedName} vào nhóm`;

      const systemMessage = await Message.create({
        conversationId,
        senderId: userId,
        type: "system",
        content: systemContent,
      });

      conversation.lastMessage = {
        _id: systemMessage._id,
        content: systemContent,
        senderId: userId,
        createdAt: systemMessage.createdAt,
      };
      conversation.lastMessageAt = systemMessage.createdAt;
      await conversation.save();

      io.to(conversationId).emit("new-message", {
        message: systemMessage,
        conversation: {
          ...formatted,
          lastMessage: {
            _id: systemMessage._id,
            content: systemContent,
            createdAt: systemMessage.createdAt,
            sender: {
              _id: userId,
              displayName: adminName,
              avatarUrl: adminUser?.avatarUrl || null,
            }
          }
        },
        unreadCounts: formatted.unreadCounts,
      });
    }

    io.to(conversationId).emit("group-updated", formatted);

    return res.status(200).json({ conversation: formatted });
  } catch (error) {
    console.error("Lỗi khi thêm thành viên nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;
    const adminId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy cuộc hội thoại" });
    }

    if (conversation.type !== "group") {
      return res.status(400).json({ message: "Cuộc hội thoại không phải là nhóm" });
    }

    // Kiểm tra quyền Trưởng nhóm
    if (conversation.group.createdBy.toString() !== adminId.toString()) {
      return res.status(403).json({ message: "Chỉ trưởng nhóm mới có quyền xoá thành viên" });
    }

    if (userId.toString() === adminId.toString()) {
      return res.status(400).json({ message: "Trưởng nhóm không thể tự xoá chính mình" });
    }

    // Check xem user có trong nhóm không
    const isMember = conversation.participants.some(p => p.userId.toString() === userId.toString());
    if (!isMember) {
      return res.status(400).json({ message: "Thành viên này không có trong nhóm" });
    }

    // Lấy thông tin hiển thị trước khi xoá để làm tin nhắn hệ thống
    await conversation.populate({ path: "participants.userId", select: "displayName avatarUrl" });
    const participantToRemove = conversation.participants.find(p => p.userId._id.toString() === userId.toString());
    const kickedName = participantToRemove ? participantToRemove.userId.displayName : "Thành viên";

    const adminParticipant = conversation.participants.find(p => p.userId._id.toString() === adminId.toString());
    const adminName = adminParticipant ? adminParticipant.userId.displayName : "Trưởng nhóm";

    // Xoá thành viên
    conversation.participants = conversation.participants.filter(p => p.userId._id.toString() !== userId.toString());
    if (conversation.unreadCounts) {
      conversation.unreadCounts.delete(userId.toString());
    }

    await conversation.save();

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      { path: "seenBy", select: "displayName avatarUrl" },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" }
    ]);

    const participants = conversation.participants.map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      joinedAt: p.joinedAt,
    }));

    const formatted = { ...conversation.toObject(), participants };

    // Emit tín hiệu cho thành viên bị xoá để xoá cuộc hội thoại khỏi giao diện của họ
    io.to(userId.toString()).emit("removed-from-group", { conversationId });

    // Tạo tin nhắn hệ thống thông báo xoá
    const systemContent = `${adminName} đã mời ${kickedName} ra khỏi nhóm`;
    const systemMessage = await Message.create({
      conversationId,
      senderId: adminId,
      type: "system",
      content: systemContent,
    });

    conversation.lastMessage = {
      _id: systemMessage._id,
      content: systemContent,
      senderId: adminId,
      createdAt: systemMessage.createdAt,
    };
    conversation.lastMessageAt = systemMessage.createdAt;
    await conversation.save();

    io.to(conversationId).emit("new-message", {
      message: systemMessage,
      conversation: {
        ...formatted,
        lastMessage: {
          _id: systemMessage._id,
          content: systemContent,
          createdAt: systemMessage.createdAt,
          sender: {
            _id: adminId,
            displayName: adminName,
            avatarUrl: adminParticipant?.userId.avatarUrl || null,
          }
        }
      },
      unreadCounts: formatted.unreadCounts,
    });

    io.to(conversationId).emit("group-updated", formatted);

    return res.status(200).json({ conversation: formatted });
  } catch (error) {
    console.error("Lỗi khi xoá thành viên nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy cuộc hội thoại" });
    }

    if (conversation.type !== "group") {
      return res.status(400).json({ message: "Cuộc hội thoại không phải là nhóm" });
    }

    const isMember = conversation.participants.some(p => p.userId.toString() === userId.toString());
    if (!isMember) {
      return res.status(400).json({ message: "Bạn không phải thành viên nhóm này" });
    }

    // Populate trước khi xoá
    await conversation.populate({ path: "participants.userId", select: "displayName avatarUrl" });
    const userParticipant = conversation.participants.find(p => p.userId._id.toString() === userId.toString());
    const userName = userParticipant ? userParticipant.userId.displayName : "Thành viên";

    // Xoá thành viên khỏi nhóm
    conversation.participants = conversation.participants.filter(p => p.userId._id.toString() !== userId.toString());
    if (conversation.unreadCounts) {
      conversation.unreadCounts.delete(userId.toString());
    }

    // Nếu không còn thành viên nào, xóa nhóm luôn
    if (conversation.participants.length === 0) {
      await Conversation.findByIdAndDelete(conversationId);
      await Message.deleteMany({ conversationId });
      return res.status(200).json({ message: "Đã rời nhóm và xoá nhóm do không còn thành viên" });
    }

    // Nếu người rời đi là Trưởng nhóm, chỉ định Trưởng nhóm mới
    if (conversation.group.createdBy.toString() === userId.toString()) {
      const newCreator = conversation.participants[0].userId._id;
      conversation.group.createdBy = newCreator;
    }

    await conversation.save();

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      { path: "seenBy", select: "displayName avatarUrl" },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" }
    ]);

    const participants = conversation.participants.map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      joinedAt: p.joinedAt,
    }));

    const formatted = { ...conversation.toObject(), participants };

    // Tạo tin nhắn hệ thống
    const systemContent = `${userName} đã rời khỏi nhóm`;
    const systemMessage = await Message.create({
      conversationId,
      senderId: userId,
      type: "system",
      content: systemContent,
    });

    conversation.lastMessage = {
      _id: systemMessage._id,
      content: systemContent,
      senderId: userId,
      createdAt: systemMessage.createdAt,
    };
    conversation.lastMessageAt = systemMessage.createdAt;
    await conversation.save();

    io.to(conversationId).emit("new-message", {
      message: systemMessage,
      conversation: {
        ...formatted,
        lastMessage: {
          _id: systemMessage._id,
          content: systemContent,
          createdAt: systemMessage.createdAt,
          sender: {
            _id: userId,
            displayName: userName,
            avatarUrl: userParticipant?.userId.avatarUrl || null,
          }
        }
      },
      unreadCounts: formatted.unreadCounts,
    });

    io.to(conversationId).emit("group-updated", formatted);

    return res.status(200).json({ message: "Đã rời nhóm thành công" });
  } catch (error) {
    console.error("Lỗi khi rời nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateGroupInfo = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { name } = req.body;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy cuộc hội thoại" });
    }

    if (conversation.type !== "group") {
      return res.status(400).json({ message: "Cuộc hội thoại không phải là nhóm" });
    }

    // Chỉ Trưởng nhóm có quyền
    if (conversation.group.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Chỉ trưởng nhóm mới có quyền thay đổi thông tin nhóm" });
    }

    await conversation.populate({ path: "participants.userId", select: "displayName avatarUrl" });
    const userParticipant = conversation.participants.find(p => p.userId._id.toString() === userId.toString());
    const userName = userParticipant ? userParticipant.userId.displayName : "Trưởng nhóm";

    let systemContent = "";

    // Đổi tên nhóm
    if (name && name.trim() !== conversation.group.name) {
      systemContent = `${userName} đã đổi tên nhóm thành "${name.trim()}"`;
      conversation.group.name = name.trim();
    }

    // Đổi ảnh đại diện nhóm
    if (req.file) {
      const uploadResult = await uploadImageFromBuffer(req.file.buffer, {
        folder: "arina_chat/groups",
        transformation: [{ width: 250, height: 250, crop: "fill" }],
      });
      conversation.group.avatarUrl = uploadResult.secure_url;
      const avatarSystem = `${userName} đã thay đổi ảnh đại diện nhóm`;
      systemContent = systemContent ? `${systemContent} và ${avatarSystem.toLowerCase()}` : avatarSystem;
    }

    if (!systemContent) {
      return res.status(400).json({ message: "Không có thông tin thay đổi" });
    }

    await conversation.save();

    await conversation.populate([
      { path: "participants.userId", select: "displayName avatarUrl" },
      { path: "seenBy", select: "displayName avatarUrl" },
      { path: "lastMessage.senderId", select: "displayName avatarUrl" }
    ]);

    const participants = conversation.participants.map((p) => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      joinedAt: p.joinedAt,
    }));

    const formatted = { ...conversation.toObject(), participants };

    // Tạo tin nhắn hệ thống
    const systemMessage = await Message.create({
      conversationId,
      senderId: userId,
      type: "system",
      content: systemContent,
    });

    conversation.lastMessage = {
      _id: systemMessage._id,
      content: systemContent,
      senderId: userId,
      createdAt: systemMessage.createdAt,
    };
    conversation.lastMessageAt = systemMessage.createdAt;
    await conversation.save();

    io.to(conversationId).emit("new-message", {
      message: systemMessage,
      conversation: {
        ...formatted,
        lastMessage: {
          _id: systemMessage._id,
          content: systemContent,
          createdAt: systemMessage.createdAt,
          sender: {
            _id: userId,
            displayName: userName,
            avatarUrl: userParticipant?.userId.avatarUrl || null,
          }
        }
      },
      unreadCounts: formatted.unreadCounts,
    });

    io.to(conversationId).emit("group-updated", formatted);

    return res.status(200).json({ conversation: formatted });
  } catch (error) {
    console.error("Lỗi khi cập nhật thông tin nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getMutualGroups = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { targetUserId } = req.params;

    const groups = await Conversation.find({
      type: "group",
      "participants.userId": { $all: [currentUserId, targetUserId] }
    })
      .populate("participants.userId", "_id displayName avatarUrl username")
      .lean();

    return res.status(200).json({ groups });
  } catch (error) {
    console.error("Lỗi khi tìm nhóm chung:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi tìm nhóm chung" });
  }
};