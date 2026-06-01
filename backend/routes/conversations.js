// routes/conversations.js
const express = require('express');
const router = express.Router();
const {
  getConversation,
  sendMessage,
  deleteMessage
} = require('../controllers/conversationController');

// Get the conversation between two users
router.get('/conversations/:user1/:user2', getConversation);

// Send a new message (creates or updates a conversation)
router.post('/conversations', sendMessage);

/** NEW: Delete an individual message from a conversation */
router.delete('/conversations/:conversationId/messages/:messageId', deleteMessage);

module.exports = router;
