const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
const authenticateUser = require('../middleware/auth');
const Review = require('../models/Review');


const router = express.Router();

// Get all products
router.get('/products', async (req, res) => {
  try{
    const { search, category } = req.query;
    let filter = {};
    if(search) {
      filter = {$or: [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { store: { $regex: search, $options: 'i' } }
      ]
    }
  }
  const products = await Product.find(filter)
  .populate('store', 'businessName ownerName ownerEmail businessType NTN contactEmail phone website address logoUrl description')
  .sort({ createdAt: -1 });
  console.log("Received Category:", category); 
  console.log("Products populated with store info sent to frontend: ", products); // Debugging
  res.json(products);
  
  }
  catch (error) {
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

    const aggregate = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(product) } },
      {
        $group: {
          _id: '$product',
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      }
    ]);

    const { avgRating = 0, reviewCount = 0 } = aggregate[0] || {};

    await Product.findByIdAndUpdate(product, {
      rating: avgRating.toFixed(1),
      reviewCount
    });

    res.status(201).json(newReview);
  } catch (err) {
    console.error("Error creating review:", err);
    res.status(500).json({ message: "Something went wrong." });
  }
});

module.exports = router;

