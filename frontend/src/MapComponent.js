import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import { useLocation, useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import API_BASE_URL from "./config";
import "./MapComponent.css";
import SearchIcon from "@mui/icons-material/Search";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const ChangeView = ({ coords }) => {
  const map = useMap();
  map.setView(coords, map.getZoom(), { animate: false });
  return null;
};

const MapClickHandler = ({ setPosition, setLocationName, fetchPostsForLocation }) => {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await res.json();
        const displayName = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setLocationName(displayName);
        fetchPostsForLocation(displayName, lat, lng);
      } catch (err) {
        console.error("Reverse geocoding failed:", err);
        const fallbackName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setLocationName(fallbackName);
        fetchPostsForLocation(fallbackName, lat, lng);
      }
    },
  });
  return null;
};

const MapComponent = ({ label = "Location is here!", loggedInUser, isDarkMode = true }) => {
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const locationString = routerLocation.state?.location || "";
  const [position, setPosition] = useState([11.0056, 76.9661]); // Coimbatore default
  const [searchQuery, setSearchQuery] = useState(locationString);
  const [locationName, setLocationName] = useState(locationString || "Select a location");
  const [nearbyPosts, setNearbyPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const fetchPostsForLocation = async (locationLabel, latVal, lngVal) => {
    try {
      setLoadingPosts(true);
      const normalizedLocation = String(locationLabel || "").trim();
      const targetLat = latVal !== undefined ? latVal : position[0];
      const targetLng = lngVal !== undefined ? lngVal : position[1];

      let url = `${API_BASE_URL}/api/posts/location/${encodeURIComponent(normalizedLocation || "nearby")}`;
      if (targetLat !== null && targetLng !== null) {
        url += `?lat=${targetLat}&lng=${targetLng}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch nearby posts");

      const data = await response.json();
      setNearbyPosts(data.posts || []);
      if (normalizedLocation) setLocationName(normalizedLocation);
    } catch (error) {
      console.error("Error fetching location posts:", error);
      setNearbyPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    const searchLocation = async () => {
      if (!locationString) {
        fetchPostsForLocation("Coimbatore", 11.0056, 76.9661);
        return;
      }
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
          fetchPostsForLocation(locationString, lat, lon);
        }
      } catch (error) {
        console.error("Error searching location:", error);
      }
    };
    searchLocation();
  }, [locationString]);

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
        fetchPostsForLocation(searchQuery, lat, lon);
      } else {
        setLocationName("Location not found");
      }
    } catch (error) {
      console.error("Error searching location:", error);
    }
  };

  const tileUrl = isDarkMode
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  return (
    <div className="map-wrapper-container">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="map-search-bar">
        <input
          type="text"
          placeholder="Search location (10km radius)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="map-search-input"
        />
        <button type="submit" className="map-search-btn">
          <SearchIcon fontSize="small" />
        </button>
      </form>

      {/* Map Section */}
      <div className="map-canvas-box">
        <MapContainer center={position} zoom={13} style={{ width: "100%", height: "100%" }}>
          <ChangeView coords={position} />
          <MapClickHandler
            setPosition={setPosition}
            setLocationName={setLocationName}
            fetchPostsForLocation={fetchPostsForLocation}
          />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url={tileUrl}
          />
          <Marker position={position}>
            <Popup maxWidth={520} autoPan={true} closeButton={true}>
              <div className="map-popup-card">
                <div className="popup-header-info">
                  <div className="popup-location-title">{locationName}</div>
                  <div className="popup-location-count">
                    {loadingPosts
                      ? "Loading posts..."
                      : `${nearbyPosts.length} post${nearbyPosts.length === 1 ? "" : "s"} within 10km`}
                  </div>
                </div>

                {loadingPosts ? (
                  <div className="popup-status-text">Loading...</div>
                ) : nearbyPosts.length > 0 ? (
                  <div className="posts-grid">
                    {nearbyPosts.map((post) => (
                      <button
                        key={post._id}
                        type="button"
                        onClick={() => navigate(`/posts/${post._id}`)}
                        className="map-popup-post-item"
                      >
                        <img
                          src={post.imageUrl}
                          alt={post.description || post.location || "post"}
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="popup-status-text">
                    No posts found within 10km radius.
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