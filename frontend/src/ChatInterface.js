import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import Avatar from "@mui/material/Avatar";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CloseIcon from "@mui/icons-material/Close";
import ReplyIcon from "@mui/icons-material/Reply";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import API_BASE_URL from "./config";
import "./ChatInterface.css";
import Post from "./Post"; // Import the Post component

const ChatInterface = ({ loggedInUser }) => {
  const { recipientId } = useParams();
  const [allFollowers, setAllFollowers] = useState([]);
  const [chatUsers, setChatUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteFor, setShowDeleteFor] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null); // State for selected post
  const [replyTo, setReplyTo] = useState(null);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const [firstUnreadMessageId, setFirstUnreadMessageId] = useState(null);
  const searchRef = useRef(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const firstUnreadRef = useRef(null);
  const hasScrolledToUnread = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (firstUnreadMessageId && !hasScrolledToUnread.current && firstUnreadRef.current) {
      firstUnreadRef.current.scrollIntoView({ behavior: "auto", block: "center" });
      hasScrolledToUnread.current = true;
    } else {
      scrollToBottom();
    }
  }, [messages, firstUnreadMessageId]);

  const reorderChatList = useCallback((targetUserId, latestMsg) => {
    setChatUsers((prevChatUsers) => {
      const index = prevChatUsers.findIndex((u) => u.id === targetUserId);
      if (index === -1) return prevChatUsers;
      const updatedUser = {
        ...prevChatUsers[index],
        messages: [...(prevChatUsers[index].messages || []), latestMsg],
      };
      const filtered = prevChatUsers.filter((u) => u.id !== targetUserId);
      return [updatedUser, ...filtered];
    });
  }, []);

  useEffect(() => {
    const socket = io(API_BASE_URL);
    socketRef.current = socket;

    if (loggedInUser && loggedInUser._id) {
      socket.emit("join_user", loggedInUser._id);
    }

    socket.on("receive_message", (data) => {
      console.log("[Socket.io FRONTEND] receive_message event:", data);
      const incomingMsg = data.message || data;
      if (incomingMsg) {
        const isCurrentChat = data.conversationId
          ? data.conversationId === conversationId
          : (incomingMsg.sender === activeChat?.id || incomingMsg.sender === loggedInUser?._id);

        if (isCurrentChat) {
          // If message is from the active chat and from the other user, mark it as read immediately
          if (incomingMsg.sender !== loggedInUser?._id) {
            incomingMsg.isRead = true;
            if (data.conversationId) {
              fetch(`${API_BASE_URL}/api/conversations/${data.conversationId}/read`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId: loggedInUser._id }),
              }).then(() => {
                window.dispatchEvent(new Event("messagesUpdated"));
              });
            }
          }
          setMessages((prevMessages) => {
            if (prevMessages.some((m) => m._id === incomingMsg._id)) {
              return prevMessages;
            }
            return [...prevMessages, incomingMsg];
          });
        }

        const otherUserId =
          incomingMsg.sender === loggedInUser?._id
            ? activeChat?.id
            : incomingMsg.sender;
        if (otherUserId) {
          reorderChatList(otherUserId, incomingMsg);
        }

        // Keep unread messages count on navbar updated
        window.dispatchEvent(new Event("messagesUpdated"));
      }
    });

    socket.on("messages_read", (data) => {
      console.log("[Socket.io FRONTEND] messages_read event:", data);
      if (data && data.conversationId === conversationId) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.sender !== data.userId ? { ...msg, isRead: true } : msg
          )
        );
      }
      setChatUsers((prevChatUsers) =>
        prevChatUsers.map((user) => {
          if (user.conversationId === data.conversationId) {
            return {
              ...user,
              messages: user.messages.map((msg) =>
                msg.sender !== data.userId ? { ...msg, isRead: true } : msg
              ),
            };
          }
          return user;
        })
      );
      window.dispatchEvent(new Event("messagesUpdated"));
    });

    socket.on("delete_message", (data) => {
      console.log("[Socket.io FRONTEND] delete_message event:", data);
      if (data && data.messageId) {
        setMessages((prevMessages) => prevMessages.filter((m) => m._id !== data.messageId));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [loggedInUser?._id, activeChat, conversationId, reorderChatList]);

  useEffect(() => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit("join_conversation", conversationId);
    }
  }, [conversationId]);

  // Helper to format timestamps relative to now
  const formatRelativeTime = (timestamp) => {
    const messageDate = new Date(timestamp);
    const now = new Date();
    const diff = now - messageDate;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  };

  // Helper to fetch conversation for a given follower
  const fetchConversationForFollower = async (follower) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/conversations/${loggedInUser._id}/${follower.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) return { ...follower, messages: [] };
      const data = await response.json();
      if (data.conversation && data.conversation._id) {
        follower.conversationId = data.conversation._id;
      }
      return { ...follower, messages: data.conversation.messages || [] };
    } catch (error) {
      console.error(
        "Error fetching conversation for follower",
        follower.id,
        error
      );
      return { ...follower, messages: [] };
    }
  };

  // Fetch conversations for all followers and return only those with messages
  const fetchConversationsForAllFollowers = async (followers) => {
    const conversationPromises = followers.map((follower) =>
      fetchConversationForFollower(follower)
    );
    const followersWithConversations = await Promise.all(conversationPromises);
    return followersWithConversations
      .filter((follower) => follower.messages.length > 0)
      .sort((a, b) => {
        const lastA = new Date(a.messages[a.messages.length - 1]?.createdAt || 0);
        const lastB = new Date(b.messages[b.messages.length - 1]?.createdAt || 0);
        return lastB - lastA;
      });
  };

  // Fetch followers from the backend
  const fetchFollowers = async () => {
    if (!loggedInUser || !loggedInUser._id) {
      setError("Please log in to view chats.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/user/${loggedInUser._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch user data");
      const data = await response.json();
      const followers = data.user.followers || [];
      const mappedFollowers = followers.map((follower) => ({
        id: follower._id,
        name: follower.username || follower.name || "Unknown",
        profileImage: follower.profileImage || "/default-avatar.png",
      }));
      setAllFollowers(mappedFollowers);
      const followersWithConversations = await fetchConversationsForAllFollowers(
        mappedFollowers
      );
      setChatUsers(followersWithConversations);
      setFilteredUsers(mappedFollowers);

      if (followersWithConversations.length > 0) {
        const initialChat =
          recipientId &&
          followersWithConversations.find((user) => user.id === recipientId)
            ? followersWithConversations.find((user) => user.id === recipientId)
            : followersWithConversations[0];
        setActiveChat(initialChat);
        fetchConversation(initialChat.id);
      }
    } catch (err) {
      console.error("Error fetching followers:", err);
      setError("Could not load chat users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch conversation between loggedInUser and active chat user
  const fetchConversation = async (recipientId) => {
    if (!loggedInUser || !recipientId) return;
    hasScrolledToUnread.current = false;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/conversations/${loggedInUser._id}/${recipientId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch conversation");
      const data = await response.json();
      if (data.conversation && data.conversation._id) {
        setConversationId(data.conversation._id);
      }
      
      const conversationMessages = data.conversation.messages || [];
      setMessages(conversationMessages);

      // Find the first unread message sent by the other user
      const firstUnread = conversationMessages.find(
        (msg) => msg.sender !== loggedInUser._id && msg.isRead === false
      );
      setFirstUnreadMessageId(firstUnread ? firstUnread._id : null);

      // Mark the conversation messages as read in backend
      if (data.conversation && data.conversation._id) {
        fetch(`${API_BASE_URL}/api/conversations/${data.conversation._id}/read`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: loggedInUser._id }),
        })
          .then(() => {
            window.dispatchEvent(new Event("messagesUpdated"));
            // Update local sidebar messages read status
            setChatUsers((prevChatUsers) =>
              prevChatUsers.map((user) => {
                if (user.id === recipientId) {
                  return {
                    ...user,
                    messages: user.messages.map((m) =>
                      m.sender !== loggedInUser._id ? { ...m, isRead: true } : m
                    ),
                  };
                }
                return user;
              })
            );
          })
          .catch((error) => console.error("Error marking messages as read:", error));
      }
    } catch (err) {
      console.error("Error fetching conversation:", err);
      setError("Could not load conversation. Please try again.");
      setMessages([]);
    }
  };

  // Debounce function for search
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const filterUsers = (query) => {
    if (!query || query.trim() === "") {
      setFilteredUsers([]);
      setShowDropdown(false);
    } else {
      const filtered = allFollowers.filter((user) =>
        user.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredUsers(filtered);
      setShowDropdown(true);
    }
  };

  const debouncedFilterUsers = useCallback(debounce(filterUsers, 300), [
    allFollowers,
  ]);

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    debouncedFilterUsers(query);
  };

  const handleSearchSelect = (user) => {
    setActiveChat(user);
    fetchConversation(user.id);
    setSearchQuery("");
    setShowDropdown(false);
    setShowChatOnMobile(true);
  };

  const handlePostClick = async (msg) => {
    try {
      // If the message contains a complete post object
      if (msg.post) {
        setSelectedPost({
          ...msg.post,
          user: msg.post.user || {
            _id: msg.sender,
            username: activeChat?.name,
            profileImage: activeChat?.profileImage
          },
          likes: msg.post.likes || [],
          comments: msg.post.comments || []
        });
        return;
      }

      // If the message contains a postId, fetch the complete post
      if (msg.postId) {
        const response = await fetch(`${API_BASE_URL}/api/posts/${msg.postId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSelectedPost(data.post);
          return;
        }
      }

      // Fallback for simple image messages
      setSelectedPost({
        _id: msg._id || Date.now().toString(),
        imageUrl: msg.imageUrl || msg.text,
        user: {
          _id: msg.sender,
          username: msg.sender === loggedInUser._id ? loggedInUser.username : activeChat?.name,
          profileImage: msg.sender === loggedInUser._id ? loggedInUser.profileImage : activeChat?.profileImage
        },
        likes: [],
        comments: [],
        description: msg.description || "",
        createdAt: msg.createdAt || new Date().toISOString()
      });
    } catch (error) {
      console.error('Error handling post click:', error);
    }
  };

  const handleClosePost = () => {
    setSelectedPost(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectedPost && !event.target.closest('.post-preview')) {
        handleClosePost();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedPost]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sendMessage = async () => {
  if (!newMessage.trim() || !activeChat) return;
  try {
    const payload = {
      senderId: loggedInUser._id,
      recipientId: activeChat.id,
      text: newMessage,
      replyTo: replyTo ? {
        _id: replyTo._id || replyTo.id || Date.now().toString(),
        sender: typeof replyTo.sender === 'object' ? replyTo.sender._id : replyTo.sender,
        text: replyTo.text || (replyTo.messageType === 'image' ? 'Photo' : ''),
        messageType: replyTo.messageType || (isImageUrl(replyTo.text || replyTo.imageUrl) ? 'image' : 'text'),
        imageUrl: replyTo.imageUrl || (replyTo.messageType === 'image' || isImageUrl(replyTo.text) ? (replyTo.imageUrl || replyTo.text) : '')
      } : null,
      messageType: 'text'
    };

    console.log("[DEBUG FRONTEND] sending payload:", payload);
    const response = await fetch(`${API_BASE_URL}/api/conversations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("[DEBUG FRONTEND] backend returned conversation messages:", data.conversation.messages);
      if (data.conversation && data.conversation._id) {
        setConversationId(data.conversation._id);
      }
      setMessages(data.conversation.messages);
      if (data.conversation && data.conversation.messages && activeChat?.id) {
        const lastMsg = data.conversation.messages[data.conversation.messages.length - 1];
        reorderChatList(activeChat.id, lastMsg);
      }
      setNewMessage("");
      setReplyTo(null); // clear reply after sending
      if (!chatUsers.find((user) => user.id === activeChat.id)) {
        const updatedUser = await fetchConversationForFollower(activeChat);
        if (updatedUser.messages.length > 0) {
          setChatUsers((prev) => [...prev, updatedUser]);
        }
      }
    } else {
      console.error("Failed to send message:", response.status);
    }
  } catch (error) {
    console.error("Error sending message:", error);
    const newMsg = {
      id: messages.length + 1,
      text: newMessage,
      sender: loggedInUser._id,
      createdAt: new Date(),
      replyTo: replyTo || null,
    };
    setMessages([...messages, newMsg]);
    setNewMessage("");
    setReplyTo(null); // clear reply even on error fallback
  }
};


  // Function for deleting an individual message using pull
  const deleteMessage = async (messageId) => {
    if (!conversationId) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/conversations/${conversationId}/messages/${messageId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete message");
      }
      const data = await response.json();
      setMessages(data.conversation.messages);
      if (socketRef.current) {
        socketRef.current.emit("delete_message", { conversationId, messageId, recipientId: activeChat?.id });
      }
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  // Helper to check if a string is an image URL
  const isImageUrl = (url) =>
    typeof url === "string" &&
    url.startsWith("https://images.pexels.com");

  // New function to send image messages
  const sendImageMessage = async (imageUrl, postData) => {
    try {
      console.log('Sending image message with post data:', postData);
      
      // Create the complete message data structure
      const messageData = {
        senderId: loggedInUser._id,
        recipientId: activeChat.id,
        text: imageUrl,
        messageType: "image",
        imageUrl: imageUrl,
        postId: postData._id, // Add postId separately
        post: {  // Include complete post object
          _id: postData._id,
          imageUrl: postData.imageUrl,
          description: postData.description,
          location: postData.location,
          user: postData.user,
          likes: postData.likes,
          createdAt: postData.createdAt,
          // Add any other post fields you need
        }
      };

      const response = await fetch(`${API_BASE_URL}/api/conversations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send image message');
      }
      
      const data = await response.json();
      console.log('Message sent successfully with post data:', data);
      
      // Update messages with the new message that includes post data
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages];
        const newMessage = data.conversation.messages[data.conversation.messages.length - 1];
        return [...updatedMessages, newMessage];
      });
    } catch (error) {
      console.error("Error sending image message:", error);
    }
  };

  

  const handleReply = (msg) => {
    setReplyTo(msg);
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  useEffect(() => {
    fetchFollowers();
  }, [loggedInUser, recipientId]);

  useEffect(() => {
    return () => {
      setSelectedPost(null); // Cleanup on unmount
    };
  }, []);

  if (loading) return <div>Loading chats...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className={`chat-interface chat-wrapper ${showChatOnMobile ? "mobile-show-chat" : "mobile-show-list"}`}>
      {/* ===== SIDEBAR ===== */}
      <div className="chat-sidebar">
        <h3>Chats</h3>
        <div className="chat-search" ref={searchRef}>
          <form onSubmit={(e) => e.preventDefault()}>
            <TextField
              id="chat-search-bar"
              className="text"
              value={searchQuery}
              onChange={handleSearchChange}
              label="Search Chats"
              variant="outlined"
              placeholder="Search..."
              size="small"
              style={{ width: "80%" }}
            />
            <IconButton type="submit" aria-label="search">
              <SearchIcon style={{ fill: "currentColor" }} />
            </IconButton>
          </form>
          {showDropdown && filteredUsers.length > 0 && (
            <ul className="search-dropdown">
              {filteredUsers.map((user) => (
                <li
                  key={user.id}
                  onClick={() => handleSearchSelect(user)}
                  className="dropdown-item"
                >
                  <Avatar src={user.profileImage} className="dropdown-avatar" />
                  <span className="dropdown-name">{user.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <ul className="chat-list">
          {chatUsers.length > 0 ? (
            chatUsers.map((user) => {
              const unreadCount = user.messages
                ? user.messages.filter((m) => m.sender !== loggedInUser._id && m.isRead === false).length
                : 0;
              return (
                <li
                  key={user.id}
                  className={activeChat?.id === user.id ? "active" : ""}
                  onClick={() => handleSearchSelect(user)}
                >
                  <Avatar src={user.profileImage} className="sidebar-avatar" />
                  <span className="sidebar-name">{user.name}</span>
                  {unreadCount > 0 && <span className="chat-unread-badge">{unreadCount}</span>}
                </li>
              );
            })
          ) : (
            <li>No chats available</li>
          )}
        </ul>
      </div>

      {/* ===== MAIN CHAT AREA ===== */}
      <div className="chat-main">
        {activeChat ? (
          <>
            <div className="chat-header">
              <IconButton
                className="mobile-back-chat-btn"
                onClick={() => setShowChatOnMobile(false)}
                size="small"
                style={{ marginRight: 8 }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
              <Avatar src={activeChat.profileImage} className="header-avatar" />
              <h2>{activeChat.name}</h2>
            </div>
            <div className="chat-messages">
              {messages.length > 0 ? (
                messages.map((msg, index) => {
                  const isSent = msg.sender === loggedInUser._id;
                  const messageId = msg._id || index;
                  if (msg.replyTo) console.log("[DEBUG FRONTEND RENDER] Rendering message with replyTo:", messageId, msg.replyTo);
                  
                  const showSeparator = firstUnreadMessageId && msg._id === firstUnreadMessageId;

                  return (
                    <React.Fragment key={messageId}>
                      {showSeparator && (
                        <div className="new-messages-separator" ref={firstUnreadRef}>
                          <span>New Messages</span>
                        </div>
                      )}
                      <div
                        className={`message-row ${isSent ? "sent-row" : "received-row"} ${showDeleteFor === messageId ? "active-dropdown" : ""}`}
                      >
                        {!isSent && (
                          <Avatar
                            src={activeChat.profileImage}
                            className="message-avatar"
                          />
                        )}
                        <div className={isSent ? "sent" : "received"}>
                          {/* --- WhatsApp/Instagram style reply preview inside bubble --- */}
                          {msg.replyTo && (msg.replyTo.text || msg.replyTo.imageUrl || msg.replyTo.messageType === 'image') && (
                            <div className="insta-reply-preview">
                              <div className="insta-reply-author">
                                {String(typeof msg.replyTo.sender === 'object' ? msg.replyTo.sender._id : msg.replyTo.sender) === String(loggedInUser._id)
                                  ? "You"
                                  : activeChat?.name || "User"}
                              </div>
                              <div className="insta-reply-snippet">
                                {msg.replyTo.messageType === "image" || isImageUrl(msg.replyTo.text || msg.replyTo.imageUrl) ? (
                                  <div className="insta-reply-media-box">
                                    <span>📷 Photo</span>
                                    {(msg.replyTo.imageUrl || msg.replyTo.text) && (
                                      <img
                                        src={msg.replyTo.imageUrl || msg.replyTo.text}
                                        alt="preview"
                                        className="insta-reply-thumb"
                                      />
                                    )}
                                  </div>
                                ) : (
                                  <span className="insta-reply-text">
                                    {msg.replyTo.text}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          {/* --- End reply preview --- */}
                          <div className="bubble-content">
                            {/* Three dots menu and message content as before */}
                            <div className="message-options">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  setShowDeleteFor(showDeleteFor === messageId ? null : messageId)
                                }
                              >
                                <MoreVertIcon fontSize="small" style={{ color: isSent ? '#fff' : '#666' }} />
                              </IconButton>
                              {showDeleteFor === messageId && (
                                <div
                                  className={`delete-dropdown ${isSent ? "left" : "right"}`}
                                >
                                  <div className="dropdown-arrow" />
                                  <button
                                    className="dropdown-action-btn reply-action-btn"
                                    onClick={() => {
                                      handleReply(msg);
                                      setShowDeleteFor(null);
                                    }}
                                  >
                                    <ReplyIcon fontSize="small" />
                                    <span>Reply</span>
                                  </button>
                                  <button
                                    className="dropdown-action-btn delete-action-btn"
                                    onClick={() => {
                                      deleteMessage(msg._id);
                                      setShowDeleteFor(null);
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                            {/* Message content */}
                            {msg.messageType === "image" || isImageUrl(msg.text) ? (
                              <div className="image-container" onClick={() => handlePostClick(msg)}>
                                <img
                                  src={msg.imageUrl || msg.text}
                                  alt="shared content"
                                  className="chat-image"
                                />
                                {msg.post && (
                                  <div className="image-overlay">
                                    <span>View Post</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span>{msg.text}</span>
                            )}
                            <div className="message-timestamp">
                              {formatRelativeTime(msg.createdAt)}
                            </div>
                          </div>
                        </div>
                        {isSent && (
                          <Avatar
                            src={loggedInUser.profileImage}
                            className="message-avatar"
                          />
                        )}
                      </div>
                    </React.Fragment>
                  );
                })
              ) : (
                <div className="no-messages">Start a convo!</div>
              )}
              <div ref={messagesEndRef} />
            </div>
            {/* WhatsApp / Instagram style Reply Preview Bar above typing input */}
            {replyTo && (
              <div className="reply-bar-container">
                <div className="reply-bar-accent" />
                <div className="reply-bar-content">
                  <div className="reply-bar-author">
                    Replying to {replyTo.sender === loggedInUser._id ? "yourself" : activeChat?.name || "User"}
                  </div>
                  <div className="reply-bar-snippet">
                    {replyTo.messageType === "image" || isImageUrl(replyTo.text || replyTo.imageUrl) ? (
                      <span className="reply-bar-media">
                        📷 Photo
                      </span>
                    ) : (
                      replyTo.text || "Message"
                    )}
                  </div>
                </div>
                {(replyTo.messageType === "image" || isImageUrl(replyTo.text || replyTo.imageUrl)) && (
                  <img
                    src={replyTo.imageUrl || replyTo.text}
                    alt="Reply thumbnail"
                    className="reply-bar-thumb"
                  />
                )}
                <IconButton size="small" onClick={cancelReply} className="reply-bar-close">
                  <CloseIcon fontSize="small" />
                </IconButton>
              </div>
            )}
            <div className="chat-input">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        ) : (
          <div className="chat-main-empty">
            <p>Select a chat to start messaging</p>
          </div>
        )}
      </div>

      {/* Post Preview Modal */}
      {selectedPost && (
        <div 
          className="modal-overlay" 
          onClick={handleClosePost}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div 
            className="post-preview"
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '440px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
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

export default ChatInterface;
