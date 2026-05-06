import API from './api';

export const getUsers = async () => {
  try {
    const response = await API.get('/auth/users');
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to fetch users' };
  }
};

export const createUser = async (userData) => {
  try {
    const response = await API.post('/auth/users', userData);
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to create user' };
  }
};

export const deleteUser = async (user_id) => {
  try {
    const response = await API.delete(`/auth/users/${user_id}`);
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to delete user' };
  }
};
