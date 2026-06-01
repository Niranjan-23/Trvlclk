router.get('/:messageId/post', async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId)
      .populate('post');
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json({ post: message.post });
  } catch (error) {
    console.error('Error fetching post for message:', error);
    res.status(500).json({ error: 'Server error' });
  }
});