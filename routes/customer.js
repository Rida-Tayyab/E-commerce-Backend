const express = require('express');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const authenticateUser = require('../middleware/auth');
const Review = require('../models/Review');
const Store = require('../models/Store');
const redisClient = require('../utils/redisClient');


const router = express.Router();

router.get('/products', async (req, res) => {
  try {
    const { search, category } = req.query;

    // Create cache key
    const cacheKeyParts = ['products'];
    if (search) cacheKeyParts.push(`search:${search}`);
    if (category) cacheKeyParts.push(`category:${category}`);
    const cacheKey = cacheKeyParts.join(':');

    // Check cache
    const cachedProducts = await redisClient.get(cacheKey);
    if (cachedProducts) {
      return res.status(200).json(JSON.parse(cachedProducts));
    }

    // Build filter
    let filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) {
      filter = filter.$or 
        ? { $and: [{ $or: filter.$or }, { category }] }
        : { category };
    }

    // Fetch from DB
    const products = await Product.find(filter)
      .populate('store', 'businessName ownerName ownerEmail businessType NTN contactEmail phone website address logoUrl description')
      .sort({ createdAt: -1 });

    // Cache result
    await redisClient.set(cacheKey, JSON.stringify(products), { EX: 3600 });
    res.status(200).json(products);

  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send('Error fetching products');
  }
});




router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find({}, 'name');
    res.status(200).send(categories);
  } catch (error) {
    res.status(500).send('Error fetching categories');
  }
});

//first calls authenticateUser middleware. After a user adds a review, calculates and updates the product and store rating and review count

router.post('/review', authenticateUser, async (req, res) => {
  try {
    const { product, rating, review } = req.body;
    const userId = req.user._id;

    if (!product || !rating || !review) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const existing = await Review.findOne({ user: userId, product });
    if (existing) {
      return res.status(400).json({ message: "You have already reviewed this product." });
    }

    const newReview = new Review({
      user: userId,
      product,
      rating,
      review,
    });

    await newReview.save();

    // Update product rating
    const productAggregate = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(product) } },
      {
        $group: {
          _id: '$product',
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      }
    ]);

    const { avgRating = 0, reviewCount = 0 } = productAggregate[0] || {};

    const updatedProduct = await Product.findByIdAndUpdate(product, {
      rating: avgRating.toFixed(1),
      reviewCount
    }, { new: true });

    // Update store rating
    const storeId = updatedProduct.store;

    const storeAggregate = await Product.aggregate([
      { $match: { store: new mongoose.Types.ObjectId(storeId), rating: { $gt: 0 } } },
      {
        $group: {
          _id: '$store',
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: '$reviewCount' }
        }
      }
    ]);

    const storeStats = storeAggregate[0] || { avgRating: 0, reviewCount: 0 };

    await Store.findByIdAndUpdate(storeId, {
      rating: storeStats.avgRating.toFixed(1),
      reviewCount: storeStats.reviewCount
    });

    res.status(201).json(newReview);
  } catch (err) {
    console.error("Error creating review:", err);
    res.status(500).json({ message: "Something went wrong." });
  }
});


module.exports = router;

