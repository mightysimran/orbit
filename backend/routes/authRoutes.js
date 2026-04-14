const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const authMiddleware = require('../middleware/authMiddleware');

// --- MULTER CONFIGURATION FOR FILE UPLOADS ---
// 1. Ensure the upload directory exists
const uploadDir = path.join(__dirname, '../uploads/id-cards');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Configure where and how to save the file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate a secure, unique filename using timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'idcard-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });
// ---------------------------------------------


// POST: /api/auth/register
// 🚨 Notice the `upload.single('idCard')` middleware added here!
router.post('/register', upload.single('idCard'), async (req, res) => {
  try {
    const { full_name, roll_no, email, password } = req.body;

    // Ensure the file was actually received
    if (!req.file) {
      return res.status(400).json({ error: 'ID Card image is required.' });
    }

    // 1. Check if user already exists
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR roll_no = $2',
      [email, roll_no]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'User with this Email or Roll No already exists.' });
    }

    // 2. Encrypt (Hash) the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Save the user to the database
    const newUser = await pool.query(
      `INSERT INTO users (full_name, roll_no, email, password_hash, role, status) 
       VALUES ($1, $2, $3, $4, 'rider', 'pending') 
       RETURNING id, full_name, email, role, status`,
      [full_name, roll_no, email, hashedPassword]
    );

    const userId = newUser.rows[0].id;

    // 🚨 4. Save the image path to the id_verifications table!
    // We save a relative path so it's easy to serve later
    const imagePath = `/uploads/id-cards/${req.file.filename}`;
    await pool.query(
      `INSERT INTO id_verifications (user_id, image_path) VALUES ($1, $2)`,
      [userId, imagePath]
    );

    // 5. Send success response
    res.status(201).json({
      message: 'Registration successful! Pending admin verification.',
      user: newUser.rows[0]
    });

  } catch (err) {
    console.error('Registration Error:', err.message);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// POST: /api/auth/reupload-id
// Allows a rejected user to submit a new ID card
router.post('/reupload-id', [authMiddleware, upload.single('idCard')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'New ID Card image is required.' });
    }

    const userId = req.user.id;
    const imagePath = `/uploads/id-cards/${req.file.filename}`;

    // 1. Update the user's status back to pending
    await pool.query(
      "UPDATE users SET status = 'pending', rejection_reason = NULL WHERE id = $1",
      [userId]
    );

    // 2. Update their ID card image (or insert if it somehow got deleted)
    const existingImage = await pool.query("SELECT id FROM id_verifications WHERE user_id = $1", [userId]);
    
    if (existingImage.rows.length > 0) {
      await pool.query("UPDATE id_verifications SET image_path = $1 WHERE user_id = $2", [imagePath, userId]);
    } else {
      await pool.query("INSERT INTO id_verifications (user_id, image_path) VALUES ($1, $2)", [userId, imagePath]);
    }

    res.json({ message: 'ID successfully re-uploaded. Status is now pending.' });
  } catch (err) {
    console.error('Re-upload Error:', err.message);
    res.status(500).json({ error: 'Server error during re-upload.' });
  }
});

// POST: /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if the user exists in the database
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }
    
    const user = userResult.rows[0];

    // 2. Compare the typed password with the encrypted password in the database
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // 3. Generate the "Digital Wristband" (JWT Token)
    const token = jwt.sign(
      { id: user.id, role: user.role, status: user.status }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRES_IN } 
    );

    // 4. Send the token and user details back to the phone
    res.json({
      message: 'Login successful!',
      token: token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status,
        rejection_reason: user.rejection_reason // 🚨 Added this so the phone knows WHY they were rejected
      }
    });

  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// GET: /api/auth/me (Protected Route)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userResult = await pool.query(
      // 🚨 Added rejection_reason to the SELECT list here too!
      'SELECT id, full_name, roll_no, email, role, status, rejection_reason, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(userResult.rows[0]);
  } catch (err) {
    console.error('Fetch User Error:', err.message);
    res.status(500).json({ error: 'Server error fetching user details.' });
  }
});

// GET: /api/auth/me/stats
// Calculates real-time rides, ratings, and wallet earnings
router.get('/me/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 1. Get total completed rides (as either a rider or a driver)
    const ridesQuery = await pool.query(
      `SELECT COUNT(*) as total_rides FROM rides 
       WHERE (rider_id = $1 OR driver_id IN (SELECT id FROM drivers WHERE user_id = $1)) 
       AND status = 'completed'`, 
      [userId]
    );
    const totalRides = parseInt(ridesQuery.rows[0].total_rides) || 0;

    // 2. Set Defaults
    let rating = 5.0;
    let todayEarnings = 0;
    let allTimeEarnings = 0;

    // 3. If they are a driver, get their earnings and rating
    const driverQuery = await pool.query('SELECT id, rating FROM drivers WHERE user_id = $1', [userId]);
    
    if (driverQuery.rows.length > 0) {
      const driverId = driverQuery.rows[0].id;
      rating = parseFloat(driverQuery.rows[0].rating) || 5.0;

      // Calculate All-Time Earnings
      const allTimeQuery = await pool.query(
        `SELECT SUM(fare) as total FROM rides WHERE driver_id = $1 AND status = 'completed'`, 
        [driverId]
      );
      allTimeEarnings = allTimeQuery.rows[0].total || 0;

      // Calculate Today's Earnings
      const todayQuery = await pool.query(
        `SELECT SUM(fare) as total FROM rides WHERE driver_id = $1 AND status = 'completed' AND DATE(created_at) = CURRENT_DATE`, 
        [driverId]
      );
      todayEarnings = todayQuery.rows[0].total || 0;
    }

    res.json({
      total_rides: totalRides,
      rating: rating.toFixed(1),
      today_earnings: todayEarnings,
      all_time_earnings: allTimeEarnings
    });

  } catch (err) {
    console.error('Stats Error:', err.message);
    res.status(500).json({ error: 'Server error fetching stats.' });
  }
});

// GET: /api/auth/me/rides
// Fetches the user's past rides, identifying if they were the rider or the driver
router.get('/me/rides', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // This query gets all completed rides where the user was EITHER the rider OR the driver
    // It also joins the users table twice to get both names!
    const historyQuery = await pool.query(
      `SELECT 
        r.id, 
        r.pickup_landmark, 
        r.dropoff_landmark, 
        r.fare, 
        r.created_at,
        r.status,
        rider.full_name AS rider_name,
        driver_user.full_name AS driver_name,
        CASE 
          WHEN r.rider_id = $1 THEN 'rider'
          ELSE 'driver'
        END as user_role_in_ride
      FROM rides r
      LEFT JOIN users rider ON r.rider_id = rider.id
      LEFT JOIN drivers d ON r.driver_id = d.id
      LEFT JOIN users driver_user ON d.user_id = driver_user.id
      WHERE (r.rider_id = $1 OR d.user_id = $1)
      AND r.status = 'completed'
      ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json(historyQuery.rows);

  } catch (err) {
    console.error('Ride History Error:', err.message);
    res.status(500).json({ error: 'Server error fetching ride history.' });
  }
});

module.exports = router;