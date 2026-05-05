const express = require('express');
const router = express.Router();

const leaveController = require('../controllers/leaveController');
const { verifyToken, isFaculty } = require('../middleware/authMiddleware');

// 🔥 TEST ROUTE (No authentication needed)
router.get('/test', (req, res) => {
  res.json({ message: "Working" });
});

// 🔐 PROTECTED ROUTES

// Get all leaves (student/faculty based on role)
router.get('/', verifyToken, leaveController.getLeaves);

// Create new leave request (student)
router.post('/', verifyToken, leaveController.createLeave);

// Update leave status (faculty only)
router.put('/:leave_id', verifyToken, isFaculty, leaveController.updateLeaveStatus);

module.exports = router;