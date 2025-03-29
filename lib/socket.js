const { Server } = require("socket.io");
const http = require("http");
const express = require("express");

const app = express();
const server = http.createServer(app);
 
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://online-assignment-portal-frontend.vercel.app", "http://localhost:5173"],
    methods: ['GET', 'POST'],
        credentials: true,
  },
});

 function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  // console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Listen for deleteMessage events from clients
  socket.on("deleteMessage", (data) => {
    const { senderId, receiverId, messageId } = data;
    const senderSocketId = getReceiverSocketId(senderId);
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageDeleted", messageId);
    }
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", messageId);
    }
    // console.log(`Message deleted for users ${senderId} and ${receiverId}`);
  });

  socket.on("disconnect", () => {
    // console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

module.exports={ io, app, server, getReceiverSocketId };
