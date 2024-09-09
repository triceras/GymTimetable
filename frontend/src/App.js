import React, { useEffect, useState, useCallback } from 'react';
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
import Bookings from './components/Bookings';
import Box from '@mui/material/Box';
import ManageUsers from './components/ManageUsers';
import ManageClasses from './components/ManageClasses';
import AdminMenu from './components/AdminMenu';
import { API_BASE_URL } from './config';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
  },
});

function App() {
  const { isAuthenticated, isAdmin, logout, isLoading } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState([]);


  const fetchClasses = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/classes`);
        console.log('Fetched classes:', response.data);
        setClasses(response.data);
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses, isLoading]);

  const handleLogout = () => {
    console.log('Logging out');
    logout();
  };

  const handleSelectClass = (className) => {
    setSelectedClass(className === 'All Classes' ? '' : className);
  };

  const handleClassesUpdated = () => {
    fetchClasses();
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ mr: 2 }}>
            Gym Class Scheduler
          </Typography>
          {isAuthenticated && (
            <>
              <ClassMenu 
                onSelectClass={handleSelectClass} 
                classes={classes}
                selectedClass={selectedClass}
              />
              <Box sx={{ flexGrow: 1 }} />
              {isAdmin && (
                <Box sx={{ mr: 4 }}>
                  <AdminMenu sx={{ fontSize: '2rem', fontWeight: 'bold' }} />
                </Box>
              )}
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
            <Route
              path="/bookings"
              element={isAuthenticated ? <Bookings /> : <Navigate to="/login" />}
            />
            <Route path="/admin/users" 
              element={isAdmin ? <ManageUsers /> : <Navigate to="/" />} 
            />
            <Route path="/admin/classes" 
              element={isAdmin ? <ManageClasses onClassesUpdated={handleClassesUpdated} /> : <Navigate to="/" />} 
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
