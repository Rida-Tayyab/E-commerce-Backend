const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const updateStoreSales = require('../utils/updateStoreSales');

// Place an order (Customer)
router.post('/', orderController.placeOrder);

// Delete an order (Customer)
router.delete('/:id', orderController.deleteOrder);

// // Get all orders by user (Admin)
// router.get('/:id', orderController.getOrdersByUser);

//Get orders by store
router.get('/store/:storeId', orderController.getOrdersByStore);

// Update order status (Admin)
router.put('/:id', orderController.updateOrderStatus);

module.exports = router;


// const express = require("express");
// const Order = require("../models/Order");
// const Cart = require("../models/Cart");
// const Product = require("../models/Product");

// const router = express.Router();

// // Helper to calculate totals
// async function calculateCartTotals(cart) {
//   let totalAmount = 0;

//   for (const item of cart.products) {
//     const productData = await Product.findById(item.product);
//     if (!productData) continue;

//     const total = productData.price * item.quantity;
//     item.total = total;
//     totalAmount += total;
//   }

//   cart.totalAmount = totalAmount;
//   await cart.save();
// }

// // Place an Order (Customer)
// router.post("/", async (req, res) => {
//   const { userId, shippingAddress, paymentOption = "cod" } = req.body;

//   try {
//     let cart = await Cart.findOne({ user: userId });
//     if (!cart || cart.products.length === 0) {
//       return res.status(400).json({ msg: "Cart is empty" });
//     }

//     await calculateCartTotals(cart);

//     const newOrder = new Order({
//       user: userId,
//       cart: cart._id,
//       shippingAddress,
//       paymentOption,
//     });

//     await newOrder.save();

//     // Optionally clear the cart after placing the order
//     cart.products = [];
//     cart.totalAmount = 0;
//     await cart.save();

//     res.status(201).json({ message: "Order placed successfully", order: newOrder });
//   } catch (error) {
//     console.error("Error placing order:", error.message);
//     res.status(500).json({ message: "Server Error", error });
//   }
// });

// // Delete an Order (Customer)
// router.delete("/:id", async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id);
//     if (!order) {
//       return res.status(404).json({ msg: "Order not found" });
//     }

//     await order.deleteOne();
//     res.json({ message: "Order deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting order:", error.message);
//     res.status(500).json({ message: "Server Error", error });
//   }
// });

// // Get All Orders (Admin)
// // router.get("/", async (req, res) => {
// //   try {
// //     const orders = await Order.find()
// //       .populate("user", "email")
// //       .populate({
// //         path: "cart",
// //         populate: {
// //           path: "products.product",
// //           select: "name price",
// //         },
// //       });

// //     res.json(orders);
// //   } catch (error) {
// //     console.error("Error fetching orders:", error.message);
// //     res.status(500).json({ message: "Server Error", error });
// //   }
// // });

// // Get Order by ID User
// router.get("/:id", async (req, res) => {
//   try {
//     const order = await Order.findById({user:req.params.id})
//       .populate("user", "email")
//       .populate({
//         path: "cart",
//         populate: {
//           path: "products.product",
//           select: "name price",
//         },
//       });

//     if (!order) {
//       return res.status(404).json({ msg: "Order not found" });
//     }

//     res.json(order);
//   } catch (error) {
//     console.error("Error fetching order:", error.message);
//     res.status(500).json({ message: "Server Error", error });
//   }
// });

// Update Order Status (Admin) this calls a trigger updateStoreSales in /utils that updates the total number of sales associate with a store once one of it's orders is marked delivered
router.put("/:id", async (req, res) => {
    const { status } = req.body;
  
    try {
      const order = await Order.findById(req.params.id).populate({
        path: 'cart',
        populate: {
          path: 'products.product',
          model: 'Product'
        }
      });
  
      if (!order) {
        return res.status(404).json({ msg: "Order not found" });
      }
  
      const validStatuses = ["pending", "shipped", "delivered"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ msg: "Invalid status" });
      }
  
      const wasAlreadyDelivered = order.status === "delivered";
  
      order.status = status;
      order.updatedAt = new Date();
      await order.save();
  
      if (status === "delivered" && !wasAlreadyDelivered) {
        const storeIds = new Set();
  
        for (const item of order.cart.products) {
          const storeId = item.product?.store;
          if (storeId) {
            storeIds.add(storeId.toString());
          }
        }
  
        for (const storeId of storeIds) {
          await updateStoreSales(storeId);
        }
      }
  
      res.json(order);
    } catch (error) {
      console.error("Error updating order:", error.message);
      res.status(500).json({ message: "Server Error", error });
    }
  });

// module.exports = router;
