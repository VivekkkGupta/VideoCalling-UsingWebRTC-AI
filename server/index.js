const { Server } = require("socket.io");

const io = new Server(8000, {
  cors: true,
});

const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();

io.on("connection", (socket) => {
  console.log(`Socket Connected`, socket.id);
  socket.on("room:join", (data) => {
    const { email, room } = data;
    
    emailToSocketIdMap.set(email, socket.id);
    socketidToEmailMap.set(socket.id, email);
    
    console.log("user joined : ", email, socket.id);

    //User Joined emit other users in the room
    io.to(room).emit("user:joined", { email, id: socket.id });
    
    socket.join(room);
    io.to(socket.id).emit("room:join", data);

    //User Joined emit set my stream
    io.to(socket.id).emit("setmystream", { email, id: socket.id });
  });

  socket.on("user:call", ({ to,fromEmail, offer }) => {
    // console.log("calling from : ", fromEmail)
    io.to(to).emit("incomming:call", { from: socket.id, offer, fromEmail });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    // console.log("peer:nego:needed", offer);
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    // console.log("peer:nego:done", ans);
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });
  
  socket.on("peer:nego:completedsendtracks", ({ to }) => {
    console.log("peer:nego:completedsendtracks", to);
    io.to(to).emit("peer:nego:completedsendtracks", { from: socket.id });
  });

});