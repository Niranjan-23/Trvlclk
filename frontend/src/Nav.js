import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import "./Nav.css";
import logo from "./assets/logo.png";
import API_BASE_URL from "./config";

const Nav = ({ onLinkClick, toggleTheme, isDarkMode, loggedInUser: propUser, handleLogout }) => {
  const storedUser = JSON.parse(localStorage.getItem("loggedInUser") || "null");
  const currentUser = propUser || storedUser;
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

  const navLinkClassName = ({ isActive }) => `nav-item${isActive ? " nav-item-active" : ""}`;

  return (
    <header className="nav-container">
      <div className="nav-left">
        <Link to="/" onClick={onLinkClick} className="logo-link">
          <img src={logo} alt="TrvlClk Logo" className="logo-image" />
        </Link>
        <nav className="nav-center">
          <NavLink to="/" className={navLinkClassName} onClick={onLinkClick} end>
            Home
          </NavLink>
          <NavLink to="/Notification" className={navLinkClassName} onClick={onLinkClick}>
            Notification{notificationCount > 0 && <span className="notif-badge">{notificationCount}</span>}
          </NavLink>
          <NavLink to="/messages" className={navLinkClassName} onClick={onLinkClick}>
            Messages
          </NavLink>
          <NavLink to="/Add-post" className={navLinkClassName} onClick={onLinkClick}>
            Add Post
          </NavLink>
          <NavLink to="/Search" className={navLinkClassName} onClick={onLinkClick}>
            Search
          </NavLink>
          <NavLink to="/ProfileSetting" className={navLinkClassName} onClick={onLinkClick}>
            Profile
          </NavLink>
          <NavLink to="/map" className={navLinkClassName} onClick={onLinkClick}>
            Map
          </NavLink>
        </nav>
      </div>
      <div className="nav-right">
        <button
          aria-label="toggle-theme"
          className="theme-toggle"
          onClick={() => (toggleTheme ? toggleTheme() : document.body.classList.toggle("dark"))}
        >
          {isDarkMode ? "🌙" : "🌞"}
        </button>
        <div className="nav-avatar">
          {currentUser ? (
            <img
              src={currentUser.profileImage || "/default-avatar.png"}
              alt={currentUser.username || "User"}
            />
          ) : (
            <Link to="/" className="nav-cta" onClick={onLinkClick}>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Nav;