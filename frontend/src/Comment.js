import React, { useState, useEffect } from 'react';
import { Avatar, IconButton, TextField, Button } from '@mui/material';
import './Comment.css';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import API_BASE_URL from './config';

const getRelativeTime = (dateString) => {
  const now = new Date();
  const commentDate = new Date(dateString);
  const diffInSeconds = Math.floor((now - commentDate) / 1000);

  const intervals = [
    { label: 'yr', seconds: 31536000 },
    { label: 'mo', seconds: 2592000 },
    { label: 'd', seconds: 86400 },
    { label: 'h', seconds: 3600 },
    { label: 'm', seconds: 60 },
    { label: 's', seconds: 1 }
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count}${interval.label} ago`;
    }
  }
  return 'just now';
};

export default function Comment({ postId, loggedInUser }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`);
        if (response.ok) {
          const data = await response.json();
          setComments(data.comments || []);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };

    if (postId) {
      fetchComments();
    }
  }, [postId]);

  const handleAddComment = async () => {
    if (newComment.trim() === '') return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: loggedInUser._id, text: newComment })
      });
      if (response.ok) {
        const data = await response.json();
        setComments([...comments, data.comment]);
        setNewComment('');
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setComments(comments.filter(comment => comment._id !== commentId));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <div className="comment-panel">
      <div className="comment-panel-header">
        <h3>Comments ({comments.length})</h3>
      </div>

      <div className="comment-scroll-list">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment._id} className="comment-item-row">
              <Avatar
                alt={comment.user?.username || 'User'}
                src={comment.user?.profileImage || '/default-avatar.png'}
                className="comment-user-avatar"
              />
              <div className="comment-item-body">
                <div className="comment-user-headline">
                  <span className="comment-author">{comment.user?.username || 'User'}</span>
                  <span className="comment-time">{getRelativeTime(comment.createdAt)}</span>
                </div>
                <p className="comment-text-content">{comment.text}</p>
              </div>
              {(comment.user?._id === loggedInUser?._id || loggedInUser?.isAdmin) && (
                <IconButton
                  size="small"
                  className="comment-delete-btn"
                  onClick={() => handleDeleteComment(comment._id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </div>
          ))
        ) : (
          <div className="empty-comments-text">No comments yet. Be the first to comment!</div>
        )}
      </div>

      <div className="comment-input-footer">
        <input
          type="text"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
          className="comment-text-input"
        />
        <button onClick={handleAddComment} className="comment-send-btn">
          <SendIcon fontSize="small" />
        </button>
      </div>
    </div>
  );
}
