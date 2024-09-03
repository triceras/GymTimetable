import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Box, TextField, Button, Typography } from '@mui/material';
import axios from 'axios';

const Login = () => {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginFailure = (response) => {
    console.log('Login failed:', response);
    setError('Login failed. Please try again.');
  };

  const handleLoginSuccess = (response) => {
    console.log('Login succeeded:', response);
    navigate('/');
  };

  const handleManualLogin = async () => {
    if (!username || !password) {
      setError('Please enter a username and password.');
      return;
    }

    try {
      await login(username, password);
      handleLoginSuccess();
    } catch (error) {
      console.error('Error logging in:', error);
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  const handleGoogleLogin = async (googleData) => {
    try {
      await googleLogin(googleData);
      handleLoginSuccess();
    } catch (error) {
      console.error('Google login error:', error);
      handleLoginFailure(error);
    }
  };

  return (
    <Box className="login-container" display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh">
      {error && <div className="error-message">{error}</div>}
      <Box display="flex" flexDirection="column" alignItems="flex-start" mb={2} width="300px">
        <Typography variant="body1">Username</Typography>
        <TextField
          fullWidth
          variant="outlined"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          margin="normal"
        />
        <Typography variant="body1">Password</Typography>
        <TextField
          fullWidth
          type="password"
          variant="outlined"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
        />
        <Button variant="contained" color="primary" onClick={handleManualLogin} style={{ marginTop: '20px' }}>
          Login
        </Button>
      </Box>
      <Box mt={4}>
        <GoogleLogin
          onSuccess={handleGoogleLogin}
          onError={handleLoginFailure}
          buttonText="Login with Google"
        />
      </Box>
    </Box>
  );
};

export default Login;
