// ============================================================
// payrollController.js - Handles Faculty Payroll Operations
// Manages payroll creation, viewing, summary, and salary slips
// ============================================================

const db = require('../config/database');

// getFacultyList - Returns list of all active faculty (admin only)
// Used to populate the faculty dropdown in the Process Payroll form
exports.getFacultyList = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT user_id, full_name, employee_id, basic_salary 
       FROM users WHERE role = 'faculty' AND is_active = true ORDER BY full_name`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// getFacultyPayroll - Returns payroll details based on role
// - Faculty: sees only their own payroll summary for current month
// - Admin: sees all faculty with total paid and payment count
exports.getFacultyPayroll = async (req, res) => {
  try {
    let query;
    let params = [];

    if (req.user.role === 'faculty') {
      // Faculty sees their own payroll with current month salary
      query = `SELECT u.user_id, u.full_name, u.email, u.basic_salary, u.employee_id,
                      u.designation, u.department, u.experience_years,
                      COALESCE(SUM(CASE WHEN p.month = EXTRACT(MONTH FROM NOW()) THEN p.net_salary ELSE 0 END), 0) as current_month_salary
               FROM users u
               LEFT JOIN payroll p ON u.user_id = p.faculty_id
               WHERE u.user_id = $1 AND u.role = 'faculty'
               GROUP BY u.user_id`;
      params = [req.user.user_id];
    } else if (req.user.role === 'admin') {
      // Admin sees all faculty with total salary paid and number of payments
      query = `SELECT u.user_id, u.full_name, u.email, u.basic_salary, u.employee_id,
                      u.designation, u.department, u.experience_years,
                      COALESCE(SUM(p.net_salary), 0) as total_paid,
                      COUNT(p.payroll_id) as payment_count
               FROM users u
               LEFT JOIN payroll p ON u.user_id = p.faculty_id
               WHERE u.role = 'faculty'
               GROUP BY u.user_id
               ORDER BY u.full_name`;
    }

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// getPaymentHistory - Returns full payroll payment records
// - Faculty: sees their own payment history sorted by date
// - Admin: sees all faculty payment records
exports.getPaymentHistory = async (req, res) => {
  try {
    let query;
    let params = [];

    if (req.user.role === 'faculty') {
      query = `SELECT p.*, u.full_name FROM payroll p 
               JOIN users u ON p.faculty_id = u.user_id 
               WHERE p.faculty_id = $1 
               ORDER BY p.payment_date DESC`;
      params = [req.user.user_id];
    } else if (req.user.role === 'admin') {
      query = `SELECT p.*, u.full_name, u.employee_id FROM payroll p 
               JOIN users u ON p.faculty_id = u.user_id 
               ORDER BY p.payment_date DESC`;
    }

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// createPayroll - Processes a new payroll entry for a faculty member (admin only)
// Admin provides faculty, month, basic_salary, working days, days present, and deductions
// net_salary is auto-calculated as basic_salary - deductions
exports.createPayroll = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }

  const { faculty_id, month, year, basic_salary, total_working_days, days_present, deductions } = req.body;

  // Calculate days absent and net salary automatically
  const days_absent = total_working_days - days_present;
  const net_salary = parseFloat(basic_salary) - parseFloat(deductions);

  if (!faculty_id || !month || !year || !basic_salary || !total_working_days || !days_present) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    // Insert payroll record with status 'paid' and current timestamp
    const query = `INSERT INTO payroll (faculty_id, month, year, basic_salary, total_working_days, days_present, days_absent, deductions, net_salary, status, processed_date, processed_by, payment_date)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'paid', NOW(), $10, NOW())
                   RETURNING *`;
    const result = await db.query(query, [faculty_id, month, year, basic_salary, total_working_days, days_present, days_absent, deductions, net_salary, req.user.user_id]);
    res.status(201).json({ success: true, message: 'Payroll entry created', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// generateSalarySlip - Generates a formatted salary slip for a specific payroll record
// Used by faculty to view/download their salary slip by payroll_id
exports.generateSalarySlip = async (req, res) => {
  const { payroll_id } = req.params;

  try {
    // Fetch payroll record joined with faculty user details
    const query = `SELECT p.*, u.full_name, u.employee_id, u.basic_salary, u.department, u.designation
                   FROM payroll p
                   JOIN users u ON p.faculty_id = u.user_id
                   WHERE p.payroll_id = $1`;

    const result = await db.query(query, [payroll_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    const record = result.rows[0];

    // Return payroll data along with a formatted salary slip text
    res.json({
      success: true,
      data: {
        ...record,
        slip_text: `
SALARY SLIP
Employee: ${record.full_name}
Employee ID: ${record.employee_id}
Department: ${record.department}
Designation: ${record.designation}
Month: ${record.month}/${record.year}

Basic Salary:     ₹${record.basic_salary}
Deductions:       ₹${record.deductions}
Net Salary:       ₹${record.net_salary}
Payment Date:     ${new Date(record.payment_date).toLocaleDateString()}
        `
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// getPayrollSummary - Returns overall payroll statistics (admin only)
// Shows total faculty paid, total gross, deductions, net salary across all records
exports.getPayrollSummary = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const query = `
      SELECT 
        COUNT(DISTINCT p.faculty_id) as total_faculty_paid,
        SUM(p.basic_salary) as total_gross_salary,
        SUM(p.deductions) as total_deductions,
        SUM(p.net_salary) as total_net_salary,
        COUNT(p.payroll_id) as total_payments
      FROM payroll p
    `;

    const result = await db.query(query);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
