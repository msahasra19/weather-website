import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Configure axios base defaults
axios.defaults.baseURL = 'http://localhost:5000';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('weatheriq_token'));
  const [loading, setLoading] = useState(true);

  // Set authorization header in axios
  const setAuthHeader = (authToken) => {
    if (authToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Initialize Auth State (check local storage token)
  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        setAuthHeader(token);
        try {
          const { data } = await axios.get('/api/auth/me');
          if (data.success) {
            setUser(data.data);
          } else {
            // Token expired or invalid
            handleLogout();
          }
        } catch (err) {
          console.error('Failed to restore auth session:', err.message);
          handleLogout();
        }
      } else {
        setAuthHeader(null);
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  const handleSignup = async (name, email, password) => {
    try {
      const { data } = await axios.post('/api/auth/signup', { name, email, password });
      if (data.success && data.token) {
        localStorage.setItem('weatheriq_token', data.token);
        setToken(data.token);
        setUser(data.data);
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Registration failed. Please try again.'
      };
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const { data } = await axios.post('/api/auth/login', { email, password });
      if (data.success && data.token) {
        localStorage.setItem('weatheriq_token', data.token);
        setToken(data.token);
        setUser(data.data);
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Invalid credentials. Please try again.'
      };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('weatheriq_token');
    setToken(null);
    setUser(null);
    setAuthHeader(null);
  };

  const value = {
    user,
    token,
    loading,
    signup: handleSignup,
    login: handleLogin,
    logout: handleLogout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
