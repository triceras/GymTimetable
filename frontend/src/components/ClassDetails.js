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
  
    if (!classData || !classData.occurrence || !classData.classItem) {
      console.error("Class data, occurrence data, or class item data is not available");
      return;
    }

    console.log("Class data =>", classData);
  
    const { occurrence, classItem } = classData;

    console.log("ClassItem =>", classItem);
    console.log("ClassItem Name =>", classItem.name);
  
    // Check if there is room in the class
    if (occurrence.current_capacity < occurrence.max_capacity) {
      // Call the API to schedule the class
      try {
        const response = await axios.post(
          "http://localhost:5000/api/classes/schedule",
          {
            class_id: classItem.id,
            occurrence_id: occurrence.id,
            class_name: classItem.name, // Pass the class name to the API
          }
        );
  
        const { message } = response.data;
  
        if (message === "Class scheduled successfully") {
          // Update the occurrence object with the new current_capacity value
          occurrence.current_capacity += 1;
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

  // Check if name of the class is being passed corrrectly
  console.log("classData.classItem:", classData.classItem);

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
          severity={
            schedulingResult === 'success'
              ? 'success'
              : schedulingResult === 'failed'
              ? 'error'
              : 'info' // Add this line to handle the 'full' case
          }
        >
          {schedulingResult === 'success' && classData.classItem
            ? `Class ${classData.classItem.name} scheduled successfully!`
            : schedulingResult === 'failed' && classData.classItem
            ? `Error scheduling class ${classData.classItem.name}. Please try again later.`
            : classData.classItem
            ? `Class ${classData.classItem.name} is full. Please try again later.`
            : `Class data is not available`}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ClassDetails;
