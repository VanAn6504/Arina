import type { Socket } from "socket.io-client";
import type { Conversation, Message } from "./chat";
import type { Friend, FriendRequest, User } from "./user";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  clearState: () => void;

  signUp: (
    username: string,
    password: string,
    email: string,
    firstName: string,
    lastName: string
  ) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchMe: () => Promise<void>;
  refresh: () => Promise<void>;
}

export interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
}

export interface ChatState {
  conversations: Conversation[];
  messages: Record<string, {
    items: Message[];
    hasMore: boolean; //infinite scroll
    nextCursor?: string | null; //phan trang
  }>;
  activeConversationId: string | null;
  convoLoading: boolean;
  messageLoading: boolean;
  loading: boolean;
  replyingTo: Message | null;
  typingUsers: Record<string, string[]>; // { conversationId: [displayNames] }
  
  setReplyingTo: (message: Message | null) => void;
  setTyping: (conversationId: string, displayName: string) => void;
  removeTyping: (conversationId: string, displayName: string) => void;
  reset: () => void;
  
  setActiveConversation: (id: string | null) => void;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId?: string) => Promise<void>;
  sendDirectMessage: (recipientId: string, content: string, imgUrl?: string, replyTo?: string) => Promise<void>;
  sendGroupMessage: (conversationId: string, content: string, imgUrl?: string, replyTo?: string) => Promise<void>;

  // add message
  addMessage: (message: Message) => Promise<void>;

  // message actions
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  reactMessage: (messageId: string, emoji: string) => Promise<void>;
  updateMessageInStore: (conversationId: string, messageId: string, updates: Partial<Message>) => void;

  // update convo
  updateConversation: (conversation: unknown) => void;
  markAsSeen: () => Promise<void>;
  addConvo: (convo: Conversation) => void;
  createConversation: (
    type: "group" | "direct",
    name: string,
    memberIds: string[]
  ) => Promise<void>;

}

export interface SocketState {
  socket: Socket | null;
  onlineUsers: string[]; 
  connectSocket: () => void;
  disconnectSocket: () => void;
}

export interface FriendState {
  friends: Friend[];
  loading: boolean;
  receivedList: FriendRequest[];
  sentList: FriendRequest[];
  searchByUsername: (username: string) => Promise<User | null>;
  addFriend: (to: string, message?: string) => Promise<string>;
  getAllFriendRequests: () => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  cancelFriendRequest: (requestId: string) => Promise<void>;
  getFriends: () => Promise<void>;

}

export interface UserState {
  loading: boolean;
  updateAvatarUrl: (formData: FormData) => Promise<void>;
  updateProfile: (displayName: string, phoneNumber: string, bio: string) => Promise<void>; 
}
