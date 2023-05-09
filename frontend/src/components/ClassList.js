// src/components/ClassList.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import ClassDetails from './ClassDetails';
import { format } from "date-fns";

const ClassList = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isClassDetailsOpen, setIsClassDetailsOpen] = useState(false);

  useEffect(() => {
    // Fetch the classes from the API
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      // Replace this URL with the actual backend API endpoint
      const url = 'http://localhost:5000/api/classes';

      // Using Axios
      const response = await axios.get(url);
      setClasses(response.data);

    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleViewDetails = (classItem) => {
    setSelectedClass(classItem);
    setIsClassDetailsOpen(true);
  };

  const handleCloseClassDetails = () => {
    setIsClassDetailsOpen(false);
  };

  const handleClassUpdated = async () => {
    await fetchClasses();
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Available Classes
      </Typography>
      <List>
        {classes.map((classItem, index) => (
          <ListItem key={index}>
            <ListItemText
              primary={classItem.name}
              secondary={`Occurrences: ${classItem.occurrences.map((occurrence) =>
                `${occurrence.day} ${format(new Date(`1970-01-01T${occurrence.time}Z`), "hh:mm aa")}`
              ).join(", ")} | Current capacity: ${classItem.current_capacity}/${classItem.max_capacity}`}
            />
            <ListItemSecondaryAction>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleViewDetails(classItem)}
              >
                View Details
              </Button>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      {selectedClass && (
        <ClassDetails
          open={isClassDetailsOpen}
          classData={selectedClass}
          onClose={handleCloseClassDetails}
          onClassUpdated={handleClassUpdated}
        />
      )}
    </Container>
  );
};

export default ClassList;

