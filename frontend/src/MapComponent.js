import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import { useLocation, useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import API_BASE_URL from "./config";
import "./MapComponent.css";

// Fix for default marker icon not showing
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Component to change map view programmatically without changing zoom
const ChangeView = ({ coords }) => {
  const map = useMap();
  map.setView(coords, map.getZoom(), { animate: false });
  return null;
};

// Component to handle map click events (sets position and location name)
const MapClickHandler = ({ setPosition, setLocationName, fetchPostsForLocation }) => {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      console.debug("Map clicked at:", lat, lng);
      setPosition([lat, lng]);

      // Reverse geocode for display name (best-effort)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await res.json();
        const displayName = data.display_name || `${lat}, ${lng}`;
        setLocationName(displayName);
        fetchPostsForLocation(displayName);
      } catch (err) {
        console.error("Reverse geocoding failed:", err);
        setLocationName(`${lat}, ${lng}`);
        fetchPostsForLocation(`${lat}, ${lng}`);
      }
    },
  });
  return null;
};

const MapComponent = ({ label = "Location is here!", loggedInUser }) => {
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const locationString = routerLocation.state?.location || "";
  const [position, setPosition] = useState([11.0056, 76.9661]); // Default to Coimbatore
  const [searchQuery, setSearchQuery] = useState(locationString);
  const [locationName, setLocationName] = useState(locationString || "Select a location");
  const [nearbyPosts, setNearbyPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const fetchPostsForLocation = async (locationLabel) => {
    try {
      setLoadingPosts(true);
      const normalizedLocation = String(locationLabel || "").trim();
      if (!normalizedLocation) {
        setNearbyPosts([]);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/posts/location/${encodeURIComponent(normalizedLocation)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch nearby posts");
      }

      const data = await response.json();
      setNearbyPosts(data.posts || []);
      setLocationName(normalizedLocation);
    } catch (error) {
      console.error("Error fetching location posts:", error);
      setNearbyPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Effect: Search for location on mount if provided
  useEffect(() => {
    const searchLocation = async () => {
      if (!locationString) return;
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
          fetchPostsForLocation(locationString);
        } else {
          console.warn("Location not found:", locationString);
          setLocationName("Location not found");
        }
      } catch (error) {
        console.error("Error searching location:", error);
      }
    };
    searchLocation();
  }, [locationString]);

  // NOTE: posts are intentionally not displayed on this page — Map is shown as full page

  // Handle search form submission
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
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
        fetchPostsForLocation(searchQuery);
      } else {
        console.warn("Search: location not found", searchQuery);
        setLocationName("Location not found");
      }
    } catch (error) {
      console.error("Error searching location:", error);
    }
  };

  // No post list on this page — map-only view

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "calc(100vh - 112px)",
        background: "#f5f5f5",
        overflow: "hidden",
      }}
    >
      {/* Search Bar */}
      <form
        onSubmit={handleSearch}
        style={{
          position: "absolute",
          top: 12,
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
          maxWidth: "calc(100% - 24px)",
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
      <div style={{ width: "100%", height: "100%" }}>
        <MapContainer center={position} zoom={13} style={{ width: "100%", height: "100%" }}>
          <ChangeView coords={position} />
          <MapClickHandler
            setPosition={setPosition}
            setLocationName={setLocationName}
            fetchPostsForLocation={fetchPostsForLocation}
          />
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position}>
            <Popup maxWidth={520} autoPan={true} closeButton={true}>
              <div style={{ width: "min(85vw, 460px)"  }}>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{locationName}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    {loadingPosts
                      ? "Loading posts..."
                      : `${nearbyPosts.length} post${nearbyPosts.length === 1 ? "" : "s"} nearby`}
                  </div>
                </div>

                {loadingPosts ? (
                  <div style={{ padding: 12, textAlign: "center" }}>Loading...</div>
                ) : nearbyPosts.length > 0 ? (
                  <div
                  className="posts-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 10,
                    maxHeight: 280,
                    overflowY: "auto",
                    paddingRight: 4,
                  }}
                >
                    {nearbyPosts.map((post) => (
                      <button
                        key={post._id}
                        type="button"
                        onClick={() => navigate(`/posts/${post._id}`)}
                        style={{
                          padding: 0,
                          borderRadius: 10,
                          overflow: "hidden",
                          border: "1px solid rgba(0,0,0,0.08)",
                          background: "#fff",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <img
                          src={post.imageUrl}
                          alt={post.description || post.location || "post"}
                          style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: 12, textAlign: "center", color: "#666" }}>
                    No posts found for this location.
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
};

export default MapComponent;