// controllers/conversationController.js
const Conversation = require('../models/Conversation');

exports.getConversation = async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    // Find conversation that contains both participants
    const conversation = await Conversation.findOne({
      participants: { $all: [user1, user2] }
    }).populate('participants', 'username name profileImage');

    // If no conversation exists, return an empty conversation packet
    if (!conversation) {
      return res.status(200).json({ conversation: { _id: null, participants: [user1, user2], messages: [] } });
    }
    res.status(200).json({ conversation });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Error fetching conversation' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { senderId, recipientId, text, messageType, imageUrl, post, replyTo } = req.body;
    console.log("[DEBUG BACKEND] sendMessage req.body.replyTo:", req.body.replyTo);

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, recipientId],
        messages: []
      });
    }

    // Create new message
    const newMessage = {
      sender: senderId,
      text,
      messageType: messageType || 'text',
      imageUrl,
      replyTo: replyTo || undefined,
      post: post ? {
        _id: post._id,
        imageUrl: post.imageUrl,
        description: post.description,
        location: post.location,
        user: post.user,
        likes: post.likes
      } : undefined
    };

    console.log("[DEBUG BACKEND] newMessage.replyTo:", newMessage.replyTo);
    conversation.messages.push(newMessage);
    await conversation.save();
    const lastSavedMsg = conversation.messages[conversation.messages.length - 1];
    console.log("[DEBUG BACKEND] saved last message object:", lastSavedMsg);

    const io = req.app.get('io');
    if (io) {
      const socketPayload = {
        conversationId: conversation._id,
        message: lastSavedMsg
      };
      io.to(conversation._id.toString()).emit('receive_message', socketPayload);
      io.to(recipientId.toString()).emit('receive_message', socketPayload);
    }

    res.status(200).json({ 
      conversation: {
        ...conversation.toObject(),
        messages: conversation.messages.map(msg => ({
          ...msg.toObject(),
          post: msg.post,
          replyTo: msg.replyTo
        }))
      }
    });
  } catch (error) {
    console.error('Error in conversation controller:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/** NEW: Delete a single message from a conversation */
exports.deleteMessage = async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if the message exists in the conversation
    const message = conversation.messages.id(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Remove the message using pull method
    conversation.messages.pull(messageId);

    await conversation.save();

    const io = req.app.get('io');
    if (io) {
      const deletePayload = { conversationId, messageId };
      io.to(conversationId.toString()).emit('delete_message', deletePayload);
      conversation.participants.forEach(pId => {
        io.to(pId.toString()).emit('delete_message', deletePayload);
      });
    }

    res.status(200).json({ conversation });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Error deleting message" });
  }
};
