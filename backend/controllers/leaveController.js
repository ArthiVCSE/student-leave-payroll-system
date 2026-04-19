const db = require('../config/database');

exports.getLeaves = async (req, res) => {
  try {
    let query;
    let params = [];

    if (req.user.role === 'student') {
      query = 'SELECT * FROM leaves WHERE student_id = $1 ORDER BY applied_date DESC';
      params = [req.user.user_id];
    } else if (req.user.role === 'faculty') {
      query = `SELECT l.*, u.full_name, u.roll_number 
               FROM leaves l 
               JOIN users u ON l.student_id = u.user_id 
               ORDER BY l.applied_date DESC`;
    } else {
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

exports.createLeave = async (req, res) => {
  const { leave_type, start_date, end_date, reason } = req.body;

  try {
    const query = `INSERT INTO leaves (student_id, leave_type, start_date, end_date, reason) 
                   VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    const result = await db.query(query, [req.user.user_id, leave_type, start_date, end_date, reason]);

    res.status(201).json({ success: true, message: 'Leave application submitted', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  const { leave_id } = req.params;
  const { status, review_comments } = req.body;

  try {
    const query = `UPDATE leaves 
                   SET status = $1, reviewed_by = $2, reviewed_date = NOW(), review_comments = $3 
                   WHERE leave_id = $4 RETURNING *`;
    const result = await db.query(query, [status, req.user.user_id, review_comments, leave_id]);

    res.json({ success: true, message: `Leave ${status}`, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};