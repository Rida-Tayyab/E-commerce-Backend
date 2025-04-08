const express = require("express");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

const router = express.Router();

// Place an Order (Customer)
router.post("/", async (req, res) => {
  const { userId, shippingAddress ,paymentOption} = req.body;

  try {
    const cart = await Cart.findOne({ user: userId }).populate("products.product");
    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ msg: "Cart is empty" });
    }

    let totalAmount = 0;
    const productsWithTotal = [];

    for (const item of cart.products) {
      const productData = item.product;
      const quantity = item.quantity;
      const total = productData.price * quantity;
      totalAmount += total;

      productsWithTotal.push({
        product: productData._id,
        quantity,
        total,
      });
    }
    const newOrder = new Order({
      user: userId,
      products: productsWithTotal,
      totalAmount,
      shippingAddress,
      paymentOption,
    });

    await newOrder.save();

    await Cart.findOneAndUpdate({ user: userId }, { products: [] });

    res.status(201).json({ message: "Order placed successfully", order: newOrder });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error", error });
  }
});

// Delete an Order (Customer)
router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    await order.deleteOne();
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error", error });
  }
});

// Get All Orders (Admin)
router.get("/", async (req, res) => {
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

// Get Order by ID of user(Admin)
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "email")
      .populate("products.product", "name price");

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error", error });
  }
});

// Update Order Status (Admin)
router.put("/:id", async (req, res) => {
  const { status } = req.body;

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    const validStatuses = ["pending", "shipped", "delivered"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ msg: "Invalid status" });
    }

    order.status = status;
    await order.save();

    res.json(order);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server Error", error });
  }
});

module.exports = router;
