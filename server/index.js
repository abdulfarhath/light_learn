const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require('dotenv').config();

// Import database pool early to test connection
const pool = require('./shared/config/database');

const app = express();
app.use(cors());
app.use(express.json());

// Import feature modules
const authFeature = require('./features/auth');
const usersFeature = require('./features/users');
const classesFeature = require('./features/classes');
const coursesFeature = require('./features/courses');
const liveSessionsModule = require('./features/live-sessions');
const resourcesModule = require('./features/resources');
const todosFeature = require('./features/todos');

// Mount feature routes
app.use('/api/auth', authFeature.routes);
app.use('/api/users', usersFeature.routes);
app.use('/api/classes', classesFeature.routes);
app.use('/api/courses', coursesFeature.routes);
app.use('/api/todos', todosFeature.routes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Create HTTP server and Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Initialize Socket.IO handlers for features
liveSessionsModule.socket.init(io);
resourcesModule.socket.init(io);

// Test database connection before starting server
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('❌ Failed to connect to database:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Connected to PostgreSQL database');
    
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`));
  }
});

module.exports = { app, server, io };