// utils/calculateCartTotals.js

const Product = require('../models/Product');

// Helper to calculate totals for the cart
async function calculateCartTotals(cart) {
  let totalAmount = 0;

  // Loop through cart items and calculate total
  for (const item of cart.products) {
    const productData = await Product.findById(item.product);
    if (!productData) continue;

    const total = productData.price * item.quantity;
    item.total = total;
    totalAmount += total;
  }

  // Update the totalAmount in cart object and save it
  cart.totalAmount = totalAmount;
  await cart.save();

  return totalAmount;
}

module.exports = calculateCartTotals;
