import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Configure axios base defaults using environment variables if set (triggering fresh build with updated Vercel environment variables)
axios.defaults.baseURL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

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
      // Helper to extract a friendly error message from backend or network failures
      let errorMsg = 'Registration failed. Please try again.';
      if (err.response) {
        // Server responded with a status outside 2xx
        errorMsg = err.response.data?.message || 
                   (typeof err.response.data?.error === 'string' ? err.response.data.error : null) || 
                   errorMsg;
      } else if (err.request) {
        // The request was made but no response was received
        errorMsg = 'Cannot connect to backend server. Please verify the backend is running on port 5000.';
      }
      return {
        success: false,
        error: errorMsg
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
      let errorMsg = 'Invalid credentials. Please try again.';
      if (err.response) {
        errorMsg = err.response.data?.message || 
                   (typeof err.response.data?.error === 'string' ? err.response.data.error : null) || 
                   errorMsg;
      } else if (err.request) {
        errorMsg = 'Cannot connect to backend server. Please verify the backend is running on port 5000.';
      }
      return {
        success: false,
        error: errorMsg
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
