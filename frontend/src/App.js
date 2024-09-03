import React, { useEffect, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import { Routes, Route, Navigate } from 'react-router-dom';
import Calendar from './components/Calendar';
import { useAuth } from "./contexts/AuthContext";
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './components/Login';
import ProfileMenu from './components/ProfileMenu';
import axios from 'axios';
import PropTypes from 'prop-types';
import ClassMenu from './components/ClassMenu';
import Profile from './components/Profile';
import Box from '@mui/material/Box';

const theme = createTheme();

function App() {
  const { isAuthenticated, logout } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    const fetchClasses = async () => {
      if (isAuthenticated) {
        try {
          const response = await axios.get('http://localhost:5000/api/classes');
          setClasses(response.data);
        } catch (error) {
          console.error('Error fetching classes:', error);
        }
      }
    };
  
    fetchClasses();
  }, [isAuthenticated]);

  const handleLogout = () => {
    console.log('Logging out');
    logout();
  };

  const handleSelectClass = (className) => {
    setSelectedClass(className);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ mr: 4 }}>
              Gym Class Scheduler
            </Typography>
            {isAuthenticated && (
              <>
                <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                  <ClassMenu onSelectClass={handleSelectClass} classes={classes} />
                </Box>
                <ProfileMenu onLogout={handleLogout} />
              </>
            )}
          </Toolbar>
        </AppBar>
        <Container maxWidth="md" sx={{ marginTop: '2rem' }}>
          <Routes>
            <Route 
              path="/" 
              element={
                isAuthenticated ? 
                <HomePage classes={classes} selectedClass={selectedClass} /> : 
                <Navigate to="/login" />
              } 
            />
            <Route path="/login" element={<Login />} />
            <Route
              path="/profile"
              element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/calendar" 
              element={
                isAuthenticated ? 
                <Calendar classes={classes} selectedClass={selectedClass} /> : 
                <Navigate to="/login" />
              } 
            />
          </Routes>
        </Container>
      </GoogleOAuthProvider>
    </ThemeProvider>
  );
}

function HomePage({ classes, selectedClass }) {
  return (
    <div>
      <main>
        <Calendar classes={classes} selectedClass={selectedClass} />
      </main>
    </div>
  );
}

HomePage.propTypes = {
  classes: PropTypes.array.isRequired,
  selectedClass: PropTypes.string,
};

export default App;
