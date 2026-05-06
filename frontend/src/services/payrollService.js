import API from './api';

// Get all faculty for dropdown
export const getFacultyList = async () => {
  try {
    const response = await API.get('/payroll/faculty-list');
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to fetch faculty list' };
  }
};

// Get faculty payroll
export const getFacultyPayroll = async () => {
  try {
    const response = await API.get('/payroll/faculty');
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch payroll'
    };
  }
};

// Get payment history
export const getPaymentHistory = async () => {
  try {
    const response = await API.get('/payroll/history');
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch payment history'
    };
  }
};

// Create payroll entry
export const createPayroll = async (payrollData) => {
  try {
    const response = await API.post('/payroll', payrollData);
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create payroll'
    };
  }
};

// Generate salary slip
export const generateSalarySlip = async (payrollId) => {
  try {
    const response = await API.get(`/payroll/slip/${payrollId}`);
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to generate salary slip'
    };
  }
};

// Get payroll summary
export const getPayrollSummary = async () => {
  try {
    const response = await API.get('/payroll/summary/all');
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to fetch payroll summary'
    };
  }
};
