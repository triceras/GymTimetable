import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Box, TextField, Button, Typography, Container } from '@mui/material';


const Login = () => {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleManualLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter a username and password.');
      return;
    }

    try {
      await login(username, password);
      navigate('/');
    } catch (error) {
      console.error('Error logging in:', error);
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  const handleGoogleLogin = async (googleData) => {
    try {
      await googleLogin(googleData);
      navigate('/');
    } catch (error) {
      console.error('Google login error:', error);
      setError('Google login failed. Please try again.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="calc(100vh - 64px)"
      >
        {error && <Typography color="error" mb={2}>{error}</Typography>}
        <Box component="form" onSubmit={handleManualLogin} width="100%" maxWidth="400px">
          <Typography variant="h6" mb={2}>Username</Typography>
          <TextField
            fullWidth
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
          />
          <Typography variant="h6" mt={2} mb={2}>Password</Typography>
          <TextField
            fullWidth
            type="password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
          />
          <Button 
            type="submit"
            variant="contained" 
            color="primary" 
            fullWidth
            sx={{ mt: 3, mb: 2 }}
          >
            LOGIN
          </Button>
        </Box>
        <Box mt={4}>
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => setError('Google login failed. Please try again.')}
            useOneTap
          />
        </Box>
      </Box>
    </Container>
  );
};

export default Login;
