// src/App.js

import React, { useEffect, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Calendar from './components/Calendar';
import ClassList from './components/ClassList';
import { useAuth } from "./contexts/AuthContext";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import Login from './components/Login';
import axios from 'axios';

const theme = createTheme();

function App() {
  const { isAuthenticated } = useAuth();

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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Gym Class Scheduler
              </Typography>
              {isAuthenticated ? (
                <GoogleLogin
                  onSuccess={() => {}}
                  render={(renderProps) => (
                    <button onClick={renderProps.onClick} disabled={renderProps.disabled}>
                      Google Login
                    </button>
                  )}
                />
              ) : (
                <Navigate to="/login" replace />
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
      </Router>
    </ThemeProvider>
  );
}

function HomePage({ isAuthenticated, classes }) {
  return isAuthenticated ? (
    <>
      <main>
        <Calendar classes={classes} isAuthenticated={isAuthenticated} />
      </main>
      {/* <ClassList /> */}
    </>
  ) : (
    <Navigate to="/login" replace />
  );
}

export default App;
