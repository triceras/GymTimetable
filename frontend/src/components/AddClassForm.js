import React, { useState } from 'react';
import { TextField, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import axios from 'axios';

const AddClassForm = ({ onClassAdded }) => {
  const [className, setClassName] = useState('');
  const [occurrences, setOccurrences] = useState([{ day: '', time: '', max_capacity: 0 }]);

  const handleAddOccurrence = () => {
    setOccurrences([...occurrences, { day: '', time: '', max_capacity: 0 }]);
  };

  const handleOccurrenceChange = (index, field, value) => {
    const newOccurrences = [...occurrences];
    newOccurrences[index][field] = value;
    setOccurrences(newOccurrences);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/admin/classes', {
        name: className,
        occurrences: occurrences,
        current_capacity: 0
      });
      if (response.data.success) {
        onClassAdded();
        // Reset form
        setClassName('');
        setOccurrences([{ day: '', time: '', max_capacity: 0 }]);
      }
    } catch (error) {
      console.error('Error adding class:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextField
        label="Class Name"
        value={className}
        onChange={(e) => setClassName(e.target.value)}
        fullWidth
        margin="normal"
      />
      {occurrences.map((occurrence, index) => (
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
      <Button type="submit" variant="contained" color="primary">
        Confirm
      </Button>
    </form>
  );
};

export default AddClassForm;
