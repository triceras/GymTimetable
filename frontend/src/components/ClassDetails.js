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
    if (!classData) {
      console.error("Class data is not available");
      return;
    }
  
    // Find the occurrence with the same id as the clicked event
    const occurrenceToSchedule = classData.classItem.occurrences.find(
      (occurrence) => occurrence.id === classData.occurrence.id
    );
  
    // Check if there is room in the class
    if (
      occurrenceToSchedule.current_capacity <
      occurrenceToSchedule.max_capacity
    ) {
      // Call the API to schedule the class
      try {
        // Replace this URL with the actual backend API endpoint
        const url = `http://localhost:5000/api/classes/schedule`;
        // Using Axios
        const response = await axios.post(url, {
          class_id: classData.id,
          occurrence_id: occurrenceToSchedule.id,
          class_name: classData.name, // Add class name to payload
          current_capacity: occurrenceToSchedule.currentCapacity, // Use occurrenceToSchedule instead of classData
          max_capacity: occurrenceToSchedule.max_capacity, // Use occurrenceToSchedule instead of classData
        });
        const data = response.data;
  
        if (data.message === "Class scheduled successfully") {
          // Update the occurrenceToSchedule object with the new current_capacity value
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

  return (
    <>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{classData.name}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <br />
            Current capacity: {classData && classData.occurrence && classData.occurrence.current_capacity !== undefined && classData.occurrence.max_capacity !== undefined ? `${classData.occurrence.current_capacity}/${classData.occurrence.max_capacity}` : ""}
            <br />
            Occurrence: {classData && classData.occurrence
              ? `${classData.occurrence.day} ${classData.occurrence.time}`
              : ""}
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
            ? `Class ${classData.name} scheduled successfully!` 
            : schedulingResult === 'failed' 
            ? `Error scheduling class ${classData.name}. Please try again later.`
            : `Class ${classData.name} is full. Please try again later.`}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ClassDetails;
