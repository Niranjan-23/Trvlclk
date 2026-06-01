import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useParams } from "react-router-dom";
import Nav from "./Nav";
import Post from "./Post";
import LoginPage from "./LoginPage";
import "./App.css";
import AddPost from "./AddPost";
import Search from "./Search";
import Notification from "./Notification";
import SignUp from "./SignUp";
import Profile from "./Profile";
import OtherUserProfile from "./OtherUserProfile";
import EditProfileComponent from "./EditProfileComponent";
import Button from "@mui/material/Button";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { Avatar } from "@mui/material";
import API_BASE_URL from "./config";
import MessageComponent from "./ChatInterface";
import MapComponent from "./MapComponent";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";

// Helper functions to retrieve data from localStorage
const getLoggedInUserFromLocalStorage = () => {
  const user = localStorage.getItem("loggedInUser");
  if (!user || user === "undefined") return null;
  try {
    return JSON.parse(user);
  } catch (error) {
    console.error("Error parsing loggedInUser from localStorage:", error);
    return null;
  }
};

const getTokenFromLocalStorage = () => localStorage.getItem("token") || null;

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!getTokenFromLocalStorage());
  const [loggedInUser, setLoggedInUser] = useState(getLoggedInUserFromLocalStorage());
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [fullUserFetched, setFullUserFetched] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogin = (token, user) => {
    setLoggedInUser(user);
    setIsLoggedIn(true);
    localStorage.setItem("token", token);
    localStorage.setItem("loggedInUser", JSON.stringify(user));
    setFullUserFetched(false);
  };

  const handleSignUp = (token, user) => {
    setLoggedInUser(user);
    setIsLoggedIn(true);
    localStorage.setItem("token", token);
    localStorage.setItem("loggedInUser", JSON.stringify(user));
    setFullUserFetched(false);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem("token");
    localStorage.removeItem("loggedInUser");
    setFullUserFetched(false);
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleEditClick = () => setShowEdit(true);
  const handleCloseEdit = () => setShowEdit(false);

  const handleSaveProfile = (updatedUser) => {
    setLoggedInUser(updatedUser);
    localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));
    setShowEdit(false);
  };

  useEffect(() => {
    const fetchFullUserData = async () => {
      if (loggedInUser && loggedInUser._id && !fullUserFetched) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/user/${loggedInUser._id}`, {
            headers: {
              Authorization: `Bearer ${getTokenFromLocalStorage()}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            console.log("Fetched full user data:", data.user);
            setLoggedInUser(data.user);
            localStorage.setItem("loggedInUser", JSON.stringify(data.user));
            setFullUserFetched(true);
          } else {
            console.error("Failed to fetch full user data:", response.status);
          }
        } catch (error) {
          console.error("Error fetching full user data:", error);
        }
      }
    };
    fetchFullUserData();
  }, [loggedInUser, fullUserFetched]);

  const Home = () => {
    const [timelinePosts, setTimelinePosts] = useState([]);

    useEffect(() => {
      const fetchTimeline = async () => {
        try {
          const url = `${API_BASE_URL}/api/timeline?userId=${loggedInUser._id}`;
          const response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${getTokenFromLocalStorage()}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setTimelinePosts(data.posts || []);
          } else {
            console.error("Failed to fetch timeline posts:", response.status);
          }
        } catch (error) {
          console.error("Error fetching timeline posts:", error);
        }
      };
      if (loggedInUser && loggedInUser._id) {
        fetchTimeline();
      }
    }, [loggedInUser]);

    return (
      <div className="posts-container">
        {timelinePosts.length > 0 ? (
          timelinePosts.map((post, index) => (
            <Post key={index} post={post} loggedInUser={loggedInUser} />
          ))
        ) : (
          <p>No posts to display</p>
        )}
      </div>
    );
  };

  const NewPost = () => (
    <div className="posts-container">
      <AddPost
        user={loggedInUser}
        onPostAdded={() => {
          console.log("New post added, refresh timeline if needed.");
        }}
      />
    </div>
  );

  const SearchProfile = () => (
    <div className="posts-container">
      <Search />
    </div>
  );

  const Noti = () => (
    <div className="posts-container">
      <Notification />
    </div>
  );

  const ProfileComp = ({ userId: propUserId }) => {
    const { userId: paramUserId } = useParams();
    const userId = propUserId || paramUserId;
    const [profileUser, setProfileUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      const fetchUser = async () => {
        if (!userId) {
          setError("No user ID provided");
          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          const response = await fetch(`${API_BASE_URL}/api/user/${userId}`, {
            headers: {
              Authorization: `Bearer ${getTokenFromLocalStorage()}`,
            },
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch user: ${response.status}`);
          }
          const data = await response.json();
          setProfileUser(data.user);
          setError(null);
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchUser();
    }, [userId]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!profileUser) return <div>No user data available</div>;

    return (
      <div className="posts-container">
        <Profile
          key={profileUser._id}
          user={profileUser}
          onUserUpdate={(updatedUser) => {
            setLoggedInUser(updatedUser);
            setProfileUser(updatedUser);
            localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));
          }}
          onEditClick={handleEditClick}
          loggedInUser={loggedInUser}
        />
      </div>
    );
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Router>
      {!isLoggedIn ? (
        <div className="fullscreen-login">
          <Routes>
            <Route path="/" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/SignUp" element={<SignUp onSignUp={handleSignUp} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      ) : (
        <div className={isDarkMode ? "app-container dark" : "app-container light"}>
          {/* Desktop Nav */}
          {!isMobile && <Nav />}
          {/* Mobile Top Bar */}
          {isMobile && (
            <>
              <div className="mobile-topbar">
                <IconButton
                  className="mobile-menu-btn"
                  color="inherit"
                  onClick={() => {
                    setDrawerOpen(true);
                    console.log("Drawer open:", true); // Add this line
                  }}
                  size="large"
                  aria-label="menu"
                >
                  <MoreVertIcon fontSize="large" />
                </IconButton>
                <img
                  src={require("./assets/logo.png")}
                  alt="TrvlClk Logo"
                  className="mobile-logo"
                />
                <div className="mobile-actions">
                  <IconButton onClick={toggleTheme} color="inherit" size="large">
                    {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                  </IconButton>
                  <IconButton onClick={handleLogout} color="inherit" size="large">
                    <Avatar
                      alt={loggedInUser?.username || "User"}
                      src={loggedInUser?.profileImage || "/default-avatar.png"}
                      className="avatar"
                      sx={{ width: 32, height: 32 }}
                    />
                  </IconButton>
                </div>
              </div>
              <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{ style: { width: 240 } }}
              >
                <Nav onLinkClick={() => setDrawerOpen(false)} />
              </Drawer>
              <Routes>
                <Route path="/messages/:recipientId?" element={<MessageComponent loggedInUser={loggedInUser} />} />
                <Route path="/" element={<Home />} />
                <Route path="/Notification" element={<Noti />} />
                <Route path="/Add-post" element={<NewPost />} />
                <Route path="/Search" element={<SearchProfile />} />
                <Route path="/ProfileSetting" element={<ProfileComp userId={loggedInUser._id} />} />
                <Route path="/user/:userId" element={<OtherUserProfile loggedInUser={loggedInUser} />} />
                <Route path="/map" element={<MapComponent loggedInUser={loggedInUser} />} />
                <Route path="*" element={<div>404 - Page Not Found</div>} />
              </Routes>
            </>
          )}
          <div className="main-content">
            {/* Desktop toolbar */}
            {!isMobile && (
              <div className="toolbar">
                <Button onClick={toggleTheme} variant="outlined" color="inherit">
                  {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                </Button>
                <Button onClick={handleLogout} variant="outlined" color="inherit">
                  <Avatar
                    alt={loggedInUser?.username || "User"}
                    src={loggedInUser?.profileImage || "/default-avatar.png"}
                    className="avatar"
                  />
                  Logout
                </Button>
              </div>
            )}
            <Routes>
              {isMobile ? (
                <Route path="*" element={<Home />} />
              ) : (
                <>
                  <Route path="/messages/:recipientId?" element={<MessageComponent loggedInUser={loggedInUser} />} />
                  <Route path="/" element={<Home />} />
                  <Route path="/Notification" element={<Noti />} />
                  <Route path="/Add-post" element={<NewPost />} />
                  <Route path="/Search" element={<SearchProfile />} />
                  <Route path="/ProfileSetting" element={<ProfileComp userId={loggedInUser._id} />} />
                  <Route path="/user/:userId" element={<OtherUserProfile loggedInUser={loggedInUser} />} />
                  <Route path="/map" element={<MapComponent loggedInUser={loggedInUser} />} />
                  <Route path="*" element={<div>404 - Page Not Found</div>} />
                </>
              )}
            </Routes>
            {!isMobile && showEdit && (
              <EditProfileComponent
                user={loggedInUser}
                onClose={handleCloseEdit}
                onSave={handleSaveProfile}
              />
            )}
          </div>
        </div>
      )}
    </Router>
  );
};

export default App;
