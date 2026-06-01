import React, { useState, useRef, useEffect } from 'react';
import './Post.css';
import FavoriteTwoToneIcon from '@mui/icons-material/FavoriteTwoTone';
import ChatBubbleTwoToneIcon from '@mui/icons-material/ChatBubbleTwoTone';
import SendTwoToneIcon from '@mui/icons-material/SendTwoTone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Button from '@mui/material/Button';
import Comment from './Comment';
import { Avatar } from '@mui/material';
import API_BASE_URL from './config';
import { useNavigate } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';

const Post = ({ post, loggedInUser, showCommentsByDefault = false }) => {
  const [showComments, setShowComments] = useState(showCommentsByDefault);
  const [postLikes, setPostLikes] = useState(post.likes || []);
  const [followers, setFollowers] = useState([]);
  const [openSendDialog, setOpenSendDialog] = useState(false);
  const postContainerRef = useRef(null);
  const navigate = useNavigate();

  const hasLiked = postLikes.some(id => id.toString() === loggedInUser._id);

  useEffect(() => {
    if (showComments && postContainerRef.current) {
      // Example: adjust comment area height if needed
    }
  }, [showComments]);

  const handleLike = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${post._id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser._id }),
      });
      if (!response.ok) {
        console.error('Error liking post');
        return;
      }
      const data = await response.json();
      setPostLikes(data.post.likes);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleCommentToggle = () => {
    setShowComments(prev => !prev);
  };

  const handleProfileClick = () => {
    if (post.user._id === loggedInUser._id) {
      navigate(`/profile`);
    } else {
      navigate(`/user/${post.user._id}`);
    }
  };

  const fetchFollowers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${loggedInUser._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        console.error("Failed to fetch followers");
        return;
      }
      const data = await response.json();
      const fetchedFollowers = data.user.followers || [];
      const mappedFollowers = fetchedFollowers.map(follower => ({
        id: follower._id,
        name: follower.username || follower.name || "Unknown",
        profileImage: follower.profileImage || '/default-avatar.png'
      }));
      setFollowers(mappedFollowers);
    } catch (error) {
      console.error("Error fetching followers:", error);
    }
  };

  const handleSendClick = () => {
    if (followers.length === 0) {
      fetchFollowers();
    }
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

      if (!response.ok) {
        console.error('Failed to send post preview');
        return;
      }
      
      console.log('Post sent successfully');
      setOpenSendDialog(false);
    } catch (error) {
      console.error("Error sending post preview:", error);
    }
  };

  return (
    <div className="post-wrapper">
      <div className="post-container" ref={postContainerRef}>
        <div className="post-content">
          <img
            src={post.imageUrl || 'https://images.pexels.com/photos/8952192/pexels-photo-8952192.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load'}
            alt="Post content"
          />
          <div className="action-bar">
            <div className="action-buttons">
              <Button onClick={handleLike} disabled={hasLiked} className="action-btn">
                <FavoriteTwoToneIcon fontSize="medium" color={hasLiked ? 'error' : 'inherit'} />
                <span className="count">{postLikes.length}</span>
              </Button>
              <Button onClick={handleCommentToggle} className="action-btn">
                <ChatBubbleTwoToneIcon fontSize="medium" />
              </Button>
              <Button onClick={handleSendClick} className="action-btn">
                <SendTwoToneIcon fontSize="medium" />
              </Button>
            </div>
            <Button onClick={handleProfileClick} className="profile-btn">
              <Avatar
                alt={post.user?.username || 'Unknown'}
                src={post.user?.profileImage || '/default-avatar.png'}
                className="avatar"
                sx={{ width: 30, height: 30 }}
              />
              <span className="profile-name">{post.user?.username || 'Unknown'}</span>
            </Button>
          </div>
          <div className="post-info">
            {post.description && <p className="post-description">{post.description}</p>}
            {post.location && (
              <p
                className="post-location"
                onClick={() => navigate('/map', {
                  state: {
                    location: post.location,
                    latitude: post.latitude,
                    longitude: post.longitude,
                  },
                })}
                style={{ cursor: "pointer", color: "#1976d2", textDecoration: "underline" }}
              >
                <LocationOnIcon fontSize="small" /> {post.location}
              </p>
            )}
          </div>
        </div>
      </div>
      {showComments && (
        <div className="comment-area">
          <Comment postId={post._id} loggedInUser={loggedInUser} />
        </div>
      )}

      <Dialog onClose={() => setOpenSendDialog(false)} open={openSendDialog}>
        <DialogTitle>Select a follower to send the post preview</DialogTitle>
        <List>
          {followers.map(follower => (
            <ListItem button onClick={() => handleFollowerSelect(follower)} key={follower.id}>
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

export default Post;