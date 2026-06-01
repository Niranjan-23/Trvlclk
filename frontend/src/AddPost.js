import React, { useState } from "react";
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
      setPreviewUrl(url);
      setImageUrl(url);
    }
  };

  const handlePost = async () => {
    console.log("Posting with:", { imageUrl, location, latitude, longitude });

    if (!imageUrl?.trim() || !user?._id) {
      console.error("Image URL is empty or user ID is missing");
      alert("Please provide a valid image URL and ensure you are logged in.");
      return;
    }

    if (latitude === null || longitude === null) {
      console.error("Please select a location from the dropdown suggestions.");
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
        console.error("Error adding post:", errorData.error || "Unknown error");
        alert(`Error: ${errorData.error || "Failed to add post"}`);
        return;
      }

      const data = await response.json();
      console.log("Post added successfully:", data.post);

      onPostAdded(data.post); // Pass the new post to the callback

      setPreviewUrl("");
      setImageUrl("");
      setLocation("");
      setDescription("");
      setLatitude(null);
      setLongitude(null);
      setLocationSuggestions([]); // Reset suggestions
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
      console.error("Failed to fetch location suggestions:", err);
      setLocationSuggestions([]);
    }
  };

  return (
    <div className="add-container">
      {previewUrl ? (
        <>
          <img src={previewUrl} alt="Selected Preview" />
          <div className="input-fields">
            <TextField
              label="Description"
              variant="outlined"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              margin="normal"
            />
            <Autocomplete
              freeSolo
              options={locationSuggestions}
              onInputChange={(e, value) => {
                setLocation(value);
                fetchLocationSuggestions(value);
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
                  label="Location"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                />
              )}
            />
          </div>
          <div className="post-button">
            <Button
              type="button"
              size="medium"
              variant="contained"
              startIcon={<FileUploadOutlinedIcon />}
              onClick={handleUploadClick}
              sx={{
                background: "linear-gradient(45deg, #4CAF50, #81C784)",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: "8px",
                boxShadow: "0 3px 6px rgba(0,0,0,0.2)",
                "&:hover": {
                  background: "linear-gradient(45deg, #388E3C, #66BB6A)",
                  boxShadow: "0 5px 10px rgba(0,0,0,0.3)",
                },
              }}
            >
              Change Image
            </Button>
            <Button
              type="button"
              size="medium"
              variant="contained"
              startIcon={<BackupTwoToneIcon />}
              onClick={handlePost}
              sx={{
                background: "linear-gradient(45deg, #1976D2, #42A5F5)",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: "8px",
                boxShadow: "0 3px 6px rgba(0,0,0,0.2)",
                "&:hover": {
                  background: "linear-gradient(45deg, #1565C0, #1E88E5)",
                  boxShadow: "0 5px 10px rgba(0,0,0,0.3)",
                },
              }}
            >
              Post
            </Button>
          </div>
        </>
      ) : (
        <div style={{ gap: "30px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
          <h3>No Image Uploaded</h3>
          <Button
            type="button"
            size="medium"
            variant="contained"
            startIcon={<FileUploadOutlinedIcon />}
            onClick={handleUploadClick}
            sx={{
              background: "linear-gradient(45deg, #FF5722, #FF8A65)",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: "10px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
              "&:hover": {
                background: "linear-gradient(45deg, #E64A19, #F4511E)",
                boxShadow: "0 6px 12px rgba(0,0,0,0.3)",
              },
            }}
          >
            Upload Image
          </Button>
        </div>
      )}
    </div>
  );
}