const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Store = require('../models/Store');
const router = express.Router();
const jwt = require('jsonwebtoken');
const redisClient= require('../utils/redisClient');
const { clearProductCache } = require('../utils/redisClient');


//Get store by ID
router.get('/store/:id', async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).send('Store not found');
    res.status(200).json(store);
  } catch (error) {
    res.status(500).send('Error fetching store');
  }
});
// Get all categories (Read-Only)
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).send('Error fetching categories');
  }
});
// Delete a Category by ID
router.delete('/categories/:id', async (req, res) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);

    if (!deletedCategory) return res.status(404).send('Category not found');

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).send('Error deleting category');
  }
});
// Add a new product
router.post('/categories', async (req, res) => {
  try {
    const { name} = req.body;

    if (!name) {
      return res.status(400).send('All fields are required.');
    }

    const newCategory = new Category({ name});
    await newCategory.save();

    res.status(201).json({ message: 'Category added successfully', category: newCategory });
  } catch (error) {
    res.status(500).send('Error adding category');
  }
});
//get products by store id
router.get('/products/store/:id', async (req, res) => {
  const token = req.cookies.authToken;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log("decoded token in add product", decoded);
  const storeId = decoded.id;
  try {
    const products = await Product.find({ store: storeId })
    res.status(200).json(products);
  } catch (error) {
    res.status(500).send('Error fetching products');
  }
});


//get orders bu store id
router.get("/order/store/:id", async (req, res) => {
  const token = req.cookies.authToken;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log("decoded token in add product", decoded);
  const storeId = decoded.id;
  try {
    const orders = await Order.find({store : storeId})
    console.log("orders from db", orders);
    res.status(200).json(orders);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error", error });
  }
});


// Get a single category by ID
router.get('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).send('Category not found');
    res.status(200).json(category);
  } catch (error) {
    res.status(500).send('Error fetching category');
  }
});

/* Product Controls (No Admin Restriction) */

// Add a new product
router.post('/products', async (req, res) => {
  try {
    const token = req.cookies.authToken;
    if (!token) return res.status(401).send('No token provided');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const storeId = decoded.id;

    const { name, description, price, category, stock, image } = req.body;
    if (!name || !price || stock === undefined) {
      return res.status(400).send('All fields are required.');
    }

    const newProduct = new Product({ 
      name, description, price, category, stock, image, store: storeId
    });

    await newProduct.save();
    
    // Clear cache and wait for completion
    await redisClient.clearProductCache();
    console.log('Cache cleared after product creation');
    
    res.status(201).json({ message: 'Product added successfully', product: newProduct });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).send('Error adding product');
  }
});

// PUT /products/:id
router.put('/products/:id', async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Product not found' });

    // Clear cache and wait for completion
    await redisClient.clearProductCache();
    console.log('Cache cleared after product update');

    res.status(200).json(updated);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(400).json({ error: 'Update failed' });
  }
});
// DELETE /products/:id
router.delete('/products/:id', async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Product not found' });

    // Clear cache and wait for completion
    await redisClient.clearProductCache();
    console.log('Cache cleared after product deletion');

    res.status(200).json({ message: 'Product deleted' });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ error: 'Deletion failed' });
  }
});

module.exports = router;
