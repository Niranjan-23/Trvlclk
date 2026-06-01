// routes/comments.js
const express = require('express');
const router = express.Router();
const { addComment, getComments, deleteComment } = require('../controllers/commentController');

// POST a new comment
router.post('/posts/:postId/comments', addComment);

// GET all comments for a post
router.get('/posts/:postId/comments', getComments);

// DELETE a specific comment
router.delete('/posts/:postId/comments/:commentId', deleteComment);

module.exports = router;
