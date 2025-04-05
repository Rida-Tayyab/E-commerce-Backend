const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order= require('../models/Order');

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

module.exports = router;

