import type { Socket } from "node_modules/socket.io-client/build/esm/socket";
import type { Conversation, Message } from "./chat";
import type { User } from "./user";

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  setAccessToken: (accessToken: string) => void;
  // setUser: (user: User) => void;
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
  reset: () => void;
  
  setActiveConversation: (id: string | null) => void;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId?: string) => Promise<void>;
  sendDirectMessage: (recipientId: string, content: string, imgUrl?: string) => Promise<void>;
  sendGroupMessage: (conversationId: string, content: string, imgUrl?: string) => Promise<void>;

  // add message
  addMessage: (message: Message) => Promise<void>;
  // update convo
  updateConversation: (conversation: Conversation) => void;
  // markAsSeen: () => Promise<void>;
  // addConvo: (convo: Conversation) => void;
  // createConversation: (
  //   type: "group" | "direct",
  //   name: string,
  //   memberIds: string[]
  // ) => Promise<void>;

}

export interface SocketState {
  socket: Socket | null;
  onlineUsers: string[]; 
  connectSocket: () => void;
  disconnectSocket: () => void;
}