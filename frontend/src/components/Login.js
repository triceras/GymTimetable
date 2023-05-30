/*
  Use google credentials to log into the App using the Google API
*/
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const { handleUser, handleError } = useAuth();
    const navigate = useNavigate();
  
    const handleLoginFailure = (response) => {
      console.log("Login failed:", response);
      handleError(response);
    };
  
    const handleLoginSuccess = (response) => {
      console.log("Login succeeded:", response);
      handleUser(response);
      navigate('/');
    };
  
    return (
      <GoogleLogin
        clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
        onSuccess={handleLoginSuccess}
        onFailure={handleLoginFailure}
        buttonText="Login"
        className="login-button"
      />
    );
  };
  

export default Login;
