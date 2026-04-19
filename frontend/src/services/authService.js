import API from './api';

export const login = async (email, password, role) => {
  try {
    const response = await API.post('/auth/login', { email, password, role });

    if (response.data.success) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Login failed"
    };
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};