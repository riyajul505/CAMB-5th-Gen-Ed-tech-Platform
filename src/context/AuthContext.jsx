import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { authAPI, userAPI } from '../services/api';

// Create the context
const AuthContext = createContext();

/**
 * Authentication Context Provider
 * Manages user authentication state across the application
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pathSelected, setPathSelected] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Check path status for students
        if (parsedUser.role === 'student') {
          checkPathStatus(parsedUser.id);
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    }
    setLoading(false);
  }, []);

  const checkPathStatus = async (studentId) => {
    try {
      const response = await userAPI.getPathStatus(studentId);
      setPathSelected(response.data.pathSelected);
      setSelectedLevel(response.data.selectedLevel);
      return response.data;
    } catch (error) {
      console.error('Error checking path status:', error);
      return { pathSelected: false, selectedLevel: null };
    }
  };

  const selectPath = async (level) => {
    if (!user) return { success: false, error: 'No user logged in' };
    
    try {
      const response = await userAPI.selectPath({
        studentId: user.id,
        level: level
      });
      setPathSelected(true);
      setSelectedLevel(level);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error selecting path:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to select path' 
      };
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      console.log('AuthContext: Attempting login with:', { email, password });
      const response = await authAPI.login({ email, password });
      const { token, user: userData } = response.data;
      console.log('AuthContext: Login successful:', response.data);
      
      // Store token and user data
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
      
      // Check path status for students
      if (userData.role === 'student') {
        const pathStatus = await checkPathStatus(userData.id);
        setPathSelected(pathStatus.pathSelected);
      }
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Login failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      console.log('AuthContext: Attempting registration with:', userData);
      const response = await authAPI.register(userData);
      console.log('AuthContext: Registration successful:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('AuthContext: Registration error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Registration failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setPathSelected(null);
    setSelectedLevel(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  };

  const value = {
    user,
    loading,
    pathSelected,
    selectedLevel,
    login,
    register,
    logout,
    selectPath,
    checkPathStatus,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * Custom hook to use authentication context
 * @returns {Object} Authentication context value
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
} 