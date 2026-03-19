export const updateConversationAfterCreateMessage = (
  conversation,
  message,
  senderId
) => {
  conversation.set({ // update thong tin khi tn dc gui di(reset trang thai da xem)
    seenBy: [],
    lastMessageAt: message.createdAt,
    lastMessage: {
      _id: message._id,
      content: message.content,
      senderId,
      createdAt: message.createdAt,
    },
  });
  // moi lan co tn moi thi resaet tn chua doc cua ng gui =0, ng nhan +1
  conversation.participants.forEach((p) => {

    const memberId = p.userId.toString();

    const isSender = memberId === senderId.toString();
    const prevCount = conversation.unreadCounts.get(memberId) || 0;
    conversation.unreadCounts.set(memberId, isSender ? 0 : prevCount + 1); // ai la ng gui thi issender =0 va prevcout +1
  });
};

export const emitNewMessage = (io, conversation, message) => {
  io.to(conversation._id.toString()).emit("new-message", {
    message,
    conversation: {
      _id: conversation._id,
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
    },
    unreadCounts: conversation.unreadCounts,
  });
};
