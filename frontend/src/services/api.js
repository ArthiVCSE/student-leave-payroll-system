import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// 🔥 THIS IS CRITICAL
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');

  console.log("TOKEN SENT:", token); // ✅ ADD THIS

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default API;