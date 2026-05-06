// ============================================================
// authController.js - Handles Authentication & User Management
// Manages login, user creation, listing, and deactivation
// ============================================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// login - Authenticates user by email and role, returns JWT token
// Used by all roles: student, faculty, admin
exports.login = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    // Find user by email and role (only active users can login)
    const query = `SELECT * FROM users WHERE email = $1 AND LOWER(role) = LOWER($2) AND is_active = true`;
    const result = await db.query(query, [email, role]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Generate JWT token with user info - expires as per .env JWT_EXPIRE
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Return token and basic user info to frontend
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        roll_number: user.roll_number,
        employee_id: user.employee_id
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// getUsers - Returns all users from the database (admin only)
// Used in Admin → Manage Users page to list all students, faculty, admins
exports.getUsers = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT user_id, full_name, email, role, roll_number, employee_id, department, designation, basic_salary, is_active 
       FROM users ORDER BY role, full_name`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// createUser - Adds a new user to the database (admin only)
// Admin can create students (with roll_number) or faculty (with employee_id, department, etc.)
exports.createUser = async (req, res) => {
  const { full_name, email, password, role, roll_number, employee_id, department, designation, basic_salary } = req.body;

  // Validate required fields
  if (!full_name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'full_name, email, password and role are required' });
  }

  try {
    // Check if email already exists to avoid duplicates
    const exists = await db.query(`SELECT user_id FROM users WHERE email = $1`, [email]);
    if (exists.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Insert new user into the database
    const result = await db.query(
      `INSERT INTO users (full_name, email, password, role, roll_number, employee_id, department, designation, basic_salary, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true) RETURNING user_id, full_name, email, role`,
      [full_name, email, password, role, roll_number || null, employee_id || null, department || null, designation || null, basic_salary || null]
    );
    res.status(201).json({ success: true, message: 'User created successfully', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// deleteUser - Deactivates a user (soft delete) by setting is_active = false (admin only)
// User is not deleted from DB, just disabled from logging in
exports.deleteUser = async (req, res) => {
  const { user_id } = req.params;
  try {
    await db.query(`UPDATE users SET is_active = false WHERE user_id = $1`, [user_id]);
    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
