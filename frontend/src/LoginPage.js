import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import './Login.css';
import API_BASE_URL from './config';
import logo from './assets/logo.png'; // Adjust the path to your logo

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email || !password) {
      setError('Both fields are required!');
      return;
    }
    setError('');

    try {
      console.log("API_BASE_URL:", API_BASE_URL);
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      onLogin(data.token, data.user);
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="login-container">
      {/* Background Video */}
      <video autoPlay muted loop className="background-video">
        <source src="https://videos.pexels.com/video-files/6981411/6981411-hd_1920_1080_25fps.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Login Form */}
      <Container maxWidth="xs" className="login-box">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 3 }}>
          <img src={logo} alt="TrvlClk Logo" className="header-title logo-image1" />
          <p className="words">Welcome Back</p>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
            {error && (
              <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}
            <TextField
              label="Email"
              variant="standard"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-field"
              sx={{ mb: 2 }}
            />
            <TextField
              label="Password"
              type="password"
              variant="standard"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-field"
              sx={{ mb: 3 }}
            />
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mb: 2 }}>
              Login
            </Button>
            <Typography variant="body2" className="signup-text" align="center">
              New here? <Link to="/SignUp" className="signup-link">Sign Up</Link>
            </Typography>
          </Box>
          {/* Footer Message */}
          <Typography
            variant="caption"
            sx={{ mt: 2, color: '#999', textAlign: 'center', fontSize: '0.75rem' }}
          >
            © 2025 TrvlClk | Explore the world.
          </Typography>
        </Box>
      </Container>
    </div>
  );
};

export default LoginPage;