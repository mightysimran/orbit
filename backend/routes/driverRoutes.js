const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// --- MULTER FOR MULTIPLE IMAGES ---
const uploadDir = path.join(__dirname, "../uploads/vehicles");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});
const upload = multer({ storage: storage });

// GET: /api/driver/status
router.get("/status", authMiddleware, async (req, res) => {
  try {
    const driverCheck = await pool.query(
      "SELECT status, rejection_reason FROM drivers WHERE user_id = $1",
      [req.user.id],
    );
    if (driverCheck.rows.length === 0) return res.json({ status: "none" });
    res.json(driverCheck.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error fetching driver status." });
  }
});

// POST: /api/driver/register
// 🚨 Now accepts two specific images!
router.post(
  "/register",
  [
    authMiddleware,
    upload.fields([
      { name: "vehicleImage", maxCount: 1 },
      { name: "licenseImage", maxCount: 1 },
    ]),
  ],
  async (req, res) => {
    try {
      const { license_no, plate_number, phone_number, vehicle_details } =
        req.body;
      const userId = req.user.id;

      if (
        !req.files ||
        !req.files["vehicleImage"] ||
        !req.files["licenseImage"]
      ) {
        return res
          .status(400)
          .json({
            error: "Both Vehicle image and License image are required.",
          });
      }

      const vehicleImagePath = `/uploads/vehicles/${req.files["vehicleImage"][0].filename}`;
      const licenseImagePath = `/uploads/vehicles/${req.files["licenseImage"][0].filename}`;

      const existing = await pool.query(
        "SELECT id FROM drivers WHERE user_id = $1",
        [userId],
      );

      if (existing.rows.length > 0) {
        // Re-uploading after rejection
        await pool.query(
          `UPDATE drivers SET license_no=$1, plate_number=$2, phone_number=$3, vehicle_details=$4, vehicle_image_path=$5, license_image_path=$6, status='pending', rejection_reason=NULL WHERE user_id=$7`,
          [
            license_no,
            plate_number,
            phone_number,
            vehicle_details,
            vehicleImagePath,
            licenseImagePath,
            userId,
          ],
        );
      } else {
        // First time registering
        await pool.query(
          `INSERT INTO drivers (user_id, license_no, plate_number, phone_number, vehicle_details, vehicle_image_path, license_image_path, status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')`,
          [
            userId,
            license_no,
            plate_number,
            phone_number,
            vehicle_details,
            vehicleImagePath,
            licenseImagePath,
          ],
        );
      }
      res.json({ message: "Driver application submitted successfully." });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ error: "Server error during driver registration." });
    }
  },
);

// POST: /api/driver/go-online
router.post("/go-online", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const driverCheck = await pool.query(
      "SELECT id, status FROM drivers WHERE user_id = $1",
      [userId],
    );

    if (
      driverCheck.rows.length === 0 ||
      driverCheck.rows[0].status !== "approved"
    ) {
      return res
        .status(403)
        .json({ error: "You must be an approved driver to go online." });
    }

    const updatedDriver = await pool.query(
      `UPDATE drivers SET is_online = true WHERE user_id = $1 RETURNING id`,
      [userId],
    );
    res.json({
      message: "You are now ONLINE 🟢",
      driver_id: updatedDriver.rows[0].id,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST: /api/driver/go-offline
router.post("/go-offline", authMiddleware, async (req, res) => {
  try {
    await pool.query(
      `UPDATE drivers SET is_online = false WHERE user_id = $1`,
      [req.user.id],
    );
    res.json({ message: "You are now OFFLINE 🔴" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET: /api/driver/earnings/:userId
router.get("/earnings/:userId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const driverResult = await pool.query(
      "SELECT id FROM drivers WHERE user_id = $1",
      [userId],
    );
    if (driverResult.rows.length === 0)
      return res.json({
        today_earnings: 0,
        all_time_earnings: 0,
        total_rides: 0,
      });
    const driverId = driverResult.rows[0].id;
    const earningsResult = await pool.query(
      `SELECT COUNT(id) as total_rides, COALESCE(SUM(fare), 0) as all_time_earnings, COALESCE(SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN fare ELSE 0 END), 0) as today_earnings FROM rides WHERE driver_id = $1 AND LOWER(status) = 'completed'`,
      [driverId],
    );
    res.json({
      total_rides: parseInt(earningsResult.rows[0].total_rides),
      all_time_earnings: parseFloat(earningsResult.rows[0].all_time_earnings),
      today_earnings: parseFloat(earningsResult.rows[0].today_earnings),
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
