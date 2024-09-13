import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Checkbox, FormControlLabel } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { API_BASE_URL } from '../config';
import moment from 'moment';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    username: '',
    password: '',
    name: '',
    membership_number: '',
    date_of_birth: null,
    member_since: new Date(),
    is_admin: false
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setCurrentUser({
        ...user,
        password: '',
        date_of_birth: user.date_of_birth ? moment(user.date_of_birth, 'DD/MM/YYYY').format('DD/MM/YYYY') : null,
        member_since: user.member_since ? moment(user.member_since, 'DD/MM/YYYY').format('DD/MM/YYYY') : null
      });
      setIsEditing(true);
    } else {
      setCurrentUser({
        username: '',
        password: '',
        name: '',
        membership_number: '',
        date_of_birth: null,
        member_since: moment().format('DD/MM/YYYY'),
        is_admin: false
      });
      setIsEditing(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setCurrentUser({ ...currentUser, [name]: name === 'is_admin' ? checked : value });
  };

  const handleDateChange = (name, date) => {
    setCurrentUser({
      ...currentUser,
      [name]: date ? moment(date).format('DD/MM/YYYY') : null
    });
  };

  const handleSubmit = async () => {
    try {
      const formattedData = {
        ...currentUser,
        date_of_birth: currentUser.date_of_birth ? moment(currentUser.date_of_birth, 'DD/MM/YYYY').format('DD/MM/YYYY') : null,
        member_since: currentUser.member_since ? moment(currentUser.member_since, 'DD/MM/YYYY').format('DD/MM/YYYY') : null
      };
      console.log('Sending data:', formattedData);
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/api/admin/users`, formattedData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        });
      } else {
        await axios.post(`${API_BASE_URL}/api/admin/users`, formattedData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
        });
      }
      fetchUsers();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving user:', error.response ? error.response.data : error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/admin/users?id=${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (response.status === 200) {
        fetchUsers();
      } else {
        console.error('Unexpected response:', response);
      }
    } catch (error) {
      console.error('Error deleting user:', error.response ? error.response.data : error.message);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div>
        <h2>Manage Users</h2>
        <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>Add New User</Button>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Membership Number</TableCell>
                <TableCell>Date of Birth</TableCell>
                <TableCell>Member Since</TableCell>
                <TableCell>Admin</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.membership_number}</TableCell>
                  <TableCell>{user.date_of_birth ? moment(user.date_of_birth, 'DD/MM/YYYY').format('DD/MM/YYYY') : 'N/A'}</TableCell>
                  <TableCell>{user.member_since ? moment(user.member_since, 'DD/MM/YYYY').format('DD/MM/YYYY') : 'N/A'}</TableCell>
                  <TableCell>{user.is_admin ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <Button onClick={() => handleOpenDialog(user)}>Edit</Button>
                    <Button onClick={() => handleDelete(user.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="username"
              label="Username"
              type="text"
              fullWidth
              value={currentUser.username}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="password"
              label="Password"
              type="password"
              fullWidth
              value={currentUser.password}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="name"
              label="Name"
              type="text"
              fullWidth
              value={currentUser.name}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="membership_number"
              label="Membership Number"
              type="text"
              fullWidth
              value={currentUser.membership_number}
              onChange={handleInputChange}
            />
            <DatePicker
              label="Date of Birth"
              value={currentUser.date_of_birth ? moment(currentUser.date_of_birth, 'DD/MM/YYYY').toDate() : null}
              onChange={(date) => handleDateChange('date_of_birth', date)}
              renderInput={(params) => <TextField {...params} fullWidth margin="dense" />}
              inputFormat="dd/MM/yyyy"
            />

            <DatePicker
              label="Member Since"
              value={currentUser.member_since ? moment(currentUser.member_since, 'DD/MM/YYYY').toDate() : null}
              onChange={(date) => handleDateChange('member_since', date)}
              renderInput={(params) => <TextField {...params} fullWidth margin="dense" />}
              inputFormat="dd/MM/yyyy"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={currentUser.is_admin}
                  onChange={handleInputChange}
                  name="is_admin"
                />
              }
              label="Is Admin"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSubmit}>Save</Button>
          </DialogActions>
        </Dialog>
      </div>
    </LocalizationProvider>
  );
};

export default ManageUsers;
