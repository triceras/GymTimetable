import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Typography, List, ListItem, ListItemText, Paper, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar, Alert } from '@mui/material';
import { API_BASE_URL } from '../config';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const { user } = useAuth();

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error.response ? error.response.data : error.message);
      showSnackbar('Failed to fetch bookings. Please try again.', 'error');
    }
  };

  const handleCancelBooking = async () => {
    if (selectedBooking) {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          showSnackbar('You are not authenticated. Please log in again.', 'error');
          return;
        }
        const response = await axios.post(`${API_BASE_URL}/api/classes/cancel`,
          { occurrence_id: selectedBooking.occurrence_id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.success) {
          setIsDialogOpen(false);
          showSnackbar(`You have successfully cancelled your booking for ${selectedBooking.class_name}`, 'success');

          // Update the bookings state
          setBookings(prevBookings => prevBookings.filter(booking => booking.id !== selectedBooking.id));

          // Clear the selectedBooking
          setSelectedBooking(null);
        } else {
          showSnackbar(response.data.message || 'Failed to cancel booking', 'error');
        }
      } catch (error) {
        console.error('Error cancelling class:', error);
        showSnackbar(error.response?.data?.message || 'Failed to cancel class. Please try again.', 'error');
      }
    } else {
      showSnackbar('No booking selected for cancellation.', 'error');
    }
  };

  const handleDialogOpen = (booking) => {
    setSelectedBooking(booking);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>My Bookings</Typography>
      {bookings.length === 0 ? (
        <Typography>You have no bookings.</Typography>
      ) : (
        <List>
          {bookings.map((booking) => (
            <ListItem key={booking.id}>
              <ListItemText
                primary={booking.class_name}
                secondary={`Date: ${booking.date} | Time: ${booking.time}`}
              />
              <Button
                variant="contained"
                color="primary"
                style={{ backgroundColor: '#2196f3', color: '#fff' }}
                onClick={() => handleDialogOpen(booking)}
              >
                Cancel
              </Button>
            </ListItem>
          ))}
        </List>
      )}
      <Dialog open={isDialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this booking?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>No</Button>
          <Button onClick={handleCancelBooking} color="primary">Yes</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default Bookings;
