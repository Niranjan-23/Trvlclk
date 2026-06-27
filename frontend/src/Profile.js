import React, { useState, useEffect, useRef } from "react";
import "./Profile.css";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import API_BASE_URL from './config';
import Post from './Post';

const Profile = ({ user, onUserUpdate, onEditClick }) => {
  const [localUser, setLocalUser] = useState(user || {});
  const [userPosts, setUserPosts] = useState([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const followersRef = useRef(null);
  const followingRef = useRef(null);

  useEffect(() => {
    setLocalUser(user || {});
    const fetchUserPosts = async () => {
      if (!user || !user._id) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/posts/user/${user._id}`);
        if (response.ok) {
          const data = await response.json();
          setUserPosts(data.posts || []);
        }
      } catch (error) {
        console.error("Error fetching user posts:", error);
      }
    };
    fetchUserPosts();
  }, [user]);

  const fetchCurrentUser = async () => {
    if (!user || !user._id) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/user/${user._id}`);
      if (!response.ok) throw new Error("Failed to fetch user");
      const data = await response.json();
      setLocalUser({
        ...data.user,
        followers: data.user.followers || [],
        following: data.user.following || [],
      });
      localStorage.setItem("loggedInUser", JSON.stringify(data.user));
    } catch (error) {
      console.error("Error fetching current user:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleUserUpdate = () => fetchCurrentUser();
    window.addEventListener("userUpdated", handleUserUpdate);
    return () => window.removeEventListener("userUpdated", handleUserUpdate);
  }, [user]);

  const handleShowFollowers = async () => {
    await fetchCurrentUser();
    setShowFollowers(true);
  };

  const handleShowFollowing = async () => {
    await fetchCurrentUser();
    setShowFollowing(true);
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  const handleClosePost = () => {
    setSelectedPost(null);
  };

  const handleDeletePost = async (e, postId) => {
    e.stopPropagation();
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: localUser._id }),
      });
      if (response.ok) {
        setUserPosts(userPosts.filter(post => post._id !== postId));
        if (selectedPost && selectedPost._id === postId) {
          setSelectedPost(null);
        }
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const safeUser = {
    ...localUser,
    followers: localUser.followers || [],
    following: localUser.following || [],
  };

  if (!localUser || !localUser._id)
    return <div className="profile-container"><p>No user data available.</p></div>;

  return (
    <div className="profile-container">
      <div className="profile-header-card">
        <div className="profile-avatar-box">
          <img src={safeUser.profileImage} alt="Profile" className="profile-avatar-img" />
        </div>
        <div className="profile-info-box">
          <div className="profile-title-row">
            <h2 className="profile-name">{safeUser.name}</h2>
            <button onClick={onEditClick} className="edit-profile-btn">
              Edit Profile
            </button>
          </div>
          <p className="profile-username">@{safeUser.username}</p>
          {safeUser.bio && <p className="profile-bio">{safeUser.bio}</p>}
          <div className="profile-stats-bar">
            <div className="stat-item">
              <strong>{userPosts.length}</strong> posts
            </div>
            <div className="stat-item clickable" onClick={handleShowFollowers}>
              <strong>{safeUser.followers.length}</strong> followers
            </div>
            <div className="stat-item clickable" onClick={handleShowFollowing}>
              <strong>{safeUser.following.length}</strong> following
            </div>
          </div>
        </div>
      </div>

      <div className="profile-section-title">
        <span>POSTS</span>
      </div>

      <div className="post-grid">
        {userPosts.map((post) => (
          <div className="profile-post-card" key={post._id} onClick={() => handlePostClick(post)}>
            <img src={post.imageUrl} alt="Post" className="profile-post-img" />
            <div className="profile-post-overlay">
              <div className="post-overlay-stat">
                <FavoriteIcon fontSize="small" /> <span>{post.likes?.length || 0}</span>
              </div>
            </div>
            <IconButton
              onClick={(e) => handleDeletePost(e, post._id)}
              className="profile-post-delete-btn"
              size="small"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </div>
        ))}
      </div>

      {/* Followers Modal */}
      {showFollowers && (
        <div className="modal-overlay visible" onClick={() => setShowFollowers(false)}>
          <div className="list-container" onClick={(e) => e.stopPropagation()}>
            <div className="list-header">
              <h2>Followers</h2>
              <IconButton onClick={() => setShowFollowers(false)} className="modal-close-btn">
                <CloseIcon />
              </IconButton>
            </div>
            <div className="list-content" ref={followersRef}>
              {loading ? (
                <p>Loading...</p>
              ) : safeUser.followers.length > 0 ? (
                safeUser.followers.map((follower) => (
                  <div key={follower._id} className="list-item">
                    <img src={follower.profileImage} alt={follower.username} />
                    <span>{follower.username}</span>
                  </div>
                ))
              ) : (
                <p>No followers yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowing && (
        <div className="modal-overlay visible" onClick={() => setShowFollowing(false)}>
          <div className="list-container" onClick={(e) => e.stopPropagation()}>
            <div className="list-header">
              <h2>Following</h2>
              <IconButton onClick={() => setShowFollowing(false)} className="modal-close-btn">
                <CloseIcon />
              </IconButton>
            </div>
            <div className="list-content" ref={followingRef}>
              {loading ? (
                <p>Loading...</p>
              ) : safeUser.following.length > 0 ? (
                safeUser.following.map((followed) => (
                  <div key={followed._id} className="list-item">
                    <img src={followed.profileImage} alt={followed.username} />
                    <span>{followed.username}</span>
                  </div>
                ))
              ) : (
                <p>Not following anyone yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Post Overlay Modal */}
      {selectedPost && (
        <div className="modal-overlay visible" onClick={handleClosePost}>
          <div className="post-overlay-card-wrapper" onClick={(e) => e.stopPropagation()}>
            <button className="post-modal-close-btn" onClick={handleClosePost}>
              &times;
            </button>
            <Post
              post={selectedPost}
              loggedInUser={localUser}
              showCommentsByDefault={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;