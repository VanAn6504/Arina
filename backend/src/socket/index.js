import { Server } from "socket.io";
import http from "http";
import express from "express";
import { socketAuthMiddleware } from "../middlewares/socketMiddleware.js";
import { getUserConversationsForSocketIO } from "../controllers/conversationController.js";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

io.use(socketAuthMiddleware);

const onlineUsers = new Map(); // map nay luu theo cap(key, value) {userId: socketId} dung cho app nho va vua, dung redit cho app lon

io.on("connection", async (socket) => {
  const user = socket.user;

  console.log(`${user.displayName} online với socket ${socket.id}`);

  onlineUsers.set(user._id, socket.id);//ghi danh

  io.emit("online-users", Array.from(onlineUsers.keys()));//gui danh sach user dang online cho tat ca client

  const conversationIds = await getUserConversationsForSocketIO(user._id);
  conversationIds.forEach((id) => {
    socket.join(id);
  });

  socket.on("join-conversation", (conversationId) => {
    socket.join(conversationId);
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

  socket.join(user._id.toString());

  socket.on("disconnect", () => {
    onlineUsers.delete(user._id);
    io.emit("online-users", Array.from(onlineUsers.keys()));
    console.log(`socket disconnected: ${socket.id}`); 
  });
});

export { io, app, server };
