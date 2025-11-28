const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Memory Stores
const attendanceLog = {};
const resources = []; // Stores { id, name, type, size, dataURL }

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);
  attendanceLog[socket.id] = { joinTime: Date.now() };

  // Send existing resources list (metadata only) to new user
  // We strip the 'dataURL' to keep it lightweight
  const resourceList = resources.map(({ id, name, type, size }) => ({ id, name, type, size }));
  socket.emit("resource_list_update", resourceList);

  socket.on("join_room", (data) => {
    socket.join(data.room);
    console.log(`${data.username} (${data.role}) joined ${data.room}`);
  });

  // --- CORE RELAYS ---
  socket.on("draw_data", (data) => socket.to(data.room).emit("receive_draw_data", data));
  socket.on("background_image", (data) => socket.to(data.room).emit("receive_background_image", data.image));
  socket.on("video_frame", (data) => socket.to(data.room).emit("receive_video_frame", data));
  socket.on("audio_stream", (data) => socket.to(data.room).emit("receive_audio_stream", data.audio));
  socket.on("send_message", (data) => socket.to(data.room).emit("receive_message", data));

  // --- TEACHER CONTROLS ---
  socket.on("toggle_board_access", (data) => socket.to(data.room).emit("board_access_changed", data.allowStudentsToDraw));
  socket.on("send_quiz", (data) => socket.to(data.room).emit("receive_quiz", data));
  socket.on("submit_answer", (data) => socket.to(data.room).emit("receive_answer", data));

  // --- 🆕 RESOURCE SYSTEM ---
  
  // 1. Upload (Teacher)
  socket.on("upload_resource", (fileData) => {
    // fileData = { name, type, size, data }
    const newFile = { id: Date.now(), ...fileData };
    resources.push(newFile);
    
    // Broadcast ONLY metadata (lightweight) to everyone
    const meta = { id: newFile.id, name: newFile.name, type: newFile.type, size: newFile.size };
    io.emit("new_resource_available", meta);
  });

  // 2. Download (Student)
  socket.on("request_download", (fileId) => {
    const file = resources.find(r => r.id === fileId);
    if (file) {
      // Send heavy data ONLY to the person who asked
      socket.emit("receive_download_data", file);
    }
  });

  socket.on("disconnect", () => {
    if (attendanceLog[socket.id]) delete attendanceLog[socket.id];
  });
});

server.listen(3001, () => console.log("SERVER RUNNING ON 3001"));