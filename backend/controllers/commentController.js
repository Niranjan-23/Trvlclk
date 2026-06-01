// controllers/commentController.js
const Comment = require('../models/Comments');
const Post = require('../models/Post');
const { handleDBError } = require('../utils/helpers');
const mongoose = require('mongoose');

// Add a new comment to a post
exports.addComment = async (req, res) => {
  try {
    const { userId, text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    if (
      !mongoose.Types.ObjectId.isValid(req.params.postId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ error: 'Invalid ID' });
    }
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const newComment = new Comment({
      post: req.params.postId,
      user: userId,
      text: text.trim(),
    });
    await newComment.save();

    // Populate user fields so the frontend can display username/profileImage
    const populatedComment = await Comment.findById(newComment._id)
      .populate('user', 'username profileImage');

    res.status(201).json({ comment: populatedComment });
  } catch (error) {
    handleDBError(res, error);
  }
};

// Get all comments for a specific post
exports.getComments = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
      return res.status(400).json({ error: 'Invalid post id' });
    }
    const comments = await Comment.find({ post: req.params.postId })
      .populate('user', 'username profileImage')
      .sort({ createdAt: 1 });

    res.status(200).json({ comments });
  } catch (error) {
    handleDBError(res, error);
  }
};

// DELETE a specific comment
exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(postId) ||
      !mongoose.Types.ObjectId.isValid(commentId)
    ) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    // Find the comment by ID and post
    const comment = await Comment.findOne({ _id: commentId, post: postId });
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Delete the comment
    await Comment.deleteOne({ _id: commentId });
    return res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    handleDBError(res, error);
  }
};
