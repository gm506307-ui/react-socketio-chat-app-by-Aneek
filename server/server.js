let users = [];
let roomUsers = {};
let roomMessages = {};
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
  },
});
io.on("connection", (socket) => {
  users.push(socket.id);
  io.emit("user_count", users.length);
  console.log("User connected:", socket.id);
  socket.on("join_room", (data) => {
    socket.join(data.room);
    if (!roomMessages[data.room]) {
      roomMessages[data.room] = [];
    }
    socket.emit(
      "chat_history",
      roomMessages[data.room]
    );
    socket.username = data.username;
    socket.room = data.room;
    if (!roomUsers[data.room]) {
      roomUsers[data.room] = [];
    }
    roomUsers[data.room].push(data.username);
    io.to(data.room).emit(
      "room_users",
      roomUsers[data.room]
    );
    io.to(data.room).emit("system_message", {
      username: "SYSTEM",
      message: `${data.username} joined room`,
      time: new Date().toLocaleTimeString(),
    });
    console.log(
      `${data.username} joined room ${data.room}`
    );
    socket.on("clear_room_chat", (room) => {
  roomMessages[room] = [];
  io.to(room).emit("chat_history", []);
  io.to(room).emit("system_message", {
    username: "SYSTEM",
    message: "Chat was cleared",
    time: new Date().toLocaleTimeString(),
  });
});
  });
  socket.on("message_seen", (data) => {
  io.to(data.room).emit(
    "message_seen",
    data.id
  );
});
  socket.on("edit_message", (data) => {
  if (!roomMessages[data.room]) return;
  roomMessages[data.room] =
    roomMessages[data.room].map((msg) =>
      msg.id === data.id
        ? {
            ...msg,
            message: data.message,
            edited: true,
          }
        : msg
    );

  io.to(data.room).emit(
    "message_edited",
    data
  );
});
socket.on("add_reaction", (data) => {
  console.log("Reaction received:",data);
  if (!roomMessages[data.room]) return;
  roomMessages[data.room] =
    roomMessages[data.room].map((msg) =>
      msg.id === data.id
        ? {
            ...msg,
            reactions: [
              ...(msg.reactions || []),
              data.reaction,
            ],
          }
        : msg
    );
  io.to(data.room).emit(
    "reaction_added",
    data
  );
});
  socket.on("typing", (data) => {
    socket.to(data.room).emit(
      "user_typing",
      data.username
    );
  });
  socket.on("send_message", (data) => {
  if (!roomMessages[data.room]) {
    roomMessages[data.room] = [];
  }
  roomMessages[data.room].push(data);
  if (roomMessages[data.room].length>100){
    roomMessages[data.room].shift();
  }
  io.to(data.room).emit(
    "receive_message",
    data
  );
});
socket.on("delete_message", (data) => {
  if (!roomMessages[data.room]) return;
  roomMessages[data.room] =
    roomMessages[data.room].filter(
      (msg) => msg.id !== data.id
    );
  io.to(data.room).emit(
    "message_deleted",
    data.id
  );
});
  socket.on("disconnect", () => {
    users = users.filter(
      (id) => id !== socket.id
    );
    io.emit("user_count", users.length);
    if (
      socket.room &&
      roomUsers[socket.room]
    ) {
      roomUsers[socket.room] =
        roomUsers[socket.room].filter(
          (user) =>
            user !== socket.username
        );
      io.to(socket.room).emit(
        "room_users",
        roomUsers[socket.room]
      );
      io.to(socket.room).emit(
        "system_message",
        {
          username: "SYSTEM",
          message: `${socket.username} left the room`,
          time: new Date().toLocaleTimeString(),
        }
      );
    }
    console.log(
      "User disconnected:",
      socket.id
    );
  });
});
server.listen(5000, () => {
  console.log(
    "Server running on port 5000"
  );
});