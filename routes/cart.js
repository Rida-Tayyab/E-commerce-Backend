const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const router = express.Router();

// Add product to cart (or increase quantity)
router.post("/", async (req, res) => {
  const { userId, productId, quantity } = req.body;

  try {
    if (!userId || !productId || !quantity) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      console.log("Creating new cart...");
      cart = new Cart({ user: userId, products: [] });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    const productIndex = cart.products.findIndex((item) =>
      item.product.equals(product._id)
    );

    if (productIndex > -1) {
      cart.products[productIndex].quantity += quantity;
    } else {
      cart.products.push({ product: productId, quantity });
    }

    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error("Error adding product to cart:", error.message);
    res.status(500).send("Server Error");
  }
});

// Get all products in cart
router.get("/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.params.userId }).populate(
      "products.product"
    );
    if (!cart || cart.products.length === 0) {
      return res.status(404).json({ msg: "Cart is empty" });
    }
    res.json(cart);
  } catch (error) {
    console.error("Error fetching cart:", error.message);
    res.status(500).send("Server Error");
  }
});

// Update product quantity in cart
router.put("/update", async (req, res) => {
  const { userId, productId, quantity } = req.body;

  try {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ msg: "Cart not found" });
    }

    const productIndex = cart.products.findIndex((item) =>
      item.product.equals(productId)
    );

    if (productIndex === -1) {
      return res.status(404).json({ msg: "Product not found in cart" });
    }

    // Update quantity or remove if it's zero
    if (quantity > 0) {
      cart.products[productIndex].quantity = quantity;
    } else {
      cart.products.splice(productIndex, 1);
    }

    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error("Error updating cart:", error.message);
    res.status(500).send("Server Error");
  }
});

// Remove product from cart
router.delete("/remove", async (req, res) => {
  const { userId, productId } = req.body;

  try {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ msg: "Cart not found" });
    }

    cart.products = cart.products.filter((item) => !item.product.equals(productId));

    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error("Error removing product from cart:", error.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
