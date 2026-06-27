require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const conversationsRoutes = require('./routes/conversations');

const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({ origin: '*' })
);

// Database Connection
require('./config/db');

// Socket.io Event Handlers
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  socket.on('join_user', (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`[Socket.io] Socket ${socket.id} joined user room: ${userId}`);
    }
  });

  socket.on('join_conversation', (conversationId) => {
    if (conversationId) {
      socket.join(conversationId);
      console.log(`[Socket.io] Socket ${socket.id} joined conversation room: ${conversationId}`);
    }
  });

  socket.on('send_message', (data) => {
    console.log('[Socket.io] send_message event received:', data);
    if (data.conversationId) {
      socket.to(data.conversationId).emit('receive_message', data);
    }
    if (data.recipientId) {
      socket.to(data.recipientId).emit('receive_message', data);
    }
  });

  socket.on('delete_message', (data) => {
    console.log('[Socket.io] delete_message event received:', data);
    if (data.conversationId) {
      socket.to(data.conversationId).emit('delete_message', data);
    }
    if (data.recipientId) {
      socket.to(data.recipientId).emit('delete_message', data);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const postRoutes = require('./routes/post');
const commentsRoutes = require('./routes/comments');
const searchRoutes = require('./routes/search');

app.use('/api', authRoutes);
app.use('/api', usersRoutes);
app.use('/api', postRoutes);
app.use('/api', commentsRoutes);
app.use('/api', searchRoutes);
app.use('/api', conversationsRoutes);

// Serve Static Files
app.use(express.static('public'));

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});