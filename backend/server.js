// ============================================================
// server.js - Main entry point of the backend application
// Initializes Express server, connects middleware and routes
// ============================================================

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import all route modules
const authRoutes = require('./routes/authRoutes');     // Handles login and user management
const leaveRoutes = require('./routes/leaveRoutes');   // Handles student leave operations
const payrollRoutes = require('./routes/payrollRoutes'); // Handles faculty payroll operations

const app = express();

// Middleware - allows cross-origin requests from frontend and parses JSON body
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());

// API Routes - all routes are prefixed with /api
app.use('/api/auth', authRoutes);       // /api/auth/login, /api/auth/users
app.use('/api/leaves', leaveRoutes);   // /api/leaves
app.use('/api/payroll', payrollRoutes); // /api/payroll

// Health check route - confirms backend is running
app.get('/', (req, res) => {
  res.json({ message: '✅ Backend API is running!' });
});

// Start the server on the port defined in .env
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
