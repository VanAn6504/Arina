import { Server } from "socket.io";
import http from "http";
import express from "express";
import { socketAuthMiddleware } from "../middlewares/socketMiddleware.js";
import { getUserConversationsForSocketIO } from "../controllers/conversationController.js";
import User from "../models/User.js";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

io.use(socketAuthMiddleware);

const onlineUsers = new Map(); // key: userId (string), value: { socketId: string, showOnline: boolean }

export const broadcastOnlineUsers = async () => {
  try {
    const onlineUserIds = Array.from(onlineUsers.keys());
    if (onlineUserIds.length === 0) return;

    const users = await User.find({ _id: { $in: onlineUserIds } }, "_id blockedUsers showOnline");

    const userMap = new Map();
    users.forEach((u) => {
      userMap.set(u._id.toString(), {
        blockedUsers: (u.blockedUsers || []).map((id) => id.toString()),
        showOnline: u.showOnline !== false,
      });
    });

    for (const [userId, socketInfo] of onlineUsers.entries()) {
      const currentUserInfo = userMap.get(userId);
      const currentBlocked = currentUserInfo ? currentUserInfo.blockedUsers : [];

      const filteredOnline = [];
      for (const [otherId] of onlineUsers.entries()) {
        if (otherId === userId) {
          filteredOnline.push(otherId);
          continue;
        }

        const otherInfo = userMap.get(otherId);
        if (!otherInfo || !otherInfo.showOnline) continue;

        const otherBlocked = otherInfo.blockedUsers || [];
        if (currentBlocked.includes(otherId) || otherBlocked.includes(userId)) {
          continue;
        }

        filteredOnline.push(otherId);
      }

      io.to(socketInfo.socketId).emit("online-users", filteredOnline);
    }
  } catch (error) {
    console.error("Lỗi khi phát danh sách online:", error);
  }
};

io.on("connection", async (socket) => {
  const user = socket.user;
  const userIdStr = user._id.toString();

  console.log(`${user.displayName} online với socket ${socket.id}`);

  onlineUsers.set(userIdStr, {
    socketId: socket.id,
    showOnline: user.showOnline !== false,
  });

  await broadcastOnlineUsers();

  const conversationIds = await getUserConversationsForSocketIO(user._id);
  conversationIds.forEach((id) => {
    socket.join(id);
  });

  socket.on("join-conversation", (conversationId) => {
    socket.join(conversationId);
  });

  socket.on("toggle-visibility", async (showOnline) => {
    const entry = onlineUsers.get(userIdStr);
    if (entry) {
      entry.showOnline = showOnline;
      onlineUsers.set(userIdStr, entry);
    }
    await broadcastOnlineUsers();
  });

  socket.on("typing", (conversationId) => {
    socket.to(conversationId).emit("user-typing", {
      conversationId,
      userId: user._id,
      displayName: user.displayName,
    });
  });

  socket.on("stop-typing", (conversationId) => {
    socket.to(conversationId).emit("user-stop-typing", {
      conversationId,
      userId: user._id,
      displayName: user.displayName,
    });
  });

  socket.join(userIdStr);

  socket.on("disconnect", async () => {
    onlineUsers.delete(userIdStr);
    await broadcastOnlineUsers();
    console.log(`socket disconnected: ${socket.id}`); 
  });
});

export { io, app, server };
