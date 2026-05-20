import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import type { SocketState } from "@/types/store";
import { useChatStore } from "./useChatStore";
import { useUserStore } from "./useUserStore";

const baseURL = import.meta.env.VITE_SOCKET_URL;

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],
  connectSocket: () => {
    const accessToken = useAuthStore.getState().accessToken;
    const existingSocket = get().socket;

    if (existingSocket) return; // tránh tạo nhiều socket

    const socket: Socket = io(baseURL, { //url de biet connect den dau
      auth: { token: accessToken },
      transports: ["websocket"],
    });

    set({ socket });

    socket.on("connect", () => {
      console.log("Đã kết nối với socket");
    });

    // online users
    socket.on("online-users", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // new message
    socket.on("new-message", ({ message, conversation, unreadCounts }) => {
      useChatStore.getState().addMessage(message);

      const lastMessage = {
        _id: conversation.lastMessage._id,
        content: conversation.lastMessage.content,
        createdAt: conversation.lastMessage.createdAt,
        sender: {
          _id: conversation.lastMessage.senderId,
          displayName: "",
          avatarUrl: null,
        },
      };

      const updatedConversation = {
        ...conversation,
        lastMessage,
        unreadCounts,
      };

      if (useChatStore.getState().activeConversationId === message.conversationId) {
        useChatStore.getState().markAsSeen();
      }

      useChatStore.getState().updateConversation(updatedConversation);

      // Đẩy thông báo trình duyệt nếu thỏa điều kiện
      const currentUser = useAuthStore.getState().user;
      const isActiveConvo = useChatStore.getState().activeConversationId === message.conversationId;
      const isWindowHidden = document.hidden;
      const isNotOwn = currentUser && message.senderId !== currentUser._id;
      const allowNotify = currentUser?.allowNotifications !== false;

      if (allowNotify && isNotOwn && (isWindowHidden || !isActiveConvo)) {
        if (Notification.permission === "granted") {
          const fullConvo = useChatStore.getState().conversations.find(c => c._id === message.conversationId);
          const sender = fullConvo?.participants?.find(p => p._id === message.senderId);
          
          let title = sender?.displayName || "Tin nhắn mới";
          if (fullConvo?.type === "group") {
            title = `${sender?.displayName || "Ai đó"} trong ${fullConvo.group?.name || "nhóm"}`;
          }

          let bodyText = "";
          if (message.type === "image") {
            bodyText = "[Hình ảnh]";
          } else if (message.type === "file") {
            bodyText = `[Tệp tin] ${message.content}`;
          } else {
            bodyText = message.content || "";
          }

          new Notification(title, {
            body: bodyText,
            icon: sender?.avatarUrl || "/default-avatar.png",
          });
        }
      }
    });

   // read message
 socket.on("read-message", ({ conversation, lastMessage }) => {
      const updated = {
        _id: conversation._id,
        lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        unreadCounts: conversation.unreadCounts,
        seenBy: conversation.seenBy,
      };

      useChatStore.getState().updateConversation(updated);
    });

    // message events
    socket.on("message-deleted", ({ conversationId, messageId }) => {
      useChatStore.getState().updateMessageInStore(conversationId, messageId, {
        isDeleted: true,
        content: "Tin nhắn đã bị thu hồi",
      });
    });

    socket.on("message-edited", ({ conversationId, message }) => {
      useChatStore.getState().updateMessageInStore(conversationId, message._id, {
        isEdited: true,
        content: message.content,
      });
    });

    socket.on("message-reacted", ({ conversationId, messageId, reactions }) => {
      useChatStore.getState().updateMessageInStore(conversationId, messageId, {
        reactions,
      });
    });

    socket.on("user-typing", ({ conversationId, displayName }) => {
      useChatStore.getState().setTyping(conversationId, displayName);
    });

    socket.on("user-stop-typing", ({ conversationId, displayName }) => {
      useChatStore.getState().removeTyping(conversationId, displayName);
    });

    // new group chat
    socket.on("new-group", (conversation) => {
      useChatStore.getState().addConvo(conversation);
      socket.emit("join-conversation", conversation._id);
    });

    socket.on("group-updated", (conversation) => {
      useChatStore.getState().updateConversation(conversation);
    });

    socket.on("removed-from-group", ({ conversationId }) => {
      const { activeConversationId, conversations } = useChatStore.getState();
      useChatStore.setState({
        conversations: conversations.filter((c) => c._id !== conversationId),
        activeConversationId: activeConversationId === conversationId ? null : activeConversationId,
      });
    });

    socket.on("block-update", ({ blockerId, blockedId, isBlocked }) => {
      useChatStore.getState().fetchConversations();
      const currentUser = useAuthStore.getState().user;
      if (currentUser && currentUser._id === blockerId) {
        useUserStore.getState().getBlockedList();
      }
    });
  },
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
