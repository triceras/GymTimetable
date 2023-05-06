// src/App.js

import React, { useEffect, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Calendar from './components/Calendar';
import ClassList from './components/ClassList';

const theme = createTheme();

function App() {
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/classes")
      .then((response) => response.json())
      .then((data) => setClasses(data))
      .catch((error) => console.error("Error fetching classes:", error));
  }, []);

  const handleClassUpdated = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/classes");
      const data = await response.json();
      console.log("Classes:", data); 
      setClasses(data);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Gym Class Scheduler
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ marginTop: '2rem' }}>
        <main>
          <Calendar classes={classes} />
        </main>
      </Container>
    </ThemeProvider>
  );
}

export default App;
