import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import "./Nav.css";
import logo from "./assets/logo.png";
import API_BASE_URL from "./config";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import HomeIcon from "@mui/icons-material/Home";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ChatIcon from "@mui/icons-material/Chat";
import AddBoxIcon from "@mui/icons-material/AddBox";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import MapIcon from "@mui/icons-material/Map";
import LogoutIcon from "@mui/icons-material/Logout";

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
      if (response.ok) {
        const data = await response.json();
        setNotificationCount(data.pendingFollowRequests?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching notification count:", error);
    }
  };

  useEffect(() => {
    fetchNotificationCount();
    const handleUserUpdated = () => fetchNotificationCount();
    window.addEventListener("userUpdated", handleUserUpdated);
    return () => window.removeEventListener("userUpdated", handleUserUpdated);
  }, [currentUser?._id]);

  const navLinkClassName = ({ isActive }) => `sidebar-item${isActive ? " sidebar-item-active" : ""}`;

  return (
    <>
      {/* Mobile Top Header (Visible on Mobile) */}
      <header className="mobile-top-header">
        <Link to="/" onClick={onLinkClick} className="mobile-logo-link">
          <img src={logo} alt="TrvlClk Logo" className="mobile-logo-img" />
        </Link>
        <div className="mobile-header-right">
          <button
            aria-label="toggle-theme"
            className="mobile-icon-btn"
            onClick={() => (toggleTheme ? toggleTheme() : document.body.classList.toggle("dark"))}
          >
            {isDarkMode ? <LightModeIcon style={{ fontSize: 20 }} /> : <DarkModeIcon style={{ fontSize: 20 }} />}
          </button>
          {currentUser && (
            <button className="mobile-icon-btn logout" onClick={handleLogout} title="Logout">
              <LogoutIcon style={{ fontSize: 20 }} />
            </button>
          )}
        </div>
      </header>

      {/* Main Navigation Panel */}
      <aside className="sidebar-container">
        {/* Top Brand Logo */}
        <div className="sidebar-top">
          <Link to="/" onClick={onLinkClick} className="sidebar-logo-link">
            <img src={logo} alt="TrvlClk Logo" className="sidebar-logo-img" />
          </Link>
        </div>

        {/* Vertical Navigation Menu */}
        <nav className="sidebar-menu">
          <NavLink to="/" className={navLinkClassName} onClick={onLinkClick} end>
            <HomeIcon className="sidebar-icon" />
            <span>Home</span>
          </NavLink>
          <NavLink to="/Notification" className={navLinkClassName} onClick={onLinkClick}>
            <NotificationsIcon className="sidebar-icon" />
            <span>Notifications</span>
            {notificationCount > 0 && <span className="sidebar-notif-badge">{notificationCount}</span>}
          </NavLink>
          <NavLink to="/messages" className={navLinkClassName} onClick={onLinkClick}>
            <ChatIcon className="sidebar-icon" />
            <span>Messages</span>
          </NavLink>
          <NavLink to="/Add-post" className={navLinkClassName} onClick={onLinkClick}>
            <AddBoxIcon className="sidebar-icon" />
            <span>Create Post</span>
          </NavLink>
          <NavLink to="/Search" className={navLinkClassName} onClick={onLinkClick}>
            <SearchIcon className="sidebar-icon" />
            <span>Search</span>
          </NavLink>
          <NavLink to="/ProfileSetting" className={navLinkClassName} onClick={onLinkClick}>
            <PersonIcon className="sidebar-icon" />
            <span>Profile</span>
          </NavLink>
          <NavLink to="/map" className={navLinkClassName} onClick={onLinkClick}>
            <MapIcon className="sidebar-icon" />
            <span>Explore Map</span>
          </NavLink>
        </nav>

        {/* Bottom User Controls */}
        <div className="sidebar-bottom">
          <button
            aria-label="toggle-theme"
            className="sidebar-theme-toggle"
            onClick={() => (toggleTheme ? toggleTheme() : document.body.classList.toggle("dark"))}
          >
            {isDarkMode ? <LightModeIcon style={{ fontSize: 18 }} /> : <DarkModeIcon style={{ fontSize: 18 }} />}
            <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>

          {currentUser && (
            <div className="sidebar-user-card" onClick={handleLogout} title="Click to Logout">
              <img
                src={currentUser.profileImage || "/default-avatar.png"}
                alt={currentUser.username || "User"}
                className="sidebar-user-avatar"
              />
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{currentUser.name || currentUser.username}</span>
                <span className="sidebar-user-handle">@{currentUser.username}</span>
              </div>
              <LogoutIcon className="sidebar-logout-icon" fontSize="small" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Nav;