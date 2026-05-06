// ============================================================
// leaveController.js - Handles Student Leave Operations
// Manages fetching, creating, and updating leave requests
// ============================================================

const db = require('../config/database');

// getLeaves - Fetches leave records based on the logged-in user's role
// - Student: sees only their own leave applications
// - Faculty/Admin: sees all student leave requests with student details
exports.getLeaves = async (req, res) => {
  try {
    let query;
    let params = [];

    if (req.user.role === 'student') {
      // Student can only see their own leaves
      query = 'SELECT * FROM leaves WHERE student_id = $1 ORDER BY applied_date DESC';
      params = [req.user.user_id];
    } else if (req.user.role === 'faculty') {
      // Faculty sees all leaves with student name and roll number
      query = `SELECT l.*, u.full_name, u.roll_number 
               FROM leaves l 
               JOIN users u ON l.student_id = u.user_id 
               ORDER BY l.applied_date DESC`;
    } else {
      // Admin also sees all leaves with student details
      query = `SELECT l.*, u.full_name, u.roll_number 
               FROM leaves l 
               JOIN users u ON l.student_id = u.user_id 
               ORDER BY l.applied_date DESC`;
    }

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// createLeave - Submits a new leave application (student only)
// Student provides leave_type, start_date, end_date, and reason
exports.createLeave = async (req, res) => {
  const { leave_type, start_date, end_date, reason } = req.body;

  try {
    // Insert leave with student_id from the JWT token (logged-in student)
    const query = `INSERT INTO leaves (student_id, leave_type, start_date, end_date, reason) 
                   VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    const result = await db.query(query, [req.user.user_id, leave_type, start_date, end_date, reason]);

    res.status(201).json({ success: true, message: 'Leave application submitted', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// updateLeaveStatus - Approves or rejects a leave request (faculty only)
// Faculty sets status to 'approved' or 'rejected' with optional comments
exports.updateLeaveStatus = async (req, res) => {
  const { leave_id } = req.params;
  const { status, review_comments } = req.body;

  try {
    // Update leave status and record who reviewed it and when
    const query = `UPDATE leaves 
                   SET status = $1, reviewed_by = $2, reviewed_date = NOW(), review_comments = $3 
                   WHERE leave_id = $4 RETURNING *`;
    const result = await db.query(query, [status, req.user.user_id, review_comments, leave_id]);

    res.json({ success: true, message: `Leave ${status}`, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
