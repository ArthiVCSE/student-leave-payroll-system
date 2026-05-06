// ============================================================
// authRoutes.js - Routes for Authentication & User Management
// Base path: /api/auth
// ============================================================

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// POST /api/auth/login - Login for all roles (student, faculty, admin)
router.post('/login', authController.login);

// GET /api/auth/users - Get all users (admin only)
router.get('/users', verifyToken, isAdmin, authController.getUsers);

// POST /api/auth/users - Create a new user (admin only)
router.post('/users', verifyToken, isAdmin, authController.createUser);

// DELETE /api/auth/users/:user_id - Deactivate a user (admin only)
router.delete('/users/:user_id', verifyToken, isAdmin, authController.deleteUser);

module.exports = router;
