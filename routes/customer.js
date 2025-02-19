const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
const router = express.Router();

// Get all products
router.get('/products', async (req, res) => {
  const { search, category } = req.query;
  console.log("Received Category:", category); // Debugging

  try {
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (category) {
      query.category = category; // Match by category name
    }

    const products = await Product.find(query);
    console.log("Filtered Products:", products); // Debugging

    res.status(200).send(products);
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

module.exports = router;
