import API from './api';

export const getLeaves = async () => {
  const response = await API.get('/leaves');
  return response.data;
};

export const createLeave = async (leaveData) => {
  const response = await API.post('/leaves', leaveData);
  return response.data;
};

export const updateLeaveStatus = async (leaveId, status, comments) => {
  const response = await API.put(`/leaves/${leaveId}`, { status, review_comments: comments });
  return response.data;
};