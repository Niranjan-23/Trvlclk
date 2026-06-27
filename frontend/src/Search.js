import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import './Search.css';
import API_BASE_URL from './config';

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const sortProfilesByFollowState = (profiles, currentUserId) => {
  if (!Array.isArray(profiles)) return [];
  const getIdList = (value) => (Array.isArray(value) ? value.map((item) => item.toString()) : []);

  return [...profiles].sort((a, b) => {
    const aFollowing = getIdList(a.followers).includes(currentUserId?.toString());
    const bFollowing = getIdList(b.followers).includes(currentUserId?.toString());
    const aRank = aFollowing ? 1 : 0;
    const bRank = bFollowing ? 1 : 0;
    if (aRank !== bRank) return aRank - bRank;
    return (a.name || "").localeCompare(b.name || "");
  });
};

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem('loggedInUser')) || null
  );
  const navigate = useNavigate();

  const fetchCurrentUser = async () => {
    if (!currentUser || !currentUser._id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${currentUser._id}`);
      if (!response.ok) throw new Error('Failed to fetch current user');
      const data = await response.json();
      setCurrentUser(data.user);
      localStorage.setItem('loggedInUser', JSON.stringify(data.user));
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const fetchUsers = async (query) => {
    if (!currentUser || !currentUser._id) {
      setProfiles([]);
      setError('Please log in to search for profiles.');
      return;
    }
    try {
      let url = `${API_BASE_URL}/api/search?excludeId=${currentUser._id}`;
      if (query && query.trim() !== '') {
        url += `&query=${encodeURIComponent(query)}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setProfiles(sortProfilesByFollowState(data.users || [], currentUser?._id));
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setProfiles([]);
      setError('Could not load profiles. Please try again.');
    }
  };

  const debouncedFetchUsers = useCallback(debounce(fetchUsers, 300), [currentUser?._id]);

  useEffect(() => {
    if (currentUser && currentUser._id) {
      fetchCurrentUser();
      fetchUsers('');
    }
  }, [currentUser?._id]);

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    debouncedFetchUsers(query);
  };

  const handleFollow = async (targetId) => {
    if (!currentUser || !currentUser._id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${targetId}/followRequest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId: currentUser._id }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Follow request sent!');
        fetchUsers(searchQuery);
        fetchCurrentUser();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error('Error sending follow request:', err);
    }
  };

  const handleUnfollow = async (targetId) => {
    if (!currentUser || !currentUser._id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${targetId}/unfollow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: currentUser._id }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Unfollowed successfully!');
        setCurrentUser(data.user);
        localStorage.setItem('loggedInUser', JSON.stringify(data.user));
        fetchUsers(searchQuery);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error('Error unfollowing:', err);
    }
  };

  const handleProfileClick = (userId) => {
    if (!userId) return;
    if (userId === currentUser._id) {
      navigate('/ProfileSetting');
    } else {
      navigate(`/user/${userId}`);
    }
  };

  return (
    <div className="search-container">
      <div className="search-header-box">
        <h2>Explore & Search Profiles</h2>
      </div>
      <form onSubmit={(e) => e.preventDefault()} className="search-form">
        <TextField
          id="search-bar"
          className="search-input-field"
          value={searchQuery}
          onChange={handleSearchChange}
          label="Search Profile"
          variant="outlined"
          placeholder="Type a name or username..."
          size="small"
          fullWidth
        />
        <IconButton type="submit" aria-label="search" className="search-btn-icon">
          <SearchIcon style={{ fill: 'currentColor' }} />
        </IconButton>
      </form>
      {error && <div className="error">{error}</div>}
      <div className="profile-box">
        {profiles.length > 0 ? (
          profiles.map((profile) => {
            const isFollowing =
              profile.followers?.map((id) => id.toString()).includes(currentUser._id.toString());
            const isRequested =
              profile.followRequests?.map((id) => id.toString()).includes(currentUser._id.toString());

            return (
              <div
                key={profile._id}
                className="profile-item"
                onClick={() => handleProfileClick(profile._id)}
              >
                <Avatar alt={profile.name} src={profile.profileImage} className="search-avatar" />
                <div className="profile-content">
                  <div className="user-text-info">
                    <span className="profile-name-text">{profile.name}</span>
                    {profile.username && <span className="profile-username-text">@{profile.username}</span>}
                  </div>
                  <div
                    className="button-group"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isFollowing ? (
                      <Button
                        onClick={() => handleUnfollow(profile._id)}
                        size="small"
                        className="search-action-btn unfollow-btn"
                      >
                        Unfollow
                      </Button>
                    ) : isRequested ? (
                      <Button disabled size="small" className="search-action-btn requested-btn">
                        Requested
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleFollow(profile._id)}
                        size="small"
                        className="search-action-btn follow-btn"
                        startIcon={<PersonAddAlt1Icon fontSize="small" />}
                      >
                        Follow
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="no-profiles-text">No profiles found</p>
        )}
      </div>
    </div>
  );
}