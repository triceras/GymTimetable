import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/member', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setProfileData(response.data);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };

    if (user) {
      fetchProfileData();
    }
  }, [user]);

  if (!profileData) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>My Profile</Typography>
      <Box my={2}>
        <Typography><strong>Name:</strong> {profileData.name}</Typography>
      </Box>
      <Box my={2}>
        <Typography><strong>Username:</strong> {profileData.username}</Typography>
      </Box>
      <Box my={2}>
        <Typography><strong>Membership Number:</strong> {profileData.membership_number}</Typography>
      </Box>
      <Box my={2}>
        <Typography><strong>Date of Birth:</strong> {profileData.date_of_birth}</Typography>
      </Box>
      <Box my={2}>
        <Typography><strong>Member Since:</strong> {profileData.member_since}</Typography>
      </Box>
    </Paper>
  );
};

export default Profile;