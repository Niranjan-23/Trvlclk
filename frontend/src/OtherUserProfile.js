import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import FavoriteIcon from "@mui/icons-material/Favorite";
import API_BASE_URL from "./config";
import Post from "./Post";
import "./Profile.css";

const OtherUserProfile = ({ user: propUser, loggedInUser, onUserUpdate }) => {
  const { userId } = useParams();
  const [localUser, setLocalUser] = useState(propUser || {});
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const followersRef = useRef(null);
  const followingRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/user/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setLocalUser(data.user);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!propUser && userId) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [userId, propUser]);

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!localUser._id) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/posts/user/${localUser._id}`);
        if (response.ok) {
          const data = await response.json();
          setUserPosts(data.posts || []);
        }
      } catch (error) {
        console.error("Error fetching user posts:", error);
      }
    };
    fetchUserPosts();
  }, [localUser]);

  const isFollowing = localUser.followers?.some(
    (f) => f?._id?.toString() === loggedInUser?._id?.toString()
  );

  const isRequested = localUser.followRequests?.some(
    (req) => req?._id?.toString() === loggedInUser?._id?.toString()
  );

  const handleFollowRequest = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${localUser._id}/followRequest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: loggedInUser._id }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Follow request sent!");
        setLocalUser(data.user);
      }
    } catch (error) {
      console.error("Error sending follow request:", error);
    }
  };

  const handleFollowUnfollow = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${localUser._id}/unfollow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerId: loggedInUser._id }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Unfollowed successfully!");
        setLocalUser(data.user);
        if (onUserUpdate) onUserUpdate();
      }
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
    }
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  const handleClosePost = () => {
    setSelectedPost(null);
  };

  if (loading) return <div className="profile-container"><p>Loading user...</p></div>;
  if (!localUser || !localUser._id) return <div className="profile-container"><p>No user data available</p></div>;

  return (
    <div className="profile-container">
      <div className="profile-header-card">
        <div className="profile-avatar-box">
          <img src={localUser.profileImage} alt="Profile" className="profile-avatar-img" />
        </div>
        <div className="profile-info-box">
          <div className="profile-title-row">
            <h2 className="profile-name">{localUser.name}</h2>
            <div>
              {isFollowing ? (
                <button onClick={handleFollowUnfollow} className="edit-profile-btn unfollow-btn">
                  Unfollow
                </button>
              ) : isRequested ? (
                <button disabled className="edit-profile-btn requested-btn">
                  Requested
                </button>
              ) : (
                <button onClick={handleFollowRequest} className="edit-profile-btn follow-btn">
                  Follow
                </button>
              )}
            </div>
          </div>
          <p className="profile-username">@{localUser.username}</p>
          {localUser.bio && <p className="profile-bio">{localUser.bio}</p>}
          <div className="profile-stats-bar">
            <div className="stat-item">
              <strong>{userPosts.length}</strong> posts
            </div>
            <div className="stat-item clickable" onClick={() => setShowFollowersModal(true)}>
              <strong>{localUser.followers?.length || 0}</strong> followers
            </div>
            <div className="stat-item clickable" onClick={() => setShowFollowingModal(true)}>
              <strong>{localUser.following?.length || 0}</strong> following
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
          </div>
        ))}
      </div>

      {/* Followers Modal */}
      {showFollowersModal && (
        <div className="modal-overlay visible" onClick={() => setShowFollowersModal(false)}>
          <div className="list-container" onClick={(e) => e.stopPropagation()}>
            <div className="list-header">
              <h2>Followers</h2>
              <IconButton onClick={() => setShowFollowersModal(false)} className="modal-close-btn">
                <CloseIcon />
              </IconButton>
            </div>
            <div className="list-content" ref={followersRef}>
              {localUser.followers?.length > 0 ? (
                localUser.followers.map((follower) => (
                  <div key={follower._id} className="list-item">
                    <img src={follower.profileImage} alt={follower.username} />
                    <span>{follower.username}</span>
                  </div>
                ))
              ) : (
                <p>No followers</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <div className="modal-overlay visible" onClick={() => setShowFollowingModal(false)}>
          <div className="list-container" onClick={(e) => e.stopPropagation()}>
            <div className="list-header">
              <h2>Following</h2>
              <IconButton onClick={() => setShowFollowingModal(false)} className="modal-close-btn">
                <CloseIcon />
              </IconButton>
            </div>
            <div className="list-content" ref={followingRef}>
              {localUser.following?.length > 0 ? (
                localUser.following.map((followed) => (
                  <div key={followed._id} className="list-item">
                    <img src={followed.profileImage} alt={followed.username} />
                    <span>{followed.username}</span>
                  </div>
                ))
              ) : (
                <p>No following</p>
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
              loggedInUser={loggedInUser}
              showCommentsByDefault={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OtherUserProfile;
