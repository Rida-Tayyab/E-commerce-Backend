const oracledb = require('oracledb');
const calculateCartTotals = require('../utils/calculateCartTotals');
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Database connection settings
const dbConfig = {
    user: "C##ecommerce",
    password:"ecommerce123",
    connectString: 'localhost:1521/XE',
};

// Place Order (Customer)
async function placeOrder(req, res) {
  const { userId, shippingAddress, paymentOption = 'cod' } = req.body;

  try {
    let cart = await Cart.findOne({ user: userId });
    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ msg: "Cart is empty" });
    }

    // Calculate cart totals
    await calculateCartTotals(cart);

    // Connect to Oracle DB
    const connection = await oracledb.getConnection(dbConfig);
    
    // Execute the stored procedure to create an order
    await connection.execute(
      `BEGIN
         C##ecommerce.create_order(:user_id, :cart_id, :shipping_address, :payment_mode);
       END;`,
      {
        user_id: userId,
        cart_id: cart._id.toString(),
        shipping_address: shippingAddress,
        payment_mode: paymentOption,
      }
    );

    // Optionally clear the cart after placing the order
    cart.products = [];
    cart.totalAmount = 0;
    await cart.save();

    res.status(201).json({ message: "Order placed successfully" });
    
    // Close the connection
    await connection.close();
  } catch (error) {
    console.error('Error placing order:', error.message);
    res.status(500).json({ message: 'Server Error', error });
  }
}

// Delete Order (Customer)
async function deleteOrder(req, res) {
  const { orderId } = req.params;
  
  try {
    const connection = await oracledb.getConnection(dbConfig);
    
    // Execute the procedure to delete the order
    await connection.execute(
      `BEGIN
         delete_order(:order_id);
       END;`,
      {
        order_id: orderId,
      }
    );

    res.status(200).json({ message: 'Order deleted successfully' });

    // Close the connection
    await connection.close();
  } catch (error) {
    console.error('Error deleting order:', error.message);
    res.status(500).json({ message: 'Server Error', error });
  }
}

// Get Orders by User (Customer)
async function getOrdersByUser(req, res) {
  const { userId } = req.params;
  
  try {
    const connection = await oracledb.getConnection(dbConfig);
    
    // Execute the procedure to fetch orders by user
    const result = await connection.execute(
      `BEGIN
         get_order_by_user(:user_id);
       END;`,
      {
        user_id: userId,
      }
    );

    res.status(200).json({ message: 'Orders fetched successfully', result });
    
    // Close the connection
    await connection.close();
  } catch (error) {
    console.error('Error fetching orders:', error.message);
    res.status(500).json({ message: 'Server Error', error });
  }
}

// Update Order Status (Admin)
async function updateOrderStatus(req, res) {
  const { orderId, status } = req.body;
  
  try {
    const connection = await oracledb.getConnection(dbConfig);
    
    // Execute the procedure to update the order status
    await connection.execute(
      `BEGIN
         update_order_status(:order_id, :status);
       END;`,
      {
        order_id: orderId,
        status: status,
      }
    );

    res.status(200).json({ message: 'Order status updated successfully' });

    // Close the connection
    await connection.close();
  } catch (error) {
    console.error('Error updating order status:', error.message);
    res.status(500).json({ message: 'Server Error', error });
  }
}

module.exports = {
  placeOrder,
  deleteOrder,
  getOrdersByUser,
  updateOrderStatus,
};
