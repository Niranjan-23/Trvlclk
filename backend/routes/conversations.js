// routes/conversations.js
const express = require('express');
const router = express.Router();
const {
  getConversation,
  sendMessage,
  deleteMessage,
  getUnreadChatsCount,
  markMessagesAsRead
} = require('../controllers/conversationController');

// Get the number of chats with unread messages for a user
router.get('/conversations/unread-count/:userId', getUnreadChatsCount);

// Get the conversation between two users
router.get('/conversations/:user1/:user2', getConversation);

// Send a new message (creates or updates a conversation)
router.post('/conversations', sendMessage);

/** NEW: Delete an individual message from a conversation */
router.delete('/conversations/:conversationId/messages/:messageId', deleteMessage);

// Mark conversation messages as read
router.post('/conversations/:conversationId/read', markMessagesAsRead);

module.exports = router;
