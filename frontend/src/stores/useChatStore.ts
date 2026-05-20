import { chatService } from "@/services/chatService";
import type { ChatState } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import { useSocketStore } from "./useSocketStore";

export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => ({
            conversations: [],
            messages: {},
            activeConversationId: null,
            convoLoading: false, // convo loading
            messageLoading: false,
            loading: false,
            replyingTo: null,
            typingUsers: {},
            showSearchPanel: false,
            highlightedMessageId: null,
            searchKeyword: "",
            searchResults: [],
            sidebarSearchQuery: "",
            sidebarSearchResults: [],
            sidebarSearchLoading: false,

            setReplyingTo: (message) => set({ replyingTo: message }),

            setTyping: (conversationId, displayName) => {
                set((state) => {
                    const currentTyping = state.typingUsers[conversationId] || [];
                    if (!currentTyping.includes(displayName)) {
                        return {
                            typingUsers: {
                                ...state.typingUsers,
                                [conversationId]: [...currentTyping, displayName],
                            },
                        };
                    }
                    return state;
                });
            },

            removeTyping: (conversationId, displayName) => {
                set((state) => {
                    const currentTyping = state.typingUsers[conversationId] || [];
                    return {
                        typingUsers: {
                            ...state.typingUsers,
                            [conversationId]: currentTyping.filter((name) => name !== displayName),
                        },
                    };
                });
            },

            setActiveConversation: (id) => set({ activeConversationId: id }),
            setShowSearchPanel: (show) => set({ showSearchPanel: show }),
            setHighlightedMessageId: (id) => set({ highlightedMessageId: id }),
            searchMessages: async (keyword, conversationId) => {
                set({ searchKeyword: keyword });
                if (!keyword.trim()) {
                    set({ searchResults: [] });
                    return;
                }
                try {
                    const data = await chatService.searchMessages(keyword, conversationId);
                    set({ searchResults: data.messages || [] });
                } catch (error) {
                    console.error("Lỗi xảy ra khi tìm kiếm tin nhắn:", error);
                    set({ searchResults: [] });
                }
            },
            setSidebarSearchQuery: (query) => set({ sidebarSearchQuery: query }),
            searchSidebarMessages: async (keyword) => {
                if (!keyword.trim()) {
                    set({ sidebarSearchResults: [] });
                    return;
                }
                try {
                    set({ sidebarSearchLoading: true });
                    const data = await chatService.searchMessages(keyword); // Tìm kiếm toàn cục
                    set({ sidebarSearchResults: data.messages || [] });
                } catch (error) {
                    console.error("Lỗi xảy ra khi tìm kiếm tin nhắn sidebar:", error);
                    set({ sidebarSearchResults: [] });
                } finally {
                    set({ sidebarSearchLoading: false });
                }
            },
            fetchMessagesAround: async (conversationId, messageId) => {
                const { user } = useAuthStore.getState();
                set({ messageLoading: true });
                try {
                    const { messages: fetched, cursor } = await chatService.fetchMessages(
                        conversationId,
                        undefined,
                        messageId
                    );

                    const processed = fetched.map((m: any) => ({
                        ...m,
                        isOwn: m.senderId === user?._id,
                    }));

                    set((state) => ({
                        messages: {
                            ...state.messages,
                            [conversationId]: {
                                items: processed,
                                hasMore: !!cursor,
                                nextCursor: cursor ?? null,
                            },
                        },
                    }));
                } catch (error) {
                    console.error("Lỗi xảy ra khi fetchMessagesAround:", error);
                } finally {
                    set({ messageLoading: false });
                }
            },
            reset: () => {
                set({
                    conversations: [],
                    messages: {},
                    activeConversationId: null,
                    convoLoading: false,
                    messageLoading: false,
                    replyingTo: null,
                    showSearchPanel: false,
                    highlightedMessageId: null,
                    searchKeyword: "",
                    searchResults: [],
                    sidebarSearchQuery: "",
                    sidebarSearchResults: [],
                    sidebarSearchLoading: false,
                });
            },
            fetchConversations: async () => {
                try {
                    set({ convoLoading: true });
                    const { conversations } = await chatService.fetchConversations();

                    set({ conversations, convoLoading: false });
                } catch (error) {
                    console.error("Lỗi xảy ra khi fetchConversations:", error);
                    set({ convoLoading: false });
                }
            },

            fetchMessages: async (conversationId) => {
                const { activeConversationId, messages } = get();
                const { user } = useAuthStore.getState();

                const convoId = conversationId ?? activeConversationId;

                if (!convoId) return;

                const current = messages?.[convoId];
                const nextCursor =
                    current?.nextCursor === undefined ? "" : current?.nextCursor;

                if (nextCursor === null) return;

                set({ messageLoading: true });

                try {
                    const { messages: fetched, cursor } = await chatService.fetchMessages(
                        convoId,
                        nextCursor
                    );

                    const processed = fetched.map((m) => ({ //moi m la 1 tin nhan
                        ...m,
                        isOwn: m.senderId === user?._id,//1 truong moi
                    }));

                    set((state) => {
                        const prev = state.messages[convoId]?.items ?? [];// nếu state chưa có tin nhắn nào cho cuộc trò chuyện này thì previous sẽ là một mãng rỗng.
                        const merged = prev.length > 0 ? [...processed, ...prev] : processed;

                        return {
                            messages: {
                                ...state.messages,
                                [convoId]: {
                                    items: merged,
                                    hasMore: !!cursor,
                                    nextCursor: cursor ?? null,
                                },
                            },
                        };
                    });
                } catch (error) {
                    console.error("Lỗi xảy ra khi fetchMessages:", error);
                } finally {
                    set({ messageLoading: false });
                }
            },

            sendDirectMessage: async (recipientId, content, imgUrl, replyTo, type, fileUrl) => {
                try {
                    const { activeConversationId } = get();
                    await chatService.sendDirectMessage(
                        recipientId,
                        content,
                        imgUrl,
                        activeConversationId || undefined,
                        replyTo || undefined,
                        type,
                        fileUrl
                    );
                    set((state) => ({
                        conversations: state.conversations.map((c) =>
                            c._id === activeConversationId ? { ...c, seenBy: [] } : c
                        ),
                    }));
                } catch (error) {
                    console.error("Lỗi xảy ra khi gửi direct message", error);
                }
            },

            sendGroupMessage: async (conversationId, content, imgUrl, replyTo, type, fileUrl) => {
                try {
                    await chatService.sendGroupMessage(
                        conversationId,
                        content,
                        imgUrl,
                        replyTo || undefined,
                        type,
                        fileUrl
                    );
                    set((state) => ({
                        conversations: state.conversations.map((c) =>
                            c._id === get().activeConversationId ? { ...c, seenBy: [] } : c
                        ),
                    }));
                } catch (error) {
                    console.error("Lỗi xảy ra gửi group message", error);
                }
            },

            uploadFile: async (file) => {
                try {
                    return await chatService.uploadFile(file);
                } catch (error) {
                    console.error("Lỗi xảy ra khi upload file:", error);
                    throw error;
                }
            },

            addMembersToGroup: async (conversationId, memberIds) => {
                try {
                    set({ loading: true });
                    const updatedConvo = await chatService.addMembersToGroup(conversationId, memberIds);
                    get().updateConversation(updatedConvo);
                } catch (error) {
                    console.error("Lỗi xảy ra khi addMembersToGroup:", error);
                } finally {
                    set({ loading: false });
                }
            },

            removeMemberFromGroup: async (conversationId, userId) => {
                try {
                    set({ loading: true });
                    const updatedConvo = await chatService.removeMemberFromGroup(conversationId, userId);
                    get().updateConversation(updatedConvo);
                } catch (error) {
                    console.error("Lỗi xảy ra khi removeMemberFromGroup:", error);
                } finally {
                    set({ loading: false });
                }
            },

            leaveGroup: async (conversationId) => {
                try {
                    set({ loading: true });
                    await chatService.leaveGroup(conversationId);
                    set((state) => ({
                        conversations: state.conversations.filter((c) => c._id !== conversationId),
                        activeConversationId: state.activeConversationId === conversationId ? null : state.activeConversationId,
                    }));
                } catch (error) {
                    console.error("Lỗi xảy ra khi leaveGroup:", error);
                } finally {
                    set({ loading: false });
                }
            },

            updateGroupInfo: async (conversationId, name, avatarFile) => {
                try {
                    set({ loading: true });
                    const updatedConvo = await chatService.updateGroupInfo(conversationId, name, avatarFile);
                    get().updateConversation(updatedConvo);
                } catch (error) {
                    console.error("Lỗi xảy ra khi updateGroupInfo:", error);
                } finally {
                    set({ loading: false });
                }
            },

            addMessage: async (message) => {
                try {
                    const { user } = useAuthStore.getState();
                    const { fetchMessages } = get();

                    message.isOwn = message.senderId === user?._id;

                    const convoId = message.conversationId;

                    let prevItems = get().messages[convoId]?.items ?? [];

                    if (prevItems.length === 0) {
                        await fetchMessages(message.conversationId);
                        prevItems = get().messages[convoId]?.items ?? [];
                    }

                    set((state) => {
                        if (prevItems.some((m) => m._id === message._id)) {
                            return state;
                        }

                        return {
                            messages: {
                                ...state.messages,
                                [convoId]: {
                                    items: [...prevItems, message],
                                    hasMore: state.messages[convoId].hasMore,
                                    nextCursor: state.messages[convoId].nextCursor ?? undefined,
                                },
                            },
                        };
                    });
                } catch (error) {
                    console.error("Lỗi xảy khi ra add message:", error);
                }
            },

            updateMessageInStore: (conversationId, messageId, updates) => {
                set((state) => {
                    const convoMessages = state.messages[conversationId];
                    if (!convoMessages) return state;

                    const updatedItems = convoMessages.items.map((msg) =>
                        msg._id === messageId ? { ...msg, ...updates } : msg
                    );

                    return {
                        messages: {
                            ...state.messages,
                            [conversationId]: {
                                ...convoMessages,
                                items: updatedItems,
                            },
                        },
                    };
                });
            },

            deleteMessage: async (messageId) => {
                try {
                    await chatService.deleteMessage(messageId);
                } catch (error) {
                    console.error("Lỗi khi thu hồi tin nhắn", error);
                }
            },

            editMessage: async (messageId, content) => {
                try {
                    await chatService.editMessage(messageId, content);
                } catch (error) {
                    console.error("Lỗi khi sửa tin nhắn", error);
                }
            },

            reactMessage: async (messageId, emoji) => {
                try {
                    await chatService.reactMessage(messageId, emoji);
                } catch (error) {
                    console.error("Lỗi khi thả cảm xúc", error);
                }
            },
            updateConversation: (conversation: any) => {
                set((state) => ({
                    conversations: state.conversations.map((c) =>
                        c._id === conversation._id ? { ...c, ...conversation } : c //ghi de conversation moi vao , neu khong thi giu nguyen
                    ),
                }));
            },
            markAsSeen: async () => {
                try {
                    const { user } = useAuthStore.getState();
                    const { activeConversationId, conversations } = get();

                    if (!activeConversationId || !user) {
                        return;
                    }

                    const convo = conversations.find((c) => c._id === activeConversationId);

                    if (!convo) {
                        return;
                    }

                    if ((convo.unreadCounts?.[user._id] ?? 0) === 0) {
                        return;
                    }

                    await chatService.markAsSeen(activeConversationId);

                    set((state) => ({
                        conversations: state.conversations.map((c) =>
                            c._id === activeConversationId && c.lastMessage
                                ? {
                                    ...c,
                                    unreadCounts: {
                                        ...c.unreadCounts,
                                        [user._id]: 0,
                                    },
                                }
                                : c
                        ),
                    }));
                } catch (error) {
                    console.error("Lỗi xảy ra khi gọi markAsSeen trong store", error);
                }
            },

            addConvo: (convo) => {
                set((state) => {
                    const exists = state.conversations.some(
                        (c) => c._id.toString() === convo._id.toString()
                    );

                    return {
                        conversations: exists
                            ? state.conversations
                            : [convo, ...state.conversations],
                        activeConversationId: convo._id,
                    };
                });
            },

            createConversation: async (type, name, memberIds) => {
                try {
                    set({ loading: true });
                    const conversation = await chatService.createConversation(
                        type,
                        name,
                        memberIds
                    );

                    get().addConvo(conversation);

                    useSocketStore.getState().socket?.emit("join-conversation", conversation._id);
                } catch (error) {
                    console.error("Lỗi xảy ra khi gọi createConversation trong store", error);
                } finally {
                    set({ loading: false });
                }
            },
        }),

        {
            name: "chat-storage",
            partialize: (state) => ({
                conversations: state.conversations
            })
        }
    )
);