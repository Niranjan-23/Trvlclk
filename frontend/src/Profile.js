import React, { useState, useEffect, useRef } from "react";
import "./Profile.css";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
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
        } else {
          console.error("Failed to fetch user posts");
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
    const handleUserUpdate = () => {
      fetchCurrentUser();
    };
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

  useEffect(() => {
    const handleModalTransition = () => {
      const overlays = document.querySelectorAll('.modal-overlay');
      overlays.forEach(overlay => {
        if (showFollowers || showFollowing || selectedPost) {
          overlay.classList.add('visible');
        } else {
          overlay.classList.remove('visible');
        }
      });
    };
    handleModalTransition();
  }, [showFollowers, showFollowing, selectedPost]);

  const handleDeletePost = async (postId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: localUser._id }),
      });
      if (!response.ok) {
        console.error("Failed to delete post:", response.statusText);
        return;
      }
      await response.json();
      setUserPosts(userPosts.filter(post => post._id !== postId));
      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost(null);
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
    return <div className="profile-container">No user data available.</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-image-wrapper">
          <img src={safeUser.profileImage} alt="Profile" className="profile-image" />
        </div>
        <div className="profile-details">
          <h2 className="profile-name">{safeUser.name}</h2>
          <p className="profile-username">@{safeUser.username}</p>
          <p className="profile-bio">{safeUser.bio}</p>
          <div className="profile-stats">
            <div>
              <strong>{userPosts.length}</strong> Posts
            </div>
            <div onClick={handleShowFollowers} style={{ cursor: "pointer" }}>
              <strong>{safeUser.followers.length}</strong> Followers
            </div>
            <div onClick={handleShowFollowing} style={{ cursor: "pointer" }}>
              <strong>{safeUser.following.length}</strong> Following
            </div>
          </div>
          <button onClick={onEditClick} className="edit-profile-button">
            Edit Profile
          </button>
        </div>
      </div>
      <div className="post-grid">
        {userPosts.map((post) => (
          <div className="post-item" key={post._id}>
            <img
              src={post.imageUrl}
              alt="Post"
              className="post-image"
              onClick={() => handlePostClick(post)}
              style={{ cursor: "pointer" }}
            />
            <IconButton
              onClick={() => handleDeletePost(post._id)}
              style={{ position: "absolute", top: 0, right: 0, background: "none", color: "white" }}
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </div>
        ))}
      </div>

      {/* Followers Modal */}
      {showFollowers && (
        <div className="modal-overlay" onClick={() => setShowFollowers(false)}>
          <div className="list-container" onClick={(e) => e.stopPropagation()}>
            <div className="list-header">
              <h2>Followers</h2>
              <IconButton
                onClick={() => setShowFollowers(false)}
                style={{ position: "absolute", top: 10, right: 10 }}
              >
                <CloseIcon />
              </IconButton>
            </div>
            <div className="list-content" ref={followersRef}>
              {loading ? (
                <p>Loading...</p>
              ) : safeUser.followers.length > 0 ? (
                safeUser.followers.slice(0, 5).map((follower, index) => (
                  <div key={follower._id} className="list-item" style={{ animationDelay: `${index * 0.1}s` }}>
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
        <div className="modal-overlay" onClick={() => setShowFollowing(false)}>
          <div className="list-container" onClick={(e) => e.stopPropagation()}>
            <div className="list-header">
              <h2>Following</h2>
              <IconButton
                onClick={() => setShowFollowing(false)}
                style={{ position: "absolute", top: 10, right: 10 }}
              >
                <CloseIcon />
              </IconButton>
            </div>
            <div className="list-content" ref={followingRef}>
              {loading ? (
                <p>Loading...</p>
              ) : safeUser.following.length > 0 ? (
                safeUser.following.slice(0, 5).map((followed, index) => (
                  <div key={followed._id} className="list-item" style={{ animationDelay: `${index * 0.1}s` }}>
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

      {/* Post Overlay */}
      {selectedPost && (
        <div className="modal-overlay" onClick={handleClosePost}>
          <div className="post-overlay-container" onClick={(e) => e.stopPropagation()}>
            <IconButton
              onClick={handleClosePost}
              style={{ position: "absolute", top: 10, right: 10, zIndex: 1000, color: "white" }}
            >
              <CloseIcon />
            </IconButton>
            <Post
              post={selectedPost}
              loggedInUser={localUser}
              showCommentsByDefault={true} // Show comments by default in profile
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;