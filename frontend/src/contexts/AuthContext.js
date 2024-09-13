import React, { createContext, useContext, useState, useEffect } from "react";
import axios from 'axios';
import { API_BASE_URL } from '../config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/validate-token`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.data.isValid) {
            setUser(response.data.user);
            setIsAuthenticated(true);
            setIsAdmin(response.data.user.is_admin);
          } else {
            throw new Error('Token is invalid');
          }
        } catch (error) {
          console.error("Token validation error:", error);
          try {
            await refreshToken();
          } catch (refreshError) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
            setIsAuthenticated(false);
            setIsAdmin(false);
          }
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/login`, { username, password });
      const { member, access_token, refresh_token } = response.data;
      setUser(member);
      setIsAuthenticated(true);
      setIsAdmin(member.is_admin);
      localStorage.setItem('authToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await axios.post(`${API_BASE_URL}/api/refresh`, {}, {
        headers: { Authorization: `Bearer ${refreshToken}` }
      });
      const newAccessToken = response.data.access_token;
      localStorage.setItem('authToken', newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
      throw error;
    }
  };

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response && error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const newAccessToken = await refreshToken();
          axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          return axios(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );

  const value = {
    user,
    isAuthenticated,
    isAdmin,
    isLoading,
    login,
    logout,
    setIsAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
