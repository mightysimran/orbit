const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// POST: /api/reviews
// Submit a review for a completed ride
router.post('/', authMiddleware, async (req, res) => {
  try {
    const reviewerId = req.user.id;
    const { ride_id, reviewee_id, rating, comment } = req.body;

    // 1. Basic validation
    if (!ride_id || !reviewee_id || !rating) {
      return res.status(400).json({ error: 'Ride ID, Reviewee ID, and Rating are required.' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    // 2. Insert the review into the database
    const newReview = await pool.query(
      `INSERT INTO reviews (ride_id, reviewer_id, reviewee_id, rating, comment) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [ride_id, reviewerId, reviewee_id, rating, comment]
    );

    res.status(201).json({
      message: 'Review submitted successfully!',
      review: newReview.rows[0]
    });
  } catch (err) {
    console.error('Submit Review Error:', err.message);
    res.status(500).json({ error: 'Server error while submitting review.' });
  }
});

// GET: /api/reviews/user/:id
// Get all reviews for a specific user (to show on their profile)
router.get('/user/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const reviews = await pool.query(
      `SELECT rating, comment, created_at 
       FROM reviews 
       WHERE reviewee_id = $1 
       ORDER BY created_at DESC`,
      [id]
    );

    // Calculate the average rating
    const avgResult = await pool.query(
      `SELECT ROUND(AVG(rating), 1) as average_rating 
       FROM reviews 
       WHERE reviewee_id = $1`,
      [id]
    );

    res.json({
      average_rating: avgResult.rows[0].average_rating || 0,
      total_reviews: reviews.rows.length,
      reviews: reviews.rows
    });
  } catch (err) {
    console.error('Fetch Reviews Error:', err.message);
    res.status(500).json({ error: 'Server error fetching reviews.' });
  }
});

module.exports = router;