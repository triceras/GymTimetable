/*
  Use google credentials to log into the App using the Google API
*/
import { useAuth } from '../contexts/AuthContext';
import {useNavigate} from 'react-router-dom';
import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const { handleUser, handleError } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    const handleLoginFailure = (response) => {
        console.log("Login failed:", response);
        setError(response);
        handleError(response);
    };

    const handleLoginSuccess = (response) => {
        console.log("Login succeeded:", response);
        handleUser(response);
        navigate('/');
    };

    return (
        <GoogleLogin
            // Read the client id from the .env file
            clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
            // If you need to scope specific resources, add them here
            // scope={SCOPE}
            // This is the login handler
            onSuccess={handleLoginSuccess}
            // This is the failure handler
            onFailure={handleLoginFailure}
            // This is the button text
            buttonText="Login"
            // This is the custom class for the button component
            className="login-button"
        />
    );
};

export default Login;
