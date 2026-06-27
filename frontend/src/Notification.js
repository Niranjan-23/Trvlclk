import React, { useState, useEffect } from 'react';
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

  const fetchFollowRequests = async () => {
    if (!currentUser || !currentUser._id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${currentUser._id}/followRequests`);
      if (!response.ok) {
        throw new Error('Failed to fetch follow requests');
      }
      const data = await response.json();
      setPendingRequests(data.pendingFollowRequests || []);
      setAcceptedRequests(data.acceptedFollowRequests || []);
    } catch (error) {
      console.error('Error fetching follow requests:', error);
      setPendingRequests([]);
      setAcceptedRequests([]);
    }
  };

  useEffect(() => {
    fetchFollowRequests();

    const handleUserUpdated = () => {
      const updatedUser = JSON.parse(localStorage.getItem('loggedInUser') || 'null');
      setCurrentUser(updatedUser);
      fetchFollowRequests();
    };
    window.addEventListener('userUpdated', handleUserUpdated);
    return () => {
      window.removeEventListener('userUpdated', handleUserUpdated);
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
        fetchFollowRequests();
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
        fetchFollowRequests();
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
        fetchFollowRequests();
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

  return (
    <div className="notification-container">
      <h2>Notification Center</h2>
      {pendingRequests.length === 0 && acceptedRequests.length === 0 ? (
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
        </div>
      )}
    </div>
  );
}
