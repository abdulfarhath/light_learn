const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

// Import DB pool
const pool = require("./shared/config/database");

const app = express();
app.use(cors());
app.use(express.json());

// ------------------------------
// Import Feature Modules
// ------------------------------
const authFeature = require("./features/auth");
const usersFeature = require("./features/users");
const coursesFeature = require("./features/courses");
const liveSessionsModule = require("./features/live-sessions");
const resourcesModule = require("./features/resources");
const doubtsModule = require("./features/doubts");
const todosFeature = require("./features/todos");
const classesFeature = require("./features/classes");
const lessonsFeature = require("./features/lessons");

// From main branch
const teacherCoursesFeature = require("./features/teacher-courses");
const quizzesFeature = require("./features/quizzes");
const pollsFeature = require("./features/polls");
const assignmentsFeature = require("./features/assignments");

// ------------------------------
// Static File Serving
// ------------------------------
app.use("/uploads", express.static("uploads"));   // main branch
app.use("/storage", express.static("storage"));   // karthikeyan branch

// ------------------------------
// Mount Feature Routes
// ------------------------------
app.use("/api/auth", authFeature.routes);
app.use("/api/users", usersFeature.routes);
app.use("/api/classes", classesFeature.routes);
app.use("/api/courses", coursesFeature.routes);
app.use("/api/doubts", doubtsModule.routes);
app.use("/api/todos", todosFeature.routes);
app.use("/api/lessons", lessonsFeature.lessonsRoutes);

app.use("/api/teacher-courses", teacherCoursesFeature);
app.use("/api/quizzes", quizzesFeature.routes);
app.use("/api/polls", pollsFeature.routes);
app.use("/api/assignments", assignmentsFeature.routes);
app.use("/api/live-sessions", liveSessionsModule.routes);

// ------------------------------
// Health Check
// ------------------------------
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// ------------------------------
// HTTP + Socket.IO Setup
// ------------------------------
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Initialize Socket Handlers
liveSessionsModule.socket.init(io);
resourcesModule.socket.init(io);

// ------------------------------
// DB Test + Server Start
// ------------------------------
pool.query("SELECT NOW()", (err) => {
  if (err) {
    console.error("❌ Failed to connect to database:", err.message);
    process.exit(1);
  } else {
    console.log("✅ Connected to PostgreSQL database");

    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () =>
      console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`)
    );
  }
});

module.exports = { app, server, io };
