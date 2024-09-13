import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Button, TextField, Dialog, DialogActions, DialogContent, 
  DialogTitle, Select, MenuItem, FormControl, InputLabel, Snackbar, 
  Alert, CircularProgress
} from '@mui/material';
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/classes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
      showSnackbar('Failed to fetch classes. Please try again.', 'error');
    } finally {
      setIsLoading(false);
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
      await fetchClasses();
      if (onClassesUpdated) {
        onClassesUpdated();
      }
      showSnackbar('Class deleted successfully');
    } catch (error) {
      console.error('Error deleting class:', error);
      showSnackbar('Failed to delete class. Please try again.', 'error');
    }
  };

  const handleOpenDialog = (classObj = null) => {
    if (classObj) {
      setCurrentClass({
        id: classObj.id,
        name: classObj.name || '',
        instructor: classObj.instructor || '',
        occurrences: classObj.occurrences.map(occ => ({
          id: occ.id,
          day: occ.day,
          time: occ.time,
          max_capacity: occ.max_capacity
        })) || [{ day: '', time: '', max_capacity: 0 }]
      });
      setIsEditing(true);
    } else {
      setCurrentClass({
        name: '',
        instructor: '',
        occurrences: [{ day: '', time: '', max_capacity: 0 }]
      });
      setIsEditing(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentClass({
      name: '',
      instructor: '',
      occurrences: [{ day: '', time: '', max_capacity: 0 }]
    });
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentClass(prevState => ({ ...prevState, [name]: value }));
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
        await axios.put(`${API_BASE_URL}/api/admin/classes/${currentClass.id}`, currentClass, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        });
      } else {
        await axios.post(`${API_BASE_URL}/api/admin/classes`, currentClass, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        });
      }
      await fetchClasses();
      if (onClassesUpdated) {
        onClassesUpdated();
      }
      handleCloseDialog();
      showSnackbar(isEditing ? 'Class updated successfully' : 'Class added successfully');
    } catch (error) {
      console.error('Error saving class:', error.response ? error.response.data : error.message);
      showSnackbar('Error saving class', 'error');
    }
  };

  return (
    <div>
      <Button variant="contained" color="primary" onClick={() => handleOpenDialog()} style={{ marginBottom: '20px' }}>
        Add New Class
      </Button>
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">No classes found.</TableCell>
              </TableRow>
            ) : (
              classes.map((classItem) => (
                <TableRow key={classItem.id}>
                  <TableCell>{classItem.name}</TableCell>
                  <TableCell>{classItem.instructor}</TableCell>
                  <TableCell>
                    {classItem.occurrences.map((occ, index) => (
                      <div key={index}>{`${occ.day} at ${occ.time}, Max: ${occ.max_capacity}`}</div>
                    ))}
                  </TableCell>
                  <TableCell>
                    <Button onClick={() => handleOpenDialog(classItem)}>Edit</Button>
                    <Button onClick={() => handleDelete(classItem.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
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
          {currentClass.occurrences.map((occ, index) => (
            <div key={index}>
              <FormControl fullWidth margin="dense">
                <InputLabel>Day</InputLabel>
                <Select
                  value={occ.day}
                  onChange={(e) => handleOccurrenceChange(index, 'day', e.target.value)}
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <MenuItem key={day} value={day}>{day}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                margin="dense"
                label="Time"
                type="time"
                fullWidth
                value={occ.time}
                onChange={(e) => handleOccurrenceChange(index, 'time', e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 300, // 5 min
                }}
              />
              <TextField
                margin="dense"
                label="Max Capacity"
                type="number"
                fullWidth
                value={occ.max_capacity}
                onChange={(e) => handleOccurrenceChange(index, 'max_capacity', parseInt(e.target.value))}
              />
            </div>
          ))}
          <Button onClick={handleAddOccurrence}>Add Occurrence</Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit}>{isEditing ? 'Update' : 'Add'}</Button>
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
