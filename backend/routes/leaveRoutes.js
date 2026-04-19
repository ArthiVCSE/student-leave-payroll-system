const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { verifyToken, isFaculty } = require('../middleware/authMiddleware');

router.get('/', verifyToken, leaveController.getLeaves);
router.post('/', verifyToken, leaveController.createLeave);
router.put('/:leave_id', verifyToken, isFaculty, leaveController.updateLeaveStatus);

module.exports = router;