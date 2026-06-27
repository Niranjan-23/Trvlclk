import React, { useState, useRef, useEffect } from 'react';
import './Post.css';
import MobilePost from './MobilePost';
import FavoriteTwoToneIcon from '@mui/icons-material/FavoriteTwoTone';
import ChatBubbleTwoToneIcon from '@mui/icons-material/ChatBubbleTwoTone';
import SendTwoToneIcon from '@mui/icons-material/SendTwoTone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Button from '@mui/material/Button';
import Comment from './Comment';
import { Avatar, IconButton } from '@mui/material';
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const postContainerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const hasLiked = postLikes.some(id => id.toString() === loggedInUser?._id);

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

  const handleCommentToggle = () => {
    setShowComments(prev => !prev);
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
      if (response.ok) {
        setOpenSendDialog(false);
        alert(`Shared post with ${follower.name}!`);
      }
    } catch (error) {
      console.error("Error sending post preview:", error);
    }
  };

  if (isMobile) {
    return <MobilePost post={post} loggedInUser={loggedInUser} showCommentsByDefault={showCommentsByDefault} />;
  }

  return (
    <div className="post-wrapper">
      <div className="post-container" ref={postContainerRef}>
        {/* Post Top Header */}
        <div className="post-top-header">
          <div className="post-user-info" onClick={handleProfileClick}>
            <Avatar
              alt={post.user?.username || 'Unknown'}
              src={post.user?.profileImage || '/default-avatar.png'}
              className="post-header-avatar"
            />
            <div className="post-user-names">
              <span className="post-author-name">{post.user?.username || 'Unknown'}</span>
              {post.location && (
                <span
                  className="post-location-tag"
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
                  <LocationOnIcon style={{ fontSize: 13 }} /> {post.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Post Image */}
        <div className="post-image-box">
          <img
            src={post.imageUrl || 'https://images.pexels.com/photos/8952192/pexels-photo-8952192.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load'}
            alt="Post content"
          />
        </div>

        {/* Action Bar & Details */}
        <div className="post-bottom-area">
          <div className="post-action-bar">
            <div className="action-buttons-left">
              <button onClick={handleLike} className={`post-action-icon-btn ${hasLiked ? 'liked' : ''}`}>
                <FavoriteTwoToneIcon fontSize="medium" />
                <span className="count">{postLikes.length}</span>
              </button>
              <button onClick={handleCommentToggle} className="post-action-icon-btn">
                <ChatBubbleTwoToneIcon fontSize="medium" />
              </button>
              <button onClick={handleSendClick} className="post-action-icon-btn">
                <SendTwoToneIcon fontSize="medium" />
              </button>
            </div>
          </div>

          {post.description && (
            <div className="post-caption-box">
              <span className="caption-username" onClick={handleProfileClick}>{post.user?.username}</span>
              <span className="caption-text">{post.description}</span>
            </div>
          )}
        </div>
      </div>

      {showComments && (
        <div className="comment-area">
          <Comment postId={post._id} loggedInUser={loggedInUser} />
        </div>
      )}

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

export default Post;