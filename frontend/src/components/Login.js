import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import Button from '@mui/material/Button';

const Login = () => {
  const { handleUser, handleError, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const handleLoginFailure = (response) => {
    console.log('Login failed:', response);
    setError('Login failed. Please try again.');
    handleError(response);
  };

  const handleLoginSuccess = (response) => {
    console.log('Login succeeded:', response);
    handleUser(response);
    navigate('/');
  };

  const handleLogOut = () => {
    console.log('Logging out');
    logout(); // Use the logout function from useAuth
    navigate('/login');
  };

  return (
    <div className="login-container">
      {' '}
      {error && <div className="error-message"> {error} </div>}{' '}
      <GoogleLogin
        clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
        onSuccess={handleLoginSuccess}
        onFailure={handleLoginFailure}
        onError={handleLoginFailure}
        buttonText="Login"
        className="login-button"
      />{' '}
      {isAuthenticated && (
        <Button
          variant="contained"
          color="secondary"
          onClick={handleLogOut}
          style={{ marginTop: '20px' }}
        >
          {' '}
          Logout{' '}
        </Button>
      )}{' '}
    </div>
  );
};

export default Login;
