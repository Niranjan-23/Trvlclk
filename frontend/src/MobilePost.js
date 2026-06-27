import React, { useState, useEffect } from 'react';
import './MobilePost.css';
import FavoriteTwoToneIcon from '@mui/icons-material/FavoriteTwoTone';
import ChatBubbleTwoToneIcon from '@mui/icons-material/ChatBubbleTwoTone';
import SendTwoToneIcon from '@mui/icons-material/SendTwoTone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import { Avatar, IconButton } from '@mui/material';
import API_BASE_URL from './config';
import { useNavigate } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';

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
    if (count >= 1) return `${count}${interval.label} ago`;
  }
  return 'just now';
};

const MobilePost = ({ post, loggedInUser, showCommentsByDefault = true }) => {
  const [showComments, setShowComments] = useState(showCommentsByDefault);
  const [postLikes, setPostLikes] = useState(post.likes || []);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [followers, setFollowers] = useState([]);
  const [openSendDialog, setOpenSendDialog] = useState(false);
  const navigate = useNavigate();

  const hasLiked = postLikes.some(id => id.toString() === loggedInUser?._id);

  const fetchComments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${post._id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  useEffect(() => {
    if (post._id) {
      fetchComments();
    }
  }, [post._id]);

  const handleLike = async () => {
    if (!loggedInUser?._id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${post._id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser._id }),
      });
      if (!response.ok) return;
      const data = await response.json();
      setPostLikes(data.post.likes);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleAddComment = async () => {
    if (newComment.trim() === '' || !loggedInUser?._id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${post._id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: loggedInUser._id, text: newComment })
      });
      if (response.ok) {
        const data = await response.json();
        setComments(prev => [...prev, data.comment]);
        setNewComment('');
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${post._id}/comments/${commentId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setComments(prev => prev.filter(c => c._id !== commentId));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleProfileClick = () => {
    if (!post?.user?._id) return;
    if (post.user._id === loggedInUser?._id) {
      navigate(`/ProfileSetting`);
    } else {
      navigate(`/user/${post.user._id}`);
    }
  };

  const fetchFollowers = async () => {
    if (!loggedInUser?._id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${loggedInUser._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) return;
      const data = await response.json();
      const fetchedFollowers = data.user.followers || [];
      setFollowers(fetchedFollowers.map(f => ({
        id: f._id,
        name: f.username || f.name || "Unknown",
        profileImage: f.profileImage || '/default-avatar.png'
      })));
    } catch (error) {
      console.error("Error fetching followers:", error);
    }
  };

  const handleSendClick = () => {
    if (followers.length === 0) fetchFollowers();
    setOpenSendDialog(true);
  };

  const handleFollowerSelect = async (follower) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          senderId: loggedInUser._id,
          recipientId: follower.id,
          text: post.imageUrl,
          messageType: "image",
          post: {
            _id: post._id,
            imageUrl: post.imageUrl,
            description: post.description,
            location: post.location,
            user: post.user,
            likes: post.likes
          }
        }),
      });
      if (response.ok) {
        setOpenSendDialog(false);
        alert(`Shared post with ${follower.name}!`);
      }
    } catch (error) {
      console.error("Error sending post preview:", error);
    }
  };

  return (
    <div className="mobile-post-wrapper">
      {/* Header */}
      <div className="mobile-post-header">
        <div className="mobile-post-user-info" onClick={handleProfileClick}>
          <Avatar
            alt={post.user?.username || 'User'}
            src={post.user?.profileImage || '/default-avatar.png'}
            className="mobile-post-avatar"
          />
          <div className="mobile-post-user-names">
            <span className="mobile-post-author">{post.user?.username || 'User'}</span>
            {post.location && (
              <span
                className="mobile-post-location"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/map', {
                    state: {
                      location: post.location,
                      latitude: post.latitude,
                      longitude: post.longitude,
                    },
                  });
                }}
              >
                <LocationOnIcon style={{ fontSize: 12 }} /> {post.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Image Box */}
      <div className="mobile-post-image-box">
        <img
          src={post.imageUrl || 'https://images.pexels.com/photos/8952192/pexels-photo-8952192.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load'}
          alt="Post content"
        />
      </div>

      {/* Action Bar & Caption */}
      <div className="mobile-post-bottom">
        <div className="mobile-post-actions">
          <div className="mobile-action-group">
            <button onClick={handleLike} className={`mobile-action-btn ${hasLiked ? 'liked' : ''}`}>
              <FavoriteTwoToneIcon fontSize="small" />
              <span className="mobile-action-count">{postLikes.length}</span>
            </button>
            <button onClick={() => setShowComments(prev => !prev)} className="mobile-action-btn">
              <ChatBubbleTwoToneIcon fontSize="small" />
              <span className="mobile-action-count">{comments.length}</span>
            </button>
            <button onClick={handleSendClick} className="mobile-action-btn">
              <SendTwoToneIcon fontSize="small" />
            </button>
          </div>
        </div>

        {post.description && (
          <div className="mobile-post-caption">
            <span className="mobile-caption-username" onClick={handleProfileClick}>{post.user?.username}</span>
            <span>{post.description}</span>
          </div>
        )}
      </div>

      {/* Dedicated Mobile Comment Section */}
      {showComments && (
        <div className="mobile-comment-section">
          <div className="mobile-comment-header">Comments ({comments.length})</div>
          <div className="mobile-comments-scroll-list">
            {comments.length > 0 ? (
              comments.map((c) => (
                <div key={c._id} className="mobile-comment-row">
                  <Avatar
                    src={c.user?.profileImage || '/default-avatar.png'}
                    className="mobile-comment-avatar"
                  />
                  <div className="mobile-comment-content">
                    <div className="mobile-comment-user-head">
                      <span className="mobile-comment-author">{c.user?.username || 'User'}</span>
                      <span className="mobile-comment-time">{getRelativeTime(c.createdAt)}</span>
                    </div>
                    <p className="mobile-comment-text">{c.text}</p>
                  </div>
                  {(c.user?._id === loggedInUser?._id || loggedInUser?.isAdmin) && (
                    <IconButton size="small" onClick={() => handleDeleteComment(c._id)} style={{ color: '#ff4757' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.8rem', opacity: 0.6, padding: '4px 0' }}>No comments yet.</div>
            )}
          </div>

          {/* Touch-Optimized Comment Input Bar */}
          <div className="mobile-comment-input-bar">
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              className="mobile-comment-input-field"
            />
            <button onClick={handleAddComment} className="mobile-comment-send-btn">
              <SendIcon style={{ fontSize: 16 }} />
            </button>
          </div>
        </div>
      )}

      {/* Share Dialog */}
      <Dialog onClose={() => setOpenSendDialog(false)} open={openSendDialog} className="share-dialog">
        <DialogTitle className="share-dialog-title">Send post to...</DialogTitle>
        <List className="share-followers-list">
          {followers.map(follower => (
            <ListItem button onClick={() => handleFollowerSelect(follower)} key={follower.id} className="share-follower-item">
              <ListItemAvatar>
                <Avatar src={follower.profileImage} />
              </ListItemAvatar>
              <ListItemText primary={follower.name} />
            </ListItem>
          ))}
        </List>
      </Dialog>
    </div>
  );
};

export default MobilePost;
