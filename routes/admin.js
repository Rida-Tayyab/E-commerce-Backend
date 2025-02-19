const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const router = express.Router();

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
//get products
router.get('/products', async (req, res) => {
  const { search, category } = req.query;

  try {
    // Build query based on search and category filters
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' }; // Case-insensitive search
    }

    if (category) {
      query.category = category;
    }

    const products = await Product.find(query);

    res.status(200).send(products);
  } catch (error) {
    res.status(500).send('Error fetching products');
  }
});
//get orders
router.get("/order", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "email")
      .populate("products.product", "name price");

    res.json(orders);
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
    const { name, description, price, category, stock, image } = req.body;

    if (!name || !description || !price || !category || stock === undefined) {
      return res.status(400).send('All fields are required.');
    }

    const newProduct = new Product({ name, description, price, category, stock, image });
    await newProduct.save();

    res.status(201).json({ message: 'Product added successfully', product: newProduct });
  } catch (error) {
    res.status(500).send('Error adding product');
  }
});

// Update an order's status by ID
router.put('/order/:id', async (req, res) => {
  try {
    const { status } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) return res.status(404).send('Order not found');

    res.status(200).json({ message: 'Order status updated successfully', order: updatedOrder });
  } catch (error) {
    res.status(500).send('Error updating order status');
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const { name, description, price, category, stock, image } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { name, description, price, category, stock, image },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) return res.status(404).send('Product not found');

    res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
    res.status(500).send('Error updating product');
  }
});

// Delete a product by ID
router.delete('/products/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) return res.status(404).send('Product not found');

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).send('Error deleting product');
  }
});

module.exports = router;
