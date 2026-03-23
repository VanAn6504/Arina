import { chatService } from "@/services/chatService";
import type { ChatState } from "@/types/store";
// import set from "node_modules/react-hook-form/dist/utils/set";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";


export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => ({
            conversations: [],
            messages: {},
            activeConversationId: null,
            convoLoading: false, // convo loading
            messageLoading: false,
            loading: false,

            setActiveConversation: (id) => set({ activeConversationId: id }),
            reset: () => {
                set({
                conversations: [],
                messages: {},
                activeConversationId: null,
                convoLoading: false,
                messageLoading: false,
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
        }),
            {
                name: "chat-storage",
                partialize: (state) => ({
                    conversations: state.conversations})
            }
    )
);