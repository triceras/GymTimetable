// src/App.js

import React, { useEffect, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import { Routes, Route, Navigate , useNavigate } from 'react-router-dom';
import Calendar from './components/Calendar';
import { useAuth } from "./contexts/AuthContext";
import { GoogleLoginButton } from 'react-social-login-buttons';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import Login from './components/Login';
import axios from 'axios';
import Button from '@mui/material/Button';


const theme = createTheme();

function App() {
  const { isAuthenticated, handleLoginSuccess, logout } = useAuth();
  const navigate = useNavigate(); 

  // Fetch or obtain the classes data
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/classes');
        const fetchedClasses = response.data;
        setClasses(fetchedClasses);
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };
  
    fetchClasses();
  }, []);

  const handleLogout = () => {
    console.log('Logging out');
    googleLogout();
    logout();
    navigate('/login');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Gym Class Scheduler
              </Typography>
              {isAuthenticated ? (
                <Button variant="contained" color="secondary" onClick={handleLogout}> 
                  Logout
                </Button>
              ) : (
                <GoogleLogin
                  onSuccess={handleLoginSuccess}
                  render={(renderProps) => (
                      <GoogleLoginButton onClick={renderProps.onClick} disabled={renderProps.disabled} />
                  )}
                />
              )}
            </Toolbar>
          </AppBar>
          <Container maxWidth="md" sx={{ marginTop: '2rem' }}>
            <Routes>
              <Route path="/" element={<HomePage isAuthenticated={isAuthenticated} classes={classes} />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </Container>
        </GoogleOAuthProvider>
    </ThemeProvider>
  );
}

function HomePage({ isAuthenticated, classes }) {
  return isAuthenticated ? (
    <div> 
      <main>
        <Calendar classes={classes} isAuthenticated={isAuthenticated} /> 
      </main> 
      {/* <ClassList />  */} 
    </div> 
  ) : (
    <Navigate to="/login" />
  );
}


export default App;
