require('dotenv').config();
const express = require('express');
const cors = require('cors');
const conversationsRoutes = require('./routes/conversations');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({ origin: '*' })
);

// Database Connection
require('./config/db');

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});