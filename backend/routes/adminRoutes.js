const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// POST: /api/admin/login
// Secure login specifically for admin users
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    const user = userResult.rows[0];

    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Access denied. Admin role required." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, status: user.status },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1d" },
    );

    res.json({ message: "Admin login successful", token });
  } catch (err) {
    console.error("Admin Login Error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// GET: /api/admin/pending-users
// Gets all students waiting for approval AND their ID cards
router.get(
  "/pending-users",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    try {
      const pendingUsers = await pool.query(
        `SELECT u.id, u.full_name, u.roll_no, u.email, u.created_at, v.image_path 
       FROM users u 
       LEFT JOIN id_verifications v ON u.id = v.user_id 
       WHERE u.status = 'pending'
       ORDER BY u.created_at DESC`,
      );
      res.json(pendingUsers.rows);
    } catch (err) {
      console.error("Error fetching pending users:", err.message);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// POST: /api/admin/user/:id/approve
router.post(
  "/user/:id/approve",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        "UPDATE users SET status = 'approved' WHERE id = $1 RETURNING id, full_name, status",
        [id],
      );

      if (result.rows.length === 0)
        return res.status(404).json({ error: "User not found" });
      res.json({
        message: "User successfully approved!",
        user: result.rows[0],
      });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  },
);

// POST: /api/admin/user/:id/reject
router.post(
  "/user/:id/reject",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason)
        return res.status(400).json({ error: "Rejection reason is required." });

      const result = await pool.query(
        "UPDATE users SET status = 'rejected', rejection_reason = $1 WHERE id = $2 RETURNING id, full_name, status",
        [reason, id],
      );

      if (result.rows.length === 0)
        return res.status(404).json({ error: "User not found" });
      res.json({ message: "User rejected.", user: result.rows[0], reason });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  },
);

// GET: /api/admin/pending-drivers
router.get(
  "/pending-drivers",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    try {
      const pendingDrivers = await pool.query(
        `SELECT d.id as driver_id, d.license_no, d.plate_number, d.phone_number, d.vehicle_details, d.vehicle_image_path, d.license_image_path, u.full_name, u.email, u.roll_no 
       FROM drivers d 
       JOIN users u ON d.user_id = u.id 
       WHERE d.status = 'pending'
       ORDER BY d.id DESC`,
      );
      res.json(pendingDrivers.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error fetching pending drivers" });
    }
  },
);

// POST: /api/admin/driver/:id/approve
router.post(
  "/driver/:id/approve",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    try {
      const { id } = req.params; // This is the driver_id
      await pool.query("UPDATE drivers SET status = 'approved' WHERE id = $1", [
        id,
      ]);
      res.json({ message: "Driver successfully approved!" });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  },
);

// POST: /api/admin/driver/:id/reject
router.post(
  "/driver/:id/reject",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      if (!reason)
        return res.status(400).json({ error: "Rejection reason is required." });

      await pool.query(
        "UPDATE drivers SET status = 'rejected', rejection_reason = $1 WHERE id = $2",
        [reason, id],
      );
      res.json({ message: "Driver rejected.", reason });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  },
);

// GET: /api/admin/all-users
router.get(
  "/all-users",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    try {
      const users = await pool.query(
        "SELECT id, full_name, roll_no, email, role, status, created_at FROM users ORDER BY created_at DESC",
      );
      res.json(users.rows);
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  },
);

// GET: /api/admin/all-rides
router.get(
  "/all-rides",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    try {
      const rides = await pool.query(
        "SELECT * FROM rides ORDER BY created_at DESC",
      );
      res.json(rides.rows);
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  },
);

module.exports = router;
