import React, { useState } from "react";
import "./EditProfileComponent.css";
import API_BASE_URL from "./config";

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
        // onSave will update the Profile component state and localStorage.
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
    <div className="overlay">
      <div className="edit-profile-container">
        <h2>Edit Profile</h2>
        <div className="form-group">
          <label>Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Profile Picture URL</label>
          <input
            type="text"
            value={profilePicture}
            onChange={(e) => setProfilePicture(e.target.value)}
          />
        </div>
        <div className="button-group">
          <button className="save-button" onClick={handleSave}>
            Save
          </button>
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileComponent;
