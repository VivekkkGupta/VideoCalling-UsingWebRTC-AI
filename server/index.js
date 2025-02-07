const express = require("express");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const http = require("http");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: true,
});

app.use(bodyParser.json());

// Maps to keep track of socket connections
const emailToSocketMap = new Map();
const socketToEmailMap = new Map();

io.on("connection", (socket) => {
  socket.on("joinRoom", (data) => {
    
    const { emailId, roomId } = data;
    console.log("joinRoom called by ", emailId, "for room ", roomId);
    
    emailToSocketMap.set(emailId, socket.id);
    socketToEmailMap.set(socket.id, emailId);

    socket.join(roomId);
    console.log("joined room ", roomId);

    socket.emit("joinedRoom", { roomId });
    console.log("joinedRoom emitted to ", emailId);
    
    socket.broadcast.to(roomId).emit("userJoined", { emailId });
    console.log("userJoined emitted to ", emailId);
  });

  socket.on("callUser", (data) => {
    const { emailId, offer } = data;
    const socketId = emailToSocketMap.get(emailId);
    const fromEmailId = socketToEmailMap.get(socket.id);
    console.log("callUser received from ", fromEmailId, "to ", emailId);
    
    socket.to(socketId).emit("inComingCall", { from: fromEmailId, offer });
    console.log("inComingCall emitted to ", emailId);
  });


  socket.on("callAccepted", (data) => {
    const { emailId, answer } = data;
    const socketId = emailToSocketMap.get(emailId);

    if (socketId) {
      socket.to(socketId).emit("callAccepted", { answer });
    }
  });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
