const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const router = express.Router();
const jwt = require('jsonwebtoken');

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
    console.log("add product route was hit and req.cookies in add product", req.cookies);
    const token = req.cookies.authToken;
    console.log("token from cookies in add product", token);
    if (!token) {
      return res.status(401).send('No token provided');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("decoded token in add product", decoded);
    const storeId = decoded.id;

    console.log("storeId from jwt", storeId); 

    const { name, description, price, category, stock, image } = req.body;

    console.log("post request for adding product recieved in backend: ", req.body);

    if (!name || !price  || stock === undefined) { //removed category for testing
      return res.status(400).send('All fields are required.');
    }

    const newProduct = new Product({ 
      name, 
      description, 
      price, 
      category, 
      stock, 
      image,
      store: storeId,  //need to set accordingly using the credentials recieved in req.body from frontend
      });
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
