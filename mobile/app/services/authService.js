import api from './api';

const authService = {
  // Login function
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data; // This will return the { token, user } object
    } catch (error) {
      throw error.response?.data || { error: 'Login failed' };
    }
  },

  // Registration function
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Registration failed' };
    }
  }
};

export default authService;