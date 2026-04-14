const express = require("express");
const router = express.Router(); // Small typo fix: express.Router()
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

// Fix: Correcting the router initialization
const expressRouter = express.Router();

// POST: /api/rides/request
// Rider submits a ride request
expressRouter.post("/request", authMiddleware, async (req, res) => {
  try {
    const riderId = req.user.id;
    const { pickup_landmark, dropoff_landmark } = req.body;

    // 1. Check if user is approved
    if (req.user.status !== "approved") {
      return res
        .status(403)
        .json({ error: "You must be verified to book a ride." });
    }

    // 2. Validate input
    if (!pickup_landmark || !dropoff_landmark) {
      return res
        .status(400)
        .json({ error: "Pickup and dropoff landmarks are required." });
    }

    // 3. Create the ride in the database with 'requesting' status
    const newRide = await pool.query(
      `INSERT INTO rides (rider_id, pickup_landmark, dropoff_landmark, status) 
       VALUES ($1, $2, $3, 'requesting') 
       RETURNING *`,
      [riderId, pickup_landmark, dropoff_landmark],
    );

    res.status(201).json({
      message: "Ride requested successfully!",
      ride: newRide.rows[0],
    });
  } catch (err) {
    console.error("Ride Request Error:", err.message);
    res.status(500).json({ error: "Server error while requesting ride." });
  }
});

// POST: /api/rides/:id/cancel
// Cancel an active or requested ride
expressRouter.post("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the ride to ensure the person cancelling is actually part of the ride
    const rideCheck = await pool.query("SELECT * FROM rides WHERE id = $1", [
      id,
    ]);

    if (rideCheck.rows.length === 0) {
      return res.status(404).json({ error: "Ride not found." });
    }

    const ride = rideCheck.rows[0];

    // Check if the user is the rider (or driver) associated with this ride
    // For now, we assume the user is the rider cancelling. If they are a driver, you'd check driver_id.
    if (ride.rider_id !== userId) {
      // Just a safety check to ensure users can't cancel other people's rides
      // If we want admins or drivers to cancel, we'd add that logic here.
      return res
        .status(403)
        .json({ error: "You do not have permission to cancel this ride." });
    }

    // Update status to cancelled
    const cancelledRide = await pool.query(
      `UPDATE rides SET status = 'cancelled' WHERE id = $1 RETURNING *`,
      [id],
    );

    res.json({
      message: "Ride cancelled successfully.",
      ride: cancelledRide.rows[0],
    });
  } catch (err) {
    console.error("Cancel Ride Error:", err.message);
    res.status(500).json({ error: "Server error while cancelling ride." });
  }
});

// GET: /api/rides/history
// Get ride history for logged-in user
expressRouter.get("/history", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch rides where the user was the rider (we will add driver history logic later if needed)
    const history = await pool.query(
      `SELECT * FROM rides WHERE rider_id = $1 ORDER BY created_at DESC`,
      [userId],
    );

    res.json(history.rows);
  } catch (err) {
    console.error("Ride History Error:", err.message);
    res.status(500).json({ error: "Server error fetching history." });
  }
});

// POST: /api/rides/rate
// Submits a review and instantly recalculates the driver's exact average rating
router.post("/rate", authMiddleware, async (req, res) => {
  try {
    const { ride_id, driver_user_id, rating, comment } = req.body;
    const reviewerId = req.user.id;

    // 1. Insert the new review into the reviews table
    await pool.query(
      `INSERT INTO reviews (ride_id, reviewer_id, reviewee_id, rating, comment) 
       VALUES ($1, $2, $3, $4, $5)`,
      [ride_id, reviewerId, driver_user_id, rating, comment],
    );

    // 2. Calculate the true mathematical average of ALL reviews for this driver
    const avgQuery = await pool.query(
      `SELECT AVG(rating) as new_average 
       FROM reviews 
       WHERE reviewee_id = $1`,
      [driver_user_id],
    );

    // Fallback to 5.0 if something goes wrong, otherwise use the calculated average
    const newAverage = parseFloat(avgQuery.rows[0].new_average) || 5.0;

    // 3. Update the drivers table with the perfect new average!
    await pool.query(`UPDATE drivers SET rating = $1 WHERE user_id = $2`, [
      newAverage.toFixed(2),
      driver_user_id,
    ]);

    res.json({
      message: "Rating submitted and driver average updated successfully!",
    });
  } catch (err) {
    console.error("Rating Error:", err.message);
    res.status(500).json({ error: "Server error processing rating." });
  }
});

module.exports = expressRouter;
