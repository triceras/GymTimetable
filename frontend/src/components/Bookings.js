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
  const { user } = useAuth();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(`${API_BASE_URL}/api/bookings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBookings(response.data);
      } catch (error) {
        console.error('Error fetching bookings:', error.response ? error.response.data : error.message);
      }
    };

    fetchBookings();
  }, [user]);

  const handleCancelBooking = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/bookings/cancel', {
        booking_id: selectedBooking.id
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
  
      if (response.data.success) {
        setSnackbarMessage('Booking cancelled successfully');
        setBookings(bookings.filter(booking => booking.id !== selectedBooking.id));
      } else {
        setSnackbarMessage(response.data.message);
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setSnackbarMessage('Failed to cancel booking. Please try again.');
    } finally {
      setSnackbarOpen(true);
      setIsDialogOpen(false);
    }
  };

  const handleDialogOpen = (booking) => {
    setSelectedBooking(booking);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>My Bookings</Typography>
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
        <Alert onClose={handleSnackbarClose} severity="success">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default Bookings;
