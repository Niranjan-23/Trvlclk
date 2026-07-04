import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import './Notification.css';
import API_BASE_URL from './config';

export default function Notification() {
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem('loggedInUser') || 'null')
  );
  const [pendingRequests, setPendingRequests] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [postNotifications, setPostNotifications] = useState([]);

  const fetchNotifications = async () => {
    if (!currentUser || !currentUser._id) return;
    try {
      // 1. Fetch follow requests
      const followReqResponse = await fetch(`${API_BASE_URL}/api/user/${currentUser._id}/followRequests`);
      if (followReqResponse.ok) {
        const data = await followReqResponse.json();
        setPendingRequests(data.pendingFollowRequests || []);
        setAcceptedRequests(data.acceptedFollowRequests || []);
      }

      // 2. Fetch post notifications
      const postNotifResponse = await fetch(`${API_BASE_URL}/api/user/${currentUser._id}/postNotifications`);
      if (postNotifResponse.ok) {
        const data = await postNotifResponse.json();
        setPostNotifications(data.postNotifications || []);

        // Immediately mark post notifications as read when the Notification center is viewed
        const unreadExists = (data.postNotifications || []).some(n => n.isRead === false);
        if (unreadExists) {
          await fetch(`${API_BASE_URL}/api/user/${currentUser._id}/postNotifications/read`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            }
          });
          // Notify Navbar to update its notification count
          window.dispatchEvent(new Event("userUpdated"));
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setPendingRequests([]);
      setAcceptedRequests([]);
      setPostNotifications([]);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleUserUpdated = () => {
      const updatedUser = JSON.parse(localStorage.getItem('loggedInUser') || 'null');
      setCurrentUser(updatedUser);
      fetchNotifications();
    };

    const handlePostNotificationsUpdated = () => {
      fetchNotifications();
    };

    window.addEventListener('userUpdated', handleUserUpdated);
    window.addEventListener('postNotificationsUpdated', handlePostNotificationsUpdated);

    return () => {
      window.removeEventListener('userUpdated', handleUserUpdated);
      window.removeEventListener('postNotificationsUpdated', handlePostNotificationsUpdated);
    };
  }, [currentUser?._id]);

  const handleAccept = async (requesterId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${currentUser._id}/followRequest/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: requesterId.toString() }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Accepted! Now click 'Follow Back' to complete mutual follow.");
        localStorage.setItem('loggedInUser', JSON.stringify(data.user));
        window.dispatchEvent(new Event('userUpdated'));
        fetchNotifications();
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Error accepting follow request:", error);
    }
  };

  const handleReject = async (requesterId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${currentUser._id}/followRequest/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: requesterId.toString() }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Request rejected.");
        fetchNotifications();
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Error rejecting follow request:", error);
    }
  };

  const handleFollowBack = async (requesterId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${currentUser._id}/followBack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: requesterId.toString() }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Followed back successfully!");
        localStorage.setItem('loggedInUser', JSON.stringify(data.user));
        window.dispatchEvent(new Event('userUpdated'));
        fetchNotifications();
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Error following back:", error);
    }
  };

  if (!currentUser) {
    return <div className="notification-container"><p>Please log in to see notifications.</p></div>;
  }

  const formatNotificationTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch (err) {
      return '';
    }
  };

  return (
    <div className="notification-container">
      <h2>Notification Center</h2>
      {pendingRequests.length === 0 && acceptedRequests.length === 0 && postNotifications.length === 0 ? (
        <div className="empty-noti-box">
          <p>No new notifications or follow requests.</p>
        </div>
      ) : (
        <div className="noti-list-box">
          {pendingRequests.map((request) => (
            <div key={request._id} className="notification-item">
              <Avatar alt={request.name} src={request.profileImage} className="noti-avatar" />
              <div className="notification-details">
                <div className="notification-text">
                  <span className="noti-name">{request.name}</span>
                  <span className="noti-user">@{request.username}</span>
                  <p className="noti-subtext">sent you a follow request</p>
                </div>
                <div className="notification-actions">
                  <Button onClick={() => handleAccept(request._id)} className="noti-btn accept-btn">
                    Accept
                  </Button>
                  <Button onClick={() => handleReject(request._id)} className="noti-btn reject-btn">
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {acceptedRequests.map((request) => (
            <div key={request._id} className="notification-item">
              <Avatar alt={request.name} src={request.profileImage} className="noti-avatar" />
              <div className="notification-details">
                <div className="notification-text">
                  <span className="noti-name">{request.name}</span>
                  <span className="noti-user">@{request.username}</span>
                  <p className="noti-subtext">accepted your follow request</p>
                </div>
                <div className="notification-actions">
                  <Button onClick={() => handleFollowBack(request._id)} className="noti-btn followback-btn">
                    Follow Back
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {postNotifications.map((notif) => (
            <div key={notif._id} className="notification-item">
              <Avatar alt={notif.sender?.name} src={notif.sender?.profileImage} className="noti-avatar" />
              <div className="notification-details">
                <div className="notification-text">
                  <div className="noti-name-row">
                    <span className="noti-name">{notif.sender?.name || notif.sender?.username}</span>
                    <span className="noti-user">@{notif.sender?.username}</span>
                  </div>
                  <p className="noti-subtext">shared a new post</p>
                  <span className="noti-time">{formatNotificationTime(notif.createdAt)}</span>
                </div>
                {notif.post && (
                  <div className="notification-post-preview">
                    <Link to={`/posts/${notif.post._id}`}>
                      <img src={notif.post.imageUrl} alt="post preview" className="noti-post-thumb" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
