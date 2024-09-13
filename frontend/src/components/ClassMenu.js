// src/components/ClassMenu.js
import React, { useState } from 'react';
import { Typography, Menu, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ClassMenu = ({ classes, onSelectClass, sx }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

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
          ...sx,
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
        <MenuItem key="all" onClick={() => handleSelectClass('All Classes')}>
          All Classes
        </MenuItem>
        {classes.map((classItem) => (
          <MenuItem key={classItem.id} onClick={() => handleSelectClass(classItem.name)}>
            {classItem.name}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};

export default ClassMenu;
