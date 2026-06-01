import React, { useState, useEffect } from 'react';
import { Avatar, Grid, Paper, Divider, TextField, Button, IconButton } from '@mui/material';
import './Comment.css';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import API_BASE_URL from './config';

// Utility function for relative time
const getRelativeTime = (dateString) => {
  const now = new Date();
  const commentDate = new Date(dateString);
  const diffInSeconds = Math.floor((now - commentDate) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 }
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }
  return 'just now';
};

export default function Comment({ postId, loggedInUser }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  // Fetch comments for the post
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`);
        if (response.ok) {
          const data = await response.json();
          setComments(data.comments || []);
        } else {
          console.error('Failed to fetch comments');
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
      if (!response.ok) {
        console.error("Error adding comment");
        return;
      }
      const data = await response.json();
      setComments([...comments, data.comment]);
      setNewComment('');
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Function to handle deletion of a comment
  const handleDeleteComment = async (commentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        // Remove the deleted comment from state
        setComments(comments.filter(comment => comment._id !== commentId));
      } else {
        console.error('Error deleting comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <div style={{ padding: 14 }} className="comment-box">
      <h1>Comments</h1>
      <Paper
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '400px',
          overflow: 'hidden',
          padding: '20px',
        }}
      >
        {/* Scrollable comment list */}
        <div className='comment-scroll'>
          {comments.map((comment) => (
            <Paper
              key={comment._id}
              style={{
                padding: '20px',
                marginBottom: '10px',
                animation: 'fadeIn 0.5s',
              }}
            >
              <Grid container wrap="nowrap" spacing={2} alignItems="center">
                <Grid item>
                  <Avatar alt={comment.user.username} src={comment.user.profileImage} />
                </Grid>
                <Grid item xs zeroMinWidth>
                  <h4 style={{ margin: 0, textAlign: 'left' }}>{comment.user.username}</h4>
                  <p style={{ textAlign: 'left' }}>{comment.text}</p>
                  <p style={{ textAlign: 'left', color: 'gray' }}>
                    {getRelativeTime(comment.createdAt)}
                  </p>
                </Grid>
                <Grid item>
                  {/* Delete button */}
                  <IconButton color="secondary" onClick={() => handleDeleteComment(comment._id)}>
                    <DeleteIcon fontSize='small'/>
                  </IconButton>
                </Grid>
              </Grid>
              <Divider variant="fullWidth" style={{ margin: '20px 0' }} />
            </Paper>
          ))}
        </div>

        {/* Fixed input at the bottom */}
        <div style={{ paddingTop: '10px' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs>
              <TextField
                fullWidth
                label="Add a comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
            </Grid>
            <Grid item>
              <Button color="secondary" onClick={handleAddComment}>
                <SendIcon />
              </Button>
            </Grid>
          </Grid>
        </div>
      </Paper>
    </div>
  );
}
