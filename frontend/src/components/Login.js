/*
  Use google credentials to log into the App using the Google API
*/
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import jwt_decode from "jwt-decode";

const Login = () => {
    const { handleUser, handleError } = useAuth();
    const navigate = useNavigate();
  
    const handleLoginFailure = (response) => {
      console.log("Login failed:", response);
      handleError(response);
    };
  

    const handleLoginSuccess = async (credentialResponse) => {
      const { credential } = credentialResponse;
      const decodedToken = jwt_decode(credential);
      const { name, sub: id, picture } = decodedToken;
      const user = { id, name, picture };
      console.log("Login success:", user);
      handleUser(user);
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
