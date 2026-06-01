import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import './Login.css';
import API_BASE_URL from './config';
import logo from './assets/logo.png'; // Adjust the path to your logo

const SignUp = ({ onSignUp }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Check that all fields are filled
    if (!email || !username || !password || !confirmPassword) {
      setError('All fields are required!');
      return;
    }

    // Client-side email validation
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Client-side password validation: minimum eight characters, at least one letter and one number.
    const passwordRegex = /(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}/;
    if (!passwordRegex.test(password)) {
      setError('Password must be minimum eight characters, at least one letter and one number.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Signup failed');
        return;
      }
      onSignUp(data.token, data.user);
    } catch (err) {
      console.error('Signup error:', err);
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

      {/* SignUp Form */}
      <Container maxWidth="xs" className="login-box">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 3 }}>
          <img src={logo} alt="TrvlClk Logo" className="header-title logo-image1" />
          <p className="words">Create a new account</p>
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
              label="Username"
              variant="standard"
              fullWidth
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
              sx={{ mb: 2 }}
            />
            <TextField
              label="Confirm Password"
              type="password"
              variant="standard"
              fullWidth
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="login-field"
              sx={{ mb: 3 }}
            />
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mb: 2 }}>
              Sign Up
            </Button>
            <Typography variant="body2" className="signup-text" align="center">
              Already have an account? <Link to="/" className="signup-link">Login</Link>
            </Typography>
          </Box>
        </Box>
      </Container>
    </div>
  );
};

export default SignUp;