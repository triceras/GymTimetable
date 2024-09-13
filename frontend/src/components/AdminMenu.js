import React from 'react';
import { Button, Menu, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const AdminMenu = ({ sx }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const navigate = useNavigate();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleManageUsers = () => {
    navigate('/admin/users');
    handleClose();
  };

  const handleManageClasses = () => {
    navigate('/admin/classes');
    handleClose();
  };

  return (
    <>
      <Button 
        color="inherit" 
        onClick={handleClick} 
        sx={{ 
          ...sx,
          fontSize: '1rem',
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }}
      >
        Admin
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={handleManageUsers}>Manage Users</MenuItem>
        <MenuItem onClick={handleManageClasses}>Manage Classes</MenuItem>
      </Menu>
    </>
  );
};

export default AdminMenu;
