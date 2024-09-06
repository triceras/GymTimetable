import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert } from '@mui/material';
import { API_BASE_URL } from '../config';

const ManageClasses = ({ onClassesUpdated }) => {
  const [classes, setClasses] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentClass, setCurrentClass] = useState({ 
    name: '',
    instructor: '',
    occurrences: [{ day: '', time: '', max_capacity: 0 }]
  });
  const [isEditing, setIsEditing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/classes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
      showSnackbar('Failed to fetch classes. Please try again.', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/classes/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      fetchClasses(); // Refresh the class list
      if (onClassesUpdated) {
        onClassesUpdated(); // Update parent component if necessary
      }
      showSnackbar('Class deleted successfully');
    } catch (error) {
      console.error('Error deleting class:', error);
      showSnackbar('Failed to delete class. Please try again.', 'error');
    }
  };

  const handleOpenDialog = (classItem = null) => {
    if (classItem) {
      setCurrentClass(classItem);
      setIsEditing(true);
    } else {
      setCurrentClass({ name: '', instructor: classItem.instructor, occurrences: [{ day: '', time: '', max_capacity: 0 }] });
      setIsEditing(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentClass({ name: '', instructor: classItem.instructor, occurrences: [{ day: '', time: '', max_capacity: 0 }] });
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentClass(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleOccurrenceChange = (index, field, value) => {
    const newOccurrences = [...currentClass.occurrences];
    newOccurrences[index][field] = value;
    setCurrentClass({ ...currentClass, occurrences: newOccurrences });
  };

  const handleAddOccurrence = () => {
    setCurrentClass({
      ...currentClass,
      occurrences: [...currentClass.occurrences, { day: '', time: '', max_capacity: 0 }]
    });
  };

  const handleSubmit = async () => {
    try {
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/api/admin/classes`, currentClass, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        });
      } else {
        await axios.post(`${API_BASE_URL}/api/admin/classes`, {
          ...currentClass,
          current_capacity: 0
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        });
      }
      await fetchClasses(); // Refresh the class list
      if (onClassesUpdated) {
        onClassesUpdated();
      }
      handleCloseDialog();
      showSnackbar(isEditing ? 'Class updated successfully' : 'Class added successfully');
    } catch (error) {
      console.error('Error saving class:', error);
      showSnackbar('Error saving class', 'error');
    }
  };

  return (
    <div>
      <h2>Manage Classes</h2>
      <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>Add New Class</Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Instructor</TableCell>
              <TableCell>Occurrences</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {classes.map((classItem) => (
              <TableRow key={classItem.id}>
                <TableCell>{classItem.name}</TableCell>
                <TableCell>{classItem.instructor}</TableCell>
                <TableCell>
                  {classItem.occurrences.map((occ, index) => (
                    <div key={index}>{`${occ.day} ${occ.time} (Max: ${occ.max_capacity})`}</div>
                  ))}
                </TableCell>
                <TableCell>
                  <Button onClick={() => handleOpenDialog(classItem)}>Edit</Button>
                  <Button onClick={() => handleDelete(classItem.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{isEditing ? 'Edit Class' : 'Add New Class'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Class Name"
            type="text"
            fullWidth
            value={currentClass.name}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="instructor"
            label="Instructor"
            type="text"
            fullWidth
            value={currentClass.instructor}
            onChange={handleInputChange}
          />
          {currentClass.occurrences.map((occurrence, index) => (
            <div key={index}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Day</InputLabel>
                <Select
                  value={occurrence.day}
                  onChange={(e) => handleOccurrenceChange(index, 'day', e.target.value)}
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <MenuItem key={day} value={day}>{day}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Time"
                value={occurrence.time}
                onChange={(e) => handleOccurrenceChange(index, 'time', e.target.value)}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Max Capacity"
                type="number"
                value={occurrence.max_capacity}
                onChange={(e) => handleOccurrenceChange(index, 'max_capacity', parseInt(e.target.value))}
                fullWidth
                margin="normal"
              />
            </div>
          ))}
          <Button onClick={handleAddOccurrence}>Add Occurrence</Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit}>Confirm</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ManageClasses;