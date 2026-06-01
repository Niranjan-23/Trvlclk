import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "@mui/material/Button";
import Badge from "@mui/material/Badge";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import PersonSearchTwoToneIcon from "@mui/icons-material/PersonSearchTwoTone";
import NotificationsActiveTwoToneIcon from "@mui/icons-material/NotificationsActiveTwoTone";
import AccountCircleTwoToneIcon from "@mui/icons-material/AccountCircleTwoTone";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import RoomOutlinedIcon from "@mui/icons-material/RoomOutlined"; // Import location icon
import API_BASE_URL from "./config";
import "./Nav.css";
import logo from "./assets/logo.png";

const Nav = ({ onLinkClick }) => {
  const currentUser = JSON.parse(localStorage.getItem("loggedInUser") || "null");
  const [notificationCount, setNotificationCount] = useState(0);

  const fetchNotificationCount = async () => {
    if (!currentUser || !currentUser._id) {
      setNotificationCount(0);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${currentUser._id}/followRequests`);
      if (!response.ok) {
        throw new Error("Failed to fetch follow requests");
      }
      const data = await response.json();
      setNotificationCount(data.pendingFollowRequests?.length || 0);
    } catch (error) {
      console.error("Error fetching notification count:", error);
      setNotificationCount(0);
    }
  };

  useEffect(() => {
    fetchNotificationCount();
    const handleUserUpdated = () => fetchNotificationCount();
    window.addEventListener("userUpdated", handleUserUpdated);
    return () => window.removeEventListener("userUpdated", handleUserUpdated);
  }, [currentUser?._id]);

  return (
    <div className="nav-container">
      <Link to="/">
        <img src={logo} alt="TrvlClk Logo" className="logo-image" />
      </Link>
      <div className="nav-links">
        <Link to="/" className="nav-link" onClick={onLinkClick}>
          <Button className="nav-button" color="success" variant="text">
            <HomeRoundedIcon fontSize="large" />
            Home
          </Button>
        </Link>
        <Link to="/Notification" className="nav-link" onClick={onLinkClick}>
          <Button color="success" className="nav-button" variant="text">
            <Badge badgeContent={notificationCount} color="error">
              <NotificationsActiveTwoToneIcon fontSize="large" />
            </Badge>
            Notification
          </Button>
        </Link>
        <Link to="/messages" className="nav-link" onClick={onLinkClick}>
          <Button color="success" className="nav-button" variant="text">
            <ChatBubbleOutlineIcon fontSize="large" />
            Messages
          </Button>
        </Link>
        <Link to="/Add-post" className="nav-link" onClick={onLinkClick}>
          <Button color="success" className="nav-button" variant="text">
            <AddBoxOutlinedIcon fontSize="large" />
            Add Post
          </Button>
        </Link>
        <Link to="/Search" className="nav-link" onClick={onLinkClick}>
          <Button color="success" className="nav-button" variant="text">
            <PersonSearchTwoToneIcon fontSize="large" />
            Search
          </Button>
        </Link>
        <Link to="/ProfileSetting" className="nav-link" onClick={onLinkClick}>
          <Button color="success" className="nav-button" variant="text">
            <AccountCircleTwoToneIcon fontSize="large" />
            Profile
          </Button>
        </Link>
        {/* Map Button Added */}
        <Link to="/map" className="nav-link" onClick={onLinkClick}>
          <Button color="success" className="nav-button" variant="text">
            <RoomOutlinedIcon fontSize="large" />
            Map
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Nav;