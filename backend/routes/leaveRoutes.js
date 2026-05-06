// ============================================================
// leaveRoutes.js - Routes for Student Leave Management
// Base path: /api/leaves
// ============================================================

const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { verifyToken, isFaculty } = require('../middleware/authMiddleware');

// GET /api/leaves/test - Health check route (no auth required)
router.get('/test', (req, res) => {
  res.json({ message: "Working" });
});

// GET /api/leaves - Get leaves based on role
// Student: gets own leaves | Faculty/Admin: gets all student leaves
router.get('/', verifyToken, leaveController.getLeaves);

// POST /api/leaves - Submit a new leave application (student only)
router.post('/', verifyToken, leaveController.createLeave);

// PUT /api/leaves/:leave_id - Approve or reject a leave request (faculty only)
router.put('/:leave_id', verifyToken, isFaculty, leaveController.updateLeaveStatus);

module.exports = router;
