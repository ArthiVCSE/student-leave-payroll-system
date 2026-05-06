// ============================================================
// payrollRoutes.js - Routes for Faculty Payroll Management
// Base path: /api/payroll
// ============================================================

const express = require('express');
const router = express.Router();
const { verifyToken, isFaculty } = require('../middleware/authMiddleware');
const payrollController = require('../controllers/payrollController');

// GET /api/payroll/faculty-list - Get all active faculty for dropdown (admin only)
router.get('/faculty-list', verifyToken, payrollController.getFacultyList);

// GET /api/payroll/faculty - Get payroll details
// Faculty: sees own payroll | Admin: sees all faculty payroll
router.get('/faculty', verifyToken, isFaculty, payrollController.getFacultyPayroll);

// GET /api/payroll/history - Get payment history
// Faculty: sees own history | Admin: sees all payment records
router.get('/history', verifyToken, isFaculty, payrollController.getPaymentHistory);

// POST /api/payroll - Process a new payroll entry (admin only)
router.post('/', verifyToken, payrollController.createPayroll);

// GET /api/payroll/slip/:payroll_id - Generate salary slip for a payroll record
router.get('/slip/:payroll_id', verifyToken, isFaculty, payrollController.generateSalarySlip);

// GET /api/payroll/summary/all - Get overall payroll statistics (admin only)
router.get('/summary/all', verifyToken, payrollController.getPayrollSummary);

module.exports = router;
