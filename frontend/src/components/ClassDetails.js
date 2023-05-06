// src/components/ClassDetails.js

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
import { format } from "date-fns";

const ClassDetails = ({ open, classData, onClose, onClassUpdated }) => {
  const [schedulingResult, setSchedulingResult] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleScheduleClass = async () => {
    // You need to determine which occurrence you want to schedule.
    // In this example, I'm using the first occurrence, but you should adjust this as needed.
    const occurrenceToSchedule = classData.occurrences[0];

    // Check if there is room in the class
    if (occurrenceToSchedule.current_capacity < occurrenceToSchedule.max_capacity) {
        // Call the API to schedule the class
        try {
            // Replace this URL with the actual backend API endpoint
            const url = `http://localhost:5000/api/classes/schedule`;
            // Using Axios
            const response = await axios.post(url, { class_id: classData.id, occurrence_id: occurrenceToSchedule.id });
            const data = response.data;

            if (data.message === "Class scheduled successfully") {
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

  return (
    <>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{classData.name}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Times: {classData && classData.occurrences
              ? classData.occurrences
                  .map((occurrence) =>
                    format(new Date(`1970-01-01T${occurrence.time}Z`), "hh:mm aa")
                  )
                  .join(", ")
              : ''}
            <br />
            Current capacity: {classData && classData.occurrences && classData.occurrences[0] ? `${classData.occurrences[0].current_capacity}/${classData.occurrences[0].max_capacity}` : ''}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          {schedulingResult !== 'full' && (
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
            ? `Class ${classData.name} successfully scheduled!`
            : schedulingResult === 'full'
            ? `Class ${classData.name} is fully booked. Please check the timetable for other available classes.`
            : `Something : Something went wrong. Please try again.`}
            </Alert>
          </Snackbar>
        </>
      );
    };
    
export default ClassDetails;
