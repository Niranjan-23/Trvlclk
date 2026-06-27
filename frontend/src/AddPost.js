import React, { useState, useRef } from "react";
import Button from "@mui/material/Button";
import BackupTwoToneIcon from "@mui/icons-material/BackupTwoTone";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import TextField from '@mui/material/TextField';
import "./AddPost.css";
import API_BASE_URL from "./config";
import Autocomplete from '@mui/material/Autocomplete';

export default function AddPost({ user, onPostAdded = () => {} }) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const handleUploadClick = () => {
    const url = prompt("Enter Image URL:");
    if (url && url.trim() !== "") {
      setPreviewUrl(url.trim());
      setImageUrl(url.trim());
    }
  };

  const handlePost = async () => {
    if (!imageUrl?.trim() || !user?._id) {
      alert("Please provide a valid image URL and ensure you are logged in.");
      return;
    }

    if (latitude === null || longitude === null) {
      alert("Please select a location from the dropdown suggestions.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          imageUrl: imageUrl.trim(),
          location: location.trim(),
          description: description.trim(),
          latitude,
          longitude,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "Failed to add post"}`);
        return;
      }

      const data = await response.json();
      onPostAdded(data.post);

      setPreviewUrl("");
      setImageUrl("");
      setLocation("");
      setDescription("");
      setLatitude(null);
      setLongitude(null);
      setLocationSuggestions([]);
    } catch (error) {
      console.error("Error adding post:", error);
      alert("Failed to add post. Please try again.");
    }
  };

  const fetchLocationSuggestions = async (query) => {
    if (!query) {
      setLocationSuggestions([]);
      return;
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setLocationSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&accept-language=en`
      );
      const data = await res.json();
      setLocationSuggestions(
        data.map((place) => ({
          label: place.display_name,
          lat: parseFloat(place.lat),
          lon: parseFloat(place.lon),
        }))
      );
    } catch (err) {
      console.debug("Failed to fetch location suggestions:", err);
      setLocationSuggestions([]);
    }
  };

  const debounceRef = useRef(null);
  const debouncedFetchLocationSuggestions = (query) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchLocationSuggestions(query);
    }, 400);
  };

  return (
    <div className="add-container">
      <div className="add-post-header">
        <h2>Create New Post</h2>
      </div>

      {previewUrl ? (
        <div className="post-form-body">
          <div className="preview-image-wrapper">
            <img src={previewUrl} alt="Selected Preview" className="preview-image" />
          </div>
          <div className="input-fields">
            <TextField
              label="Description / Caption"
              variant="outlined"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              className="custom-textfield"
            />
            <Autocomplete
              freeSolo
              options={locationSuggestions}
              onInputChange={(e, value) => {
                setLocation(value);
                debouncedFetchLocationSuggestions(value);
              }}
              onChange={(e, value) => {
                if (typeof value === "string") {
                  setLocation(value);
                  setLatitude(null);
                  setLongitude(null);
                } else if (value) {
                  setLocation(value.label);
                  setLatitude(value.lat);
                  setLongitude(value.lon);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Location"
                  variant="outlined"
                  fullWidth
                  className="custom-textfield"
                />
              )}
            />
          </div>
          <div className="post-button-group">
            <Button
              type="button"
              className="action-btn change-btn"
              startIcon={<FileUploadOutlinedIcon />}
              onClick={handleUploadClick}
            >
              Change Image
            </Button>
            <Button
              type="button"
              className="action-btn submit-btn"
              startIcon={<BackupTwoToneIcon />}
              onClick={handlePost}
            >
              Share Post
            </Button>
          </div>
        </div>
      ) : (
        <div className="upload-placeholder" onClick={handleUploadClick}>
          <div className="upload-icon-box">
            <FileUploadOutlinedIcon style={{ fontSize: 48 }} />
          </div>
          <h3>Select Photo to Share</h3>
          <p>Click here to provide an Image URL</p>
          <Button
            type="button"
            className="action-btn select-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleUploadClick();
            }}
          >
            Upload Photo
          </Button>
        </div>
      )}
    </div>
  );
}