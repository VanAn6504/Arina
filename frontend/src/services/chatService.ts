import api from "@/lib/axios";
import type { ConversationResponse, Message } from "@/types/chat";

interface FetchMessageProps {
    messages: Message[];
    cursor?: string;
}

const pageLimit = 50;

export const chatService = {
    async fetchConversations(): Promise<ConversationResponse> {
        const res = await api.get("/conversations");
        return res.data;
    },

  async fetchMessages(id: string, cursor?: string, aroundMessageId?: string): Promise<FetchMessageProps> {
    const res = await api.get(
      `/conversations/${id}/messages?limit=${pageLimit}&cursor=${cursor || ""}&aroundMessageId=${aroundMessageId || ""}`
    );

    return { messages: res.data.messages, cursor: res.data.nextCursor };
  },

  async searchMessages(keyword: string, conversationId?: string): Promise<{ messages: any[] }> {
    const res = await api.get(
      `/messages/search?keyword=${encodeURIComponent(keyword)}&conversationId=${conversationId || ""}`
    );
    return res.data;
  },

  async sendDirectMessage(
    recipientId: string,
    content: string = "",
    imgUrl?: string,
    conversationId?: string,
    replyTo?: string,
    type: "text" | "image" | "file" | "system" = "text",
    fileUrl?: string
  ) {
    const res = await api.post("/messages/direct", {
      recipientId,
      content,
      imgUrl,
      conversationId,
      replyTo,
      type,
      fileUrl,
    });
    return res.data.message;
  },

  async sendGroupMessage(
    conversationId: string,
    content: string = "",
    imgUrl?: string,
    replyTo?: string,
    type: "text" | "image" | "file" | "system" = "text",
    fileUrl?: string
  ) {
    const res = await api.post("/messages/group", {
      conversationId,
      content,
      imgUrl,
      replyTo,
      type,
      fileUrl,
    });
    return res.data.message;
  },

  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/messages/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data; // trả về { url, name, size, type }
  },

  async markAsSeen(conversationId: string) {
    const res = await api.patch(`/conversations/${conversationId}/seen`);
    return res.data;
  },

   async createConversation(
    type: "direct" | "group",
    name: string,
    memberIds: string[]
  ) {
    const res = await api.post("/conversations", { type, name, memberIds });
    return res.data.conversation;
  },

  async deleteMessage(messageId: string) {
    const res = await api.delete(`/messages/${messageId}/delete`);
    return res.data;
  },

  async editMessage(messageId: string, content: string) {
    const res = await api.put(`/messages/${messageId}/edit`, { content });
    return res.data;
  },

  async reactMessage(messageId: string, emoji: string) {
    const res = await api.post(`/messages/${messageId}/react`, { emoji });
    return res.data;
  },

  async addMembersToGroup(conversationId: string, memberIds: string[]) {
    const res = await api.put(`/conversations/${conversationId}/members/add`, { memberIds });
    return res.data.conversation;
  },

  async removeMemberFromGroup(conversationId: string, userId: string) {
    const res = await api.delete(`/conversations/${conversationId}/members/remove`, { data: { userId } });
    return res.data.conversation;
  },

  async leaveGroup(conversationId: string) {
    const res = await api.delete(`/conversations/${conversationId}/leave`);
    return res.data;
  },

  async updateGroupInfo(conversationId: string, name?: string, avatarFile?: File) {
    const formData = new FormData();
    if (name) formData.append("name", name);
    if (avatarFile) formData.append("avatar", avatarFile);
    
    const res = await api.put(`/conversations/${conversationId}/group-info`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data.conversation;
  }
}

