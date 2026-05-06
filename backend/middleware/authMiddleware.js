// ============================================================
// authMiddleware.js - JWT Authentication & Role-based Access
// Used to protect routes and restrict access by role
// ============================================================

const jwt = require('jsonwebtoken');

// verifyToken - checks if a valid JWT token is present in the request header
// Used on all protected routes to ensure user is logged in
exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from "Bearer <token>"

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token signature
    req.user = decoded; // Attach decoded user info (user_id, email, role) to request
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// isAdmin - restricts route access to admin role only
// Used on user management and payroll summary routes
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

// isFaculty - allows access to both faculty and admin roles
// Used on leave management and payroll viewing routes
exports.isFaculty = (req, res, next) => {
  if (req.user.role !== 'faculty' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Faculty access required' });
  }
  next();
};
