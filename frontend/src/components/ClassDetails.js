import React, { useState } from 'react';
import axios from 'axios';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import { useAuth } from '../contexts/AuthContext';

const ClassDetails = ({ open, classData, onClose, onClassUpdated }) => {
  const [schedulingResult, setSchedulingResult] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleScheduleClass = async () => {
    if (!isAuthenticated) {
      console.error("User is not authenticated");
      return;
    }

    if (!classData || !classData.classItem) {
      console.error("Class data is not available");
      return;
    }

    const occurrenceToSchedule = classData.classItem.occurrences.find(
      (occurrence) => occurrence.id === classData.occurrence.id
    );

    if (!occurrenceToSchedule) {
      console.error("Occurrence not found");
      return;
    }

    if (occurrenceToSchedule.current_capacity < occurrenceToSchedule.max_capacity) {
      try {
        const url = `http://localhost:5000/api/classes/schedule`;
        const response = await axios.post(url, {
          class_id: classData.classItem.id,
          occurrence_id: occurrenceToSchedule.id,
          class_name: classData.classItem.name,
          current_capacity: occurrenceToSchedule.current_capacity,
          max_capacity: occurrenceToSchedule.max_capacity,
        });
        const data = response.data;

        if (data.message === "Class scheduled successfully") {
          occurrenceToSchedule.current_capacity += 1;
          setSchedulingResult("success");
          onClassUpdated();
        } else {
          setSchedulingResult("failed");
        }
      } catch (error) {
        console.error("Error scheduling class:", error);
        setSchedulingResult("failed");
      }
    } else {
      setSchedulingResult("full");
    }
    setSnackbarOpen(true);
  };

  const handleClose = () => {
    setSchedulingResult(null);
    onClose();
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  if (!classData || !classData.classItem) {
    return null;
  }

  const isClassFull = classData.occurrence && 
    classData.occurrence.current_capacity >= classData.occurrence.max_capacity;

  return (
    <>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{classData.classItem.name}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Current capacity: {classData.occurrence ? `${classData.occurrence.current_capacity}/${classData.occurrence.max_capacity}` : "N/A"}
            <br />
            Occurrence: {classData.occurrence ? `${classData.occurrence.day} ${classData.occurrence.time}` : "N/A"}
            {isClassFull && (
              <Typography color="error" style={{ marginTop: '10px' }}>
                Sorry. This class is fully booked.
              </Typography>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          {!isClassFull && (
            <Button onClick={handleScheduleClass} color="primary">
              Schedule Class
            </Button>
          )}
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={schedulingResult === 'success' ? 'success' : 'error'}
        >
          {schedulingResult === 'success'
            ? `You successfully booked the ${classData.classItem.name} class!`
            : schedulingResult === 'failed'
            ? `Error scheduling ${classData.classItem.name}. Please try again later.`
            : `${classData.classItem.name} is full. Please try again later.`}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ClassDetails;
