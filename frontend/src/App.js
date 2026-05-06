import React, { useState, useEffect } from 'react';
import { Home, FileText, History, User, LogOut, Calendar, Clock, CheckCircle, Menu, X, DollarSign, Download } from 'lucide-react';
import { login as loginService, logout as logoutService, getCurrentUser } from './services/authService';
import { getLeaves, createLeave, updateLeaveStatus } from './services/leaveService';
import { getFacultyPayroll, getPaymentHistory, createPayroll, generateSalarySlip, getPayrollSummary, getFacultyList } from './services/payrollService';
import { getUsers, createUser, deleteUser } from './services/userService';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '', role: 'student' });
  const [leaveForm, setLeaveForm] = useState({ leave_type: 'sick', start_date: '', end_date: '', reason: '' });
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Payroll state
  const [payroll, setPayroll] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [payrollSummary, setPayrollSummary] = useState(null);
  const [payrollForm, setPayrollForm] = useState({ faculty_id: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), basic_salary: '', total_working_days: '', days_present: '', deductions: '' });
  const [facultyList, setFacultyList] = useState([]);
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState({ full_name: '', email: '', password: '', role: 'student', roll_number: '', employee_id: '', department: '', designation: '', basic_salary: '' });

useEffect(() => {
  const initializeApp = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      console.log("🔍 DEBUG: Stored user:", storedUser); // ✅ DEBUG LOG
      console.log("🔍 DEBUG: Token exists:", !!token);

      if (storedUser && token) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // ✅ FIX: Wait for fetchLeaves to complete, handle errors
        try {
          await fetchLeaves();
        } catch (error) {
          console.error("❌ Error fetching leaves on init:", error);
          // Still show dashboard even if leaves fail to load
        }
      }
    } catch (error) {
      console.error("❌ Error initializing app:", error);
    } finally {
      setIsInitializing(false); // ✅ Mark initialization complete
    }
  };

  initializeApp();
}, []);

  const fetchLeaves = async () => {
    try {
      const response = await getLeaves();
      console.log("✅ Leaves fetched:", response); // ✅ DEBUG LOG
      
      if (response.success) {
        setLeaves(response.data);
      } else {
        console.warn("⚠️ Leaves API returned false success:", response);
        setLeaves([]);
      }
    } catch (error) {
      console.error('❌ Error fetching leaves:', error);
      console.error('Error details:', error.response?.data || error.message);
      setLeaves([]);
    }
  };

  const fetchPayroll = async (role) => {
    const currentRole = role || user?.role;
    console.log('fetchPayroll called with role:', currentRole);
    try {
      if (currentRole === 'faculty' || currentRole === 'admin') {
        const response = await getFacultyPayroll();
        console.log('getFacultyPayroll response:', response);
        if (response.success) setPayroll(response.data);

        const historyResponse = await getPaymentHistory();
        console.log('getPaymentHistory response:', historyResponse);
        if (historyResponse.success) setPaymentHistory(historyResponse.data);

        if (currentRole === 'admin') {
          const summaryResponse = await getPayrollSummary();
          console.log('getPayrollSummary response:', summaryResponse);
          if (summaryResponse.success) setPayrollSummary(summaryResponse.data);

          const facultyRes = await getFacultyList();
          console.log('getFacultyList response:', facultyRes);
          if (facultyRes.success) {
            console.log('Setting facultyList to:', facultyRes.data);
            setFacultyList(facultyRes.data);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error fetching payroll:', error);
    }
  };

  const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const response = await loginService(
      loginForm.email,
      loginForm.password,
      loginForm.role
    );

    console.log("✅ LOGIN RESPONSE:", response); // ✅ DEBUG LOG

    if (response.success) {
      // ✅ Verify token was stored
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      console.log("🔍 After login - Token stored:", !!token);
      console.log("🔍 After login - User stored:", !!user);

      setUser(response.user);
      setCurrentPage("dashboard");

      console.log("✅ Login complete - user state updated:", response.user);
      console.log("✅ currentPage set to: dashboard");

      // ✅ Fetch data after login
      try {
        await fetchLeaves();
        await fetchPayroll(response.user.role);
      } catch (error) {
        console.error("❌ Error fetching data after login:", error);
      }
    } else {
      console.error("❌ Login failed:", response.message);
      alert(response.message);
    }
  } catch (error) {
    console.error("❌ LOGIN ERROR:", error);
    alert("Login failed. Please check your credentials.");
  }

  setLoading(false);
};

  const handleLogout = () => {
    logoutService();
    setUser(null);
    setLeaves([]);
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await createLeave(leaveForm);
      if (response.success) {
        alert('Leave application submitted successfully!');
        setLeaveForm({ leave_type: 'sick', start_date: '', end_date: '', reason: '' });
        fetchLeaves();
      }
    } catch (error) {
      alert('Failed to submit leave application');
    }
    setLoading(false);
  };

  const handleLeaveAction = async (leaveId, status) => {
    setLoading(true);
    try {
      const response = await updateLeaveStatus(leaveId, status, '');
      if (response.success) {
        alert(`Leave ${status} successfully!`);
        fetchLeaves();
      }
    } catch (error) {
      alert(`Failed to ${status} leave`);
    }
    setLoading(false);
  };

  if (isInitializing) {
    console.log("🔄 Rendering: LOADING SCREEN");
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <Calendar className="text-indigo-600" size={48} />
          </div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  console.log("🔍 RENDER STATE:", { isInitializing, user: !!user, currentPage, role: user?.role });

  if (!user) {
    console.log("🔄 Rendering: LOGIN FORM");

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-block bg-indigo-600 p-3 rounded-full mb-4">
              <Calendar className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">EduManage Pro</h1>
            <p className="text-gray-600">Student Leave & Faculty Payroll System</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setLoginForm({...loginForm, role: 'student'})}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  loginForm.role === 'student' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setLoginForm({...loginForm, role: 'faculty'})}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  loginForm.role === 'faculty' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Faculty
              </button>
              <button
                type="button"
                onClick={() => setLoginForm({...loginForm, role: 'admin'})}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  loginForm.role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Admin
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const renderStudentDashboard = () => (
    <div className="space-y-6">
      {console.log("📊 Rendering: Student Dashboard with " + leaves.length + " leaves")}
      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Leaves</p>
              <p className="text-3xl font-bold text-gray-800">{leaves.length}</p>
            </div>
            <Calendar className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm mb-1">Approved</p>
              <p className="text-3xl font-bold text-gray-800">
                {leaves.filter(l => l.status === 'approved').length}
              </p>
            </div>
            <CheckCircle className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm mb-1">Pending</p>
              <p className="text-3xl font-bold text-gray-800">
                {leaves.filter(l => l.status === 'pending').length}
              </p>
            </div>
            <Clock className="text-yellow-500" size={32} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Applications</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-semibold">Type</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {leaves.slice(0, 5).map(leave => (
                <tr key={leave.leave_id} className="border-b">
                  <td className="py-3 px-4 text-sm capitalize">{leave.leave_type}</td>
                  <td className="py-3 px-4 text-sm">{new Date(leave.start_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                      leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                      leave.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAdminDashboard = () => {
    const totalLeaves = leaves.length;
    const approvedCount = leaves.filter(l => l.status === 'approved').length;
    const pendingCount = leaves.filter(l => l.status === 'pending').length;
    const rejectedCount = leaves.filter(l => l.status === 'rejected').length;
    const uniqueRequesters = new Set(leaves.map(l => l.roll_number || l.full_name)).size;
    const leaveTypeCounts = leaves.reduce((acc, leave) => {
      const type = leave.leave_type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        {console.log("📊 Rendering: Admin Dashboard with " + totalLeaves + " leaves")}
        <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-indigo-50 border-l-4 border-indigo-500 p-6 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm mb-1">Unique Requesters</p>
                <p className="text-3xl font-bold text-gray-800">{uniqueRequesters}</p>
              </div>
              <User className="text-indigo-500" size={32} />
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Leaves</p>
                <p className="text-3xl font-bold text-gray-800">{totalLeaves}</p>
              </div>
              <Calendar className="text-blue-500" size={32} />
            </div>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm mb-1">Approved Leaves</p>
                <p className="text-3xl font-bold text-gray-800">{approvedCount}</p>
              </div>
              <CheckCircle className="text-green-500" size={32} />
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm mb-1">Pending Requests</p>
                <p className="text-3xl font-bold text-gray-800">{pendingCount}</p>
              </div>
              <Clock className="text-yellow-500" size={32} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Rejected Leaves</p>
            <p className="text-3xl font-bold text-gray-800">{rejectedCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Top Leave Types</p>
            {Object.entries(leaveTypeCounts).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between py-1">
                <span className="capitalize text-sm text-gray-700">{type}</span>
                <span className="text-sm font-semibold text-gray-900">{count}</span>
              </div>
            ))}
            {Object.keys(leaveTypeCounts).length === 0 && (
              <p className="text-sm text-gray-500">No leave data yet.</p>
            )}
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Report Status</p>
            <p className="text-lg font-semibold text-gray-800">Ready to generate</p>
            <p className="text-sm text-gray-500 mt-2">Generate CSV summaries for overall leave data.</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Pending Leave Requests</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold">Student</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Dates</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {leaves.filter(l => l.status === 'pending').slice(0, 5).map(leave => (
                  <tr key={leave.leave_id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-6 text-sm">{leave.full_name || 'Unknown'}</td>
                    <td className="py-4 px-6 text-sm capitalize">{leave.leave_type}</td>
                    <td className="py-4 px-6 text-sm">{new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}</td>
                    <td className="py-4 px-6 text-sm capitalize">{leave.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAdminReports = () => {
    const pendingLeaves = leaves.filter(l => l.status === 'pending');
    const downloadCSV = (rows, filename) => {
      const csvContent = [
        [
          'Leave ID',
          'Full Name',
          'Roll Number',
          'Leave Type',
          'Start Date',
          'End Date',
          'Status',
          'Reason'
        ],
        ...rows.map(row => [
          row.leave_id,
          row.full_name,
          row.roll_number,
          row.leave_type,
          row.start_date,
          row.end_date,
          row.status,
          row.reason
        ])
      ].map(e => e.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Admin Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Overall Leave Summary</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <p>Total leave records: <strong>{leaves.length}</strong></p>
              <p>Approved: <strong>{leaves.filter(l => l.status === 'approved').length}</strong></p>
              <p>Pending: <strong>{pendingLeaves.length}</strong></p>
              <p>Rejected: <strong>{leaves.filter(l => l.status === 'rejected').length}</strong></p>
            </div>
            <button
              onClick={() => downloadCSV(leaves, 'leave-summary.csv')}
              className="mt-6 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Download Leave Summary
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Pending Requests Report</h3>
            <p className="text-sm text-gray-700">Generate a CSV of all pending leave requests for audit or review.</p>
            <button
              onClick={() => downloadCSV(pendingLeaves, 'pending-leave-requests.csv')}
              disabled={pendingLeaves.length === 0}
              className="mt-6 px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              Download Pending Requests
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Recent Leave Records</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold">Student</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Dates</th>
                </tr>
              </thead>
              <tbody>
                {leaves.slice(0, 10).map(leave => (
                  <tr key={leave.leave_id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-6 text-sm">{leave.full_name || 'Unknown'}</td>
                    <td className="py-4 px-6 text-sm capitalize">{leave.leave_type}</td>
                    <td className="py-4 px-6 text-sm capitalize">{leave.status}</td>
                    <td className="py-4 px-6 text-sm">{new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderFacultyPayroll = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">My Payroll</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm mb-1">Basic Salary</p>
              <p className="text-3xl font-bold text-gray-800">₹{user?.basic_salary || '—'}</p>
            </div>
            <DollarSign className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Payments</p>
              <p className="text-3xl font-bold text-gray-800">{paymentHistory.length}</p>
            </div>
            <CheckCircle className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm mb-1">Designation</p>
              <p className="text-lg font-bold text-gray-800">{user?.designation || 'N/A'}</p>
            </div>
            <User className="text-purple-500" size={32} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Payment History</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-semibold">Month</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Basic Salary</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Deductions</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Net Salary</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {paymentHistory.slice(0, 10).map(payment => (
                <tr key={payment.payroll_id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6 text-sm">{payment.month}/{payment.year}</td>
                  <td className="py-4 px-6 text-sm font-semibold">₹{payment.basic_salary}</td>
                  <td className="py-4 px-6 text-sm text-red-600">₹{payment.deductions}</td>
                  <td className="py-4 px-6 text-sm font-bold text-green-600">₹{payment.net_salary}</td>
                  <td className="py-4 px-6 text-sm">{new Date(payment.processed_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAdminPayrollDashboard = () => {
    if (facultyList.length === 0) {
      getFacultyList().then(res => { if (res.success) setFacultyList(res.data); });
    }

    const handleProcessPayroll = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        const response = await createPayroll({
          faculty_id: parseInt(payrollForm.faculty_id),
          month: parseInt(payrollForm.month),
          year: new Date().getFullYear(),
          basic_salary: parseFloat(payrollForm.basic_salary),
          total_working_days: parseInt(payrollForm.total_working_days),
          days_present: parseInt(payrollForm.days_present),
          deductions: parseFloat(payrollForm.deductions)
        });
        if (response.success) {
          alert('Payroll processed successfully!');
          setPayrollForm({ faculty_id: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), basic_salary: '', total_working_days: '', days_present: '', deductions: '' });
          await fetchPayroll('admin');
        } else {
          alert(response.message || 'Failed to process payroll');
        }
      } catch (error) {
        alert('Error processing payroll: ' + error.message);
      }
      setLoading(false);
    };
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Payroll Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Faculty Paid</p>
                <p className="text-3xl font-bold text-gray-800">{payrollSummary?.total_faculty_paid || 0}</p>
              </div>
              <User className="text-blue-500" size={32} />
            </div>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Gross Salary</p>
                <p className="text-3xl font-bold text-gray-800">₹{payrollSummary?.total_gross_salary || 0}</p>
              </div>
              <DollarSign className="text-green-500" size={32} />
            </div>
          </div>

          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Deductions</p>
                <p className="text-3xl font-bold text-gray-800">₹{payrollSummary?.total_deductions || 0}</p>
              </div>
              <Calendar className="text-red-500" size={32} />
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Net Salary</p>
                <p className="text-3xl font-bold text-gray-800">₹{payrollSummary?.total_net_salary || 0}</p>
              </div>
              <CheckCircle className="text-yellow-500" size={32} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Process Payroll</h3>
          <form onSubmit={handleProcessPayroll} className="max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Faculty</label>
                <select
                  value={payrollForm.faculty_id}
                  onChange={(e) => setPayrollForm({...payrollForm, faculty_id: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">Select Faculty</option>
                  {facultyList.map(f => (
                    <option key={f.user_id} value={f.user_id}>{f.full_name} ({f.employee_id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Month</label>
                <select
                  value={payrollForm.month}
                  onChange={(e) => setPayrollForm({...payrollForm, month: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Basic Salary</label>
                <input
                  type="number"
                  value={payrollForm.basic_salary}
                  onChange={(e) => setPayrollForm({...payrollForm, basic_salary: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Total Working Days</label>
                <input
                  type="number"
                  value={payrollForm.total_working_days}
                  onChange={(e) => setPayrollForm({...payrollForm, total_working_days: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Days Present</label>
                <input
                  type="number"
                  value={payrollForm.days_present}
                  onChange={(e) => setPayrollForm({...payrollForm, days_present: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Deductions</label>
                <input
                  type="number"
                  value={payrollForm.deductions}
                  onChange={(e) => setPayrollForm({...payrollForm, deductions: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Processing...' : 'Process Payroll'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Faculty Payroll List</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold">Faculty Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Employee ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Basic Salary</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Total Paid</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Payments</th>
                </tr>
              </thead>
              <tbody>
                {payroll.slice(0, 10).map(faculty => (
                  <tr key={faculty.user_id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-6 text-sm">{faculty.full_name}</td>
                    <td className="py-4 px-6 text-sm">{faculty.employee_id}</td>
                    <td className="py-4 px-6 text-sm font-semibold">₹{faculty.basic_salary || 0}</td>
                    <td className="py-4 px-6 text-sm font-bold text-green-600">₹{faculty.total_paid || 0}</td>
                    <td className="py-4 px-6 text-sm">{faculty.payment_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderApplyLeave = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Apply for Leave</h2>
      
      <form onSubmit={handleLeaveSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Leave Type</label>
            <select
              value={leaveForm.leave_type}
              onChange={(e) => setLeaveForm({...leaveForm, leave_type: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              <option value="sick">Sick Leave</option>
              <option value="casual">Casual Leave</option>
              <option value="medical">Medical Leave</option>
              <option value="emergency">Emergency Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={leaveForm.start_date}
                onChange={(e) => setLeaveForm({...leaveForm, start_date: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={leaveForm.end_date}
                onChange={(e) => setLeaveForm({...leaveForm, end_date: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Reason</label>
            <textarea
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter reason for leave..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderLeaveHistory = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Leave History</h2>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold">Type</th>
                <th className="text-left py-4 px-6 text-sm font-semibold">Start Date</th>
                <th className="text-left py-4 px-6 text-sm font-semibold">End Date</th>
                <th className="text-left py-4 px-6 text-sm font-semibold">Reason</th>
                <th className="text-left py-4 px-6 text-sm font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map(leave => (
                <tr key={leave.leave_id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6 text-sm capitalize">{leave.leave_type}</td>
                  <td className="py-4 px-6 text-sm">{new Date(leave.start_date).toLocaleDateString()}</td>
                  <td className="py-4 px-6 text-sm">{new Date(leave.end_date).toLocaleDateString()}</td>
                  <td className="py-4 px-6 text-sm">{leave.reason}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                      leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                      leave.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderFacultyLeaves = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Leave Requests</h2>
      
      {leaves.filter(l => l.status === 'pending').map(leave => (
        <div key={leave.leave_id} className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-lg font-semibold">{leave.full_name}</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  {leave.roll_number}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium capitalize">{leave.leave_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-medium">
                    {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Reason</p>
                <p>{leave.reason}</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => handleLeaveAction(leave.leave_id, 'approved')}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                Approve
              </button>
              <button
                onClick={() => handleLeaveAction(leave.leave_id, 'rejected')}
                disabled={loading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}

      {leaves.filter(l => l.status === 'pending').length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No pending leave requests</p>
        </div>
      )}
    </div>
  );

  const isFacultyOrAdmin = ['faculty', 'admin'].includes(user?.role);

  const renderManageUsers = () => {
    const fetchUsers = async () => {
      const response = await getUsers();
      if (response.success) setUsers(response.data);
    };

    if (users.length === 0) fetchUsers();

    const handleCreateUser = async (e) => {
      e.preventDefault();
      setLoading(true);
      const response = await createUser(userForm);
      if (response.success) {
        alert('User created successfully!');
        setUserForm({ full_name: '', email: '', password: '', role: 'student', roll_number: '', employee_id: '', department: '', designation: '', basic_salary: '' });
        fetchUsers();
      } else {
        alert(response.message || 'Failed to create user');
      }
      setLoading(false);
    };

    const handleDeleteUser = async (user_id) => {
      if (!window.confirm('Are you sure you want to deactivate this user?')) return;
      setLoading(true);
      const response = await deleteUser(user_id);
      if (response.success) {
        alert('User deactivated successfully!');
        fetchUsers();
      } else {
        alert(response.message || 'Failed to deactivate user');
      }
      setLoading(false);
    };

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Users</h2>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Add New User</h3>
          <form onSubmit={handleCreateUser} className="max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input type="text" value={userForm.full_name} onChange={(e) => setUserForm({...userForm, full_name: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input type="email" value={userForm.email} onChange={(e) => setUserForm({...userForm, email: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input type="password" value={userForm.password} onChange={(e) => setUserForm({...userForm, password: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select value={userForm.role} onChange={(e) => setUserForm({...userForm, role: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {userForm.role === 'student' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Roll Number</label>
                  <input type="text" value={userForm.roll_number} onChange={(e) => setUserForm({...userForm, roll_number: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              )}
              {userForm.role === 'faculty' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Employee ID</label>
                    <input type="text" value={userForm.employee_id} onChange={(e) => setUserForm({...userForm, employee_id: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Department</label>
                    <input type="text" value={userForm.department} onChange={(e) => setUserForm({...userForm, department: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Designation</label>
                    <input type="text" value={userForm.designation} onChange={(e) => setUserForm({...userForm, designation: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Basic Salary</label>
                    <input type="number" value={userForm.basic_salary} onChange={(e) => setUserForm({...userForm, basic_salary: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </>
              )}
            </div>
            <button type="submit" disabled={loading} className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">All Users</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.user_id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-6 text-sm">{u.full_name}</td>
                    <td className="py-4 px-6 text-sm">{u.email}</td>
                    <td className="py-4 px-6 text-sm capitalize">{u.role}</td>
                    <td className="py-4 px-6 text-sm">{u.roll_number || u.employee_id || '—'}</td>
                    <td className="py-4 px-6 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      {u.is_active && (
                        <button onClick={() => handleDeleteUser(u.user_id)} disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 text-xs">
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const navItems = user?.role === 'student' ? [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'apply', label: 'Apply Leave', icon: FileText },
    { id: 'history', label: 'Leave History', icon: History },
    { id: 'profile', label: 'Profile', icon: User }
  ] : user?.role === 'admin' ? [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'users', label: 'Manage Users', icon: User },
    { id: 'payroll', label: 'Payroll', icon: DollarSign },
    { id: 'reports', label: 'Reports', icon: History },
    { id: 'profile', label: 'Profile', icon: User }
  ] : [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'leaves', label: 'Leave Requests', icon: FileText },
    { id: 'payroll', label: 'My Payroll', icon: DollarSign },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {console.log("🔄 Rendering: DASHBOARD (user.role=" + user?.role + ", currentPage=" + currentPage + ")")}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="text-lg md:text-xl font-bold text-gray-800">
              EduManage Pro - {(user?.role || "").charAt(0).toUpperCase() + (user?.role || "").slice(1)} Portal            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 md:px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <LogOut size={18} />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex">
        <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <nav className="p-6 space-y-2 mt-16 lg:mt-0">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  currentPage === item.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 p-4 md:p-8">
          {user?.role === 'student' && currentPage === 'dashboard' && renderStudentDashboard()}
          {user?.role === 'student' && currentPage === 'apply' && renderApplyLeave()}
          {user?.role === 'student' && currentPage === 'history' && renderLeaveHistory()}
          {user?.role === 'faculty' && currentPage === 'dashboard' && renderStudentDashboard()}
          {user?.role === 'faculty' && currentPage === 'payroll' && renderFacultyPayroll()}
          {user?.role === 'admin' && currentPage === 'dashboard' && renderAdminDashboard()}
          {user?.role === 'admin' && currentPage === 'users' && renderManageUsers()}
          {user?.role === 'admin' && currentPage === 'payroll' && renderAdminPayrollDashboard()}
          {(isFacultyOrAdmin && currentPage === 'leaves') && renderFacultyLeaves()}
          {user?.role === 'admin' && currentPage === 'reports' && renderAdminReports()}
          {currentPage === 'profile' && (
            <div className="bg-white rounded-lg shadow p-8">
              <h2 className="text-2xl font-bold mb-4">Profile</h2>
              <div className="space-y-3">
                <p><strong>Name:</strong> {user.full_name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user?.role}</p>
                {user.roll_number && <p><strong>Roll Number:</strong> {user.roll_number}</p>}
                {user.employee_id && <p><strong>Employee ID:</strong> {user.employee_id}</p>}
              </div>  
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;