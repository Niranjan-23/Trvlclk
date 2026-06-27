import React, { useState } from "react";
import "./EditProfileComponent.css";
import API_BASE_URL from "./config";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Avatar from "@mui/material/Avatar";

const EditProfileComponent = ({ user, onClose, onSave }) => {
  const [name, setName] = useState(user.name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [profilePicture, setProfilePicture] = useState(user.profileImage || "");

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, profileImage: profilePicture }),
      });
      const data = await response.json();
      if (response.ok) {
        onSave(data.user);
      } else {
        console.error("Error updating profile", data.error);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="edit-profile-container" onClick={(e) => e.stopPropagation()}>
        <div className="edit-profile-header">
          <h2>Edit Profile</h2>
          <IconButton onClick={onClose} className="edit-close-btn">
            <CloseIcon />
          </IconButton>
        </div>

        <div className="edit-avatar-preview-box">
          <Avatar src={profilePicture} className="edit-avatar-img" />
        </div>

        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>

        <div className="form-group">
          <label>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Write a short bio..."
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>Profile Picture URL</label>
          <input
            type="text"
            value={profilePicture}
            onChange={(e) => setProfilePicture(e.target.value)}
            placeholder="Paste image URL"
          />
        </div>

        <div className="button-group">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="save-button" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileComponent;
