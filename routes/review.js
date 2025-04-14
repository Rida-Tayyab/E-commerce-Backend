// routes/review.js
const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

router.get('/', async (req, res) => {
  const { product } = req.query;
  if (!product) return res.status(400).json({ message: 'Product ID is required' });

  try {
    const reviews = await Review.find({ product })
      .populate('user', 'name') 
      .sort({ createdAt: -1 }); 
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
