import React, { useState, useEffect } from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import './Notification.css';
import API_BASE_URL from './config';

export default function Notification() {
  // Use state for currentUser so that updates trigger re-render.
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
      console.log('Fetched follow requests:', data);
      setPendingRequests(data.pendingFollowRequests || []);
      setAcceptedRequests(data.acceptedFollowRequests || []);
    } catch (error) {
      console.error('Error fetching follow requests:', error);
      setPendingRequests([]);
      setAcceptedRequests([]);
    }
  };

  // Set up an event listener so that when "userUpdated" is dispatched, we update the user and refetch notifications.
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

  // Handle Accept: calls the accept endpoint (which moves the request from pending to accepted).
  const handleAccept = async (requesterId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${currentUser._id}/followRequest/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: requesterId.toString() }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Accepted! Now click 'Follow Back' to complete the mutual follow.");
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

  // Handle Follow Back: calls the followBack endpoint, which removes the request from accepted.
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
    return <div>Please log in to see notifications.</div>;
  }

  return (
    <div className="notification-container">
      <h2>Incoming Follower Requests</h2>
      {pendingRequests.length === 0 && acceptedRequests.length === 0 ? (
        <p>No new follower requests</p>
      ) : (
        <>
          {pendingRequests.map((request) => (
            <div key={request._id} className="notification-item">
              <Avatar alt={request.name} src={request.profileImage} className="avatar" />
              <div className="notification-details">
                <div className="notification-text">
                  <span>{request.name}</span> <span className="username">(@{request.username})</span>
                </div>
                <div className="notification-actions">
                  <Button onClick={() => handleAccept(request._id)} variant="contained" color="primary">
                    Accept
                  </Button>
                  <Button onClick={() => handleReject(request._id)} variant="outlined" color="secondary">
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {acceptedRequests.map((request) => (
            <div key={request._id} className="notification-item">
              <Avatar alt={request.name} src={request.profileImage} className="avatar" />
              <div className="notification-details">
                <div className="notification-text">
                  <span>{request.name}</span> <span className="username">(@{request.username})</span>
                </div>
                <div className="notification-actions">
                  <Button onClick={() => handleFollowBack(request._id)} variant="contained" color="success">
                    Follow Back
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
