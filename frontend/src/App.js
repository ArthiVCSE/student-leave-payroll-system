import React, { useState, useEffect } from 'react';
import { Home, FileText, History, User, LogOut, Calendar, Clock, CheckCircle, Menu, X } from 'lucide-react';
import { login as loginService, logout as logoutService, getCurrentUser } from './services/authService';
import { getLeaves, createLeave, updateLeaveStatus } from './services/leaveService';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '', role: 'student' });
  const [leaveForm, setLeaveForm] = useState({ leave_type: 'sick', start_date: '', end_date: '', reason: '' });
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      fetchLeaves();
    }
  }, []);

  const fetchLeaves = async () => {
    try {
      const response = await getLeaves();
      if (response.success) {
        setLeaves(response.data);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await loginService(loginForm.email, loginForm.password, loginForm.role);
      if (response.success) {
        setUser(response.user);
        fetchLeaves();
      } else {
        alert(response.message);
      }
    } catch (error) {
      alert('Login failed. Please check your credentials.');
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

  if (!user) {
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

  const navItems = user.role === 'student' ? [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'apply', label: 'Apply Leave', icon: FileText },
    { id: 'history', label: 'Leave History', icon: History },
    { id: 'profile', label: 'Profile', icon: User }
  ] : [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'leaves', label: 'Leave Requests', icon: FileText },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
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
          {user.role === 'student' && currentPage === 'dashboard' && renderStudentDashboard()}
          {user.role === 'student' && currentPage === 'apply' && renderApplyLeave()}
          {user.role === 'student' && currentPage === 'history' && renderLeaveHistory()}
          {user.role === 'faculty' && currentPage === 'dashboard' && renderStudentDashboard()}
          {user.role === 'faculty' && currentPage === 'leaves' && renderFacultyLeaves()}
          {currentPage === 'profile' && (
            <div className="bg-white rounded-lg shadow p-8">
              <h2 className="text-2xl font-bold mb-4">Profile</h2>
              <div className="space-y-3">
                <p><strong>Name:</strong> {user.full_name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
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