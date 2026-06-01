import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import { useLocation } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import MasonryGrid from "./MasonryGrid";
import API_BASE_URL from "./config";

// Fix for default marker icon not showing
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Component to change map view programmatically
const ChangeView = ({ coords }) => {
  const map = useMap();
  map.setView(coords, 13);
  return null;
};

// Component to handle map click events
const MapClickHandler = ({ setPosition, fetchPosts }) => {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      console.debug("Map clicked at:", lat, lng);
      setPosition([lat, lng]);

      // Optionally reverse geocode for display
      let displayName = "";
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await res.json();
        displayName = data.display_name || `${lat}, ${lng}`;
      } catch (err) {
        console.error("Reverse geocoding failed:", err);
        displayName = `${lat}, ${lng}`;
      }

      // Fetch posts for the clicked location
      fetchPosts(lat, lng, displayName);
    },
  });
  return null;
};

const MapComponent = ({ label = "Location is here!", loggedInUser }) => {
  const routerLocation = useLocation();
  const locationString = routerLocation.state?.location || "";
  const [position, setPosition] = useState([11.0056, 76.9661]); // Default to Coimbatore
  const [searchQuery, setSearchQuery] = useState(locationString);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationName, setLocationName] = useState(locationString || "Select a location");

  // Effect: Search for location on mount if provided
  useEffect(() => {
    const searchLocation = async () => {
      if (!locationString) return;
      setLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            locationString
          )}`
        );
        const data = await response.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setPosition([lat, lon]);
          setLocationName(locationString);
          // Fetch posts for the initial location
          fetchPosts(lat, lon, locationString);
        } else {
          setError("Location not found");
        }
      } catch (error) {
        console.error("Error searching location:", error);
        setError("Failed to search location");
      } finally {
        setLoading(false);
      }
    };
    searchLocation();
  }, [locationString]);

  // Function to fetch posts by coordinates
  const fetchPosts = async (lat, lng, displayName) => {
    setLoading(true);
    setError(null);
    setLocationName(displayName);
    try {
      const radius = 10; // Default radius: 10 km
      const response = await fetch(
        `${API_BASE_URL}/api/posts/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch posts");
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
      setError("No posts found for this location");
    } finally {
      setLoading(false);
    }
  };

  // Handle search form submission
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setError("Please enter a valid location");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setPosition([lat, lon]);
        setLocationName(searchQuery);
        // Fetch posts for the searched location
        fetchPosts(lat, lon, searchQuery);
      } else {
        setError("Location not found");
        setPosts([]);
      }
    } catch (error) {
      console.error("Error searching location:", error);
      setError("Failed to search location");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Handler for clicking a post in MasonryGrid
  const handlePostClick = (post) => {
    if (post.geo?.coordinates) {
      const [lng, lat] = post.geo.coordinates; // MongoDB stores [lng, lat]
      setPosition([lat, lng]);
      setLocationName(post.location || `${lat}, ${lng}`);
      fetchPosts(lat, lng, post.location || `${lat}, ${lng}`);
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#f5f5f5", overflowY: "auto" }}>
      {/* Search Bar */}
      <form
        onSubmit={handleSearch}
        style={{
          position: "absolute",
          top: 10,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          backgroundColor: "white",
          padding: "6px 12px",
          borderRadius: 4,
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          width: "300px",
        }}
      >
        <input
          type="text"
          placeholder="Search location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flexGrow: 1, border: "none", outline: "none", fontSize: 16 }}
        />
        <button type="submit" style={{ marginLeft: 8, cursor: "pointer" }}>
          🔍
        </button>
      </form>

      {/* Map Section */}
      <div style={{ width: "100%", height: "50vh" }}>
        <MapContainer center={position} zoom={13} style={{ width: "100%", height: "100%" }}>
          <ChangeView coords={position} />
          <MapClickHandler setPosition={setPosition} fetchPosts={fetchPosts} />
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position}>
            <Popup>{label}</Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Posts Section */}
      <div style={{ padding: "20px" }}>
        <h2>Posts near: {locationName}</h2>
        {loading ? (
          <p>Loading posts...</p>
        ) : error ? (
          <p>{error}</p>
        ) : posts.length > 0 ? (
          <MasonryGrid posts={posts} loggedInUser={loggedInUser} onPostClick={handlePostClick} />
        ) : (
          <p>No posts found for this location.</p>
        )}
      </div>
    </div>
  );
};

export default MapComponent;