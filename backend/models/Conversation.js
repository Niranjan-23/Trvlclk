const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'image'], default: 'text' },
  imageUrl: String,
  // Add replyTo field
  replyTo: {
    _id: { type: mongoose.Schema.Types.ObjectId },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    messageType: String,
    imageUrl: String
  },
  post: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    imageUrl: String,
    description: String,
    location: String,
    user: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      username: String,
      profileImage: String
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }
}, { timestamps: true });

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  messages: [messageSchema]
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
