import React, { useState, useEffect } from 'react';
import { Typography, Menu, MenuItem } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ClassMenu = ({ onSelectClass }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/classes');
      const uniqueClasses = [...new Set(response.data.map(classItem => classItem.name))];
      setClasses(uniqueClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleMouseEnter = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMouseLeave = () => {
    setAnchorEl(null);
  };

  const handleSelectClass = (className) => {
    onSelectClass(className);
    handleMouseLeave();
    navigate('/calendar');
  };

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <Typography
        variant="h6"
        component="div"
        sx={{
          fontFamily: 'Arial, sans-serif',
          fontWeight: 600,
          cursor: 'pointer',
          '&:hover': {
            cursor: 'pointer',
          }
        }}
      >
        Classes
      </Typography>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMouseLeave}
      >
        <MenuItem key="all" onClick={() => handleSelectClass('')}>
          All Classes
        </MenuItem>
        {classes.map((className) => (
          <MenuItem key={className} onClick={() => handleSelectClass(className)}>
            {className}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};

export default ClassMenu;
