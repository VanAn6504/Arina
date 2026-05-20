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
  sendDirectMessage: (
    recipientId: string,
    content: string,
    imgUrl?: string,
    replyTo?: string | null,
    type?: "text" | "image" | "file" | "system",
    fileUrl?: string
  ) => Promise<void>;
  sendGroupMessage: (
    conversationId: string,
    content: string,
    imgUrl?: string,
    replyTo?: string | null,
    type?: "text" | "image" | "file" | "system",
    fileUrl?: string
  ) => Promise<void>;
  uploadFile: (file: File) => Promise<{ url: string; name: string; size: number; type: "image" | "file" }>;
  addMembersToGroup: (conversationId: string, memberIds: string[]) => Promise<void>;
  removeMemberFromGroup: (conversationId: string, userId: string) => Promise<void>;
  leaveGroup: (conversationId: string) => Promise<void>;
  updateGroupInfo: (conversationId: string, name?: string, avatarFile?: File) => Promise<void>;

  // add message
  addMessage: (message: Message) => Promise<void>;

  // message actions
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  reactMessage: (messageId: string, emoji: string) => Promise<void>;
  updateMessageInStore: (conversationId: string, messageId: string, updates: Partial<Message>) => void;

  // update convo
  updateConversation: (conversation: any) => void;
  markAsSeen: () => Promise<void>;
  addConvo: (convo: Conversation) => void;
  createConversation: (
    type: "group" | "direct",
    name: string,
    memberIds: string[]
  ) => Promise<void>;

  // Search feature
  showSearchPanel: boolean;
  highlightedMessageId: string | null;
  searchKeyword: string;
  searchResults: any[];
  setShowSearchPanel: (show: boolean) => void;
  setHighlightedMessageId: (id: string | null) => void;
  searchMessages: (keyword: string, conversationId?: string) => Promise<void>;
  fetchMessagesAround: (conversationId: string, messageId: string) => Promise<void>;

  // Sidebar combined search
  sidebarSearchQuery: string;
  sidebarSearchResults: any[];
  sidebarSearchLoading: boolean;
  setSidebarSearchQuery: (query: string) => void;
  searchSidebarMessages: (keyword: string) => Promise<void>;
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
  removeFriend: (friendId: string) => Promise<void>;
}

export interface UserState {
  loading: boolean;
  blockedUsers: User[];
  updateAvatarUrl: (formData: FormData) => Promise<void>;
  updateProfile: (
    displayName: string,
    phoneNumber: string,
    bio: string,
    showOnline?: boolean,
    allowNotifications?: boolean
  ) => Promise<void>; 
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  getBlockedList: () => Promise<void>;
  blockUser: (targetUserId: string) => Promise<void>;
  unblockUser: (targetUserId: string) => Promise<void>;
  getMutualGroups: (userId: string) => Promise<any[]>;
}
