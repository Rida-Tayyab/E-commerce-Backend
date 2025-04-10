const oracledb = require('oracledb');
const calculateCartTotals = require('../utils/calculateCartTotals');
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const CartHistory = require("../models/CartHistory");
const mongoose = require('mongoose');
const { getOrderById, getStoreOrdersByOrderId, cancelStatusStoreOrder, cancelStatusMainOrder } = require('../utils/deleteOrdersutils');

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
    const totalAmount = await calculateCartTotals(cart);

    // Connect to Oracle DB
    const connection = await oracledb.getConnection(dbConfig);

    // Execute the stored procedure to create an order
    const result = await connection.execute(
      `DECLARE
         v_order_id NUMBER;
       BEGIN
         C##ecommerce.create_order(:user_id, :cart_id, :shipping_address, :payment_mode, :total_amount, v_order_id);
         :out_order_id := v_order_id;
       END;`,
      {
        user_id: userId,
        cart_id: cart._id.toString(),
        shipping_address: shippingAddress,
        payment_mode: paymentOption,
        total_amount: totalAmount,
        out_order_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );

    const orderId = result.outBinds.out_order_id;

    // Store products before clearing the cart
    const productsCopy = [...cart.products];

    // Save cart history
    const cartHistoryData = new CartHistory({
      orderId: orderId,
      products: productsCopy,
      totalAmount: totalAmount,
    });
    await cartHistoryData.save();

    // Group by store BEFORE clearing the cart
    const grouped = {};
    for (const item of productsCopy) {
      const product = await Product.findById(item.product).lean();
      const storeId = product.store.toString();
      if (!grouped[storeId]) grouped[storeId] = 0;
      grouped[storeId] += item.total;
    }

    // Insert into store_orders
    for (const [storeId, total] of Object.entries(grouped)) {
      await connection.execute(
        `INSERT INTO store_orders (order_id, store_id, payment_amount)
         VALUES (:order_id, :store_id, :payment_amount)`,
        {
          order_id: orderId,
          store_id: storeId,
          payment_amount: total
        }
      );
    }

    // Clear the cart AFTER all necessary operations
    cart.products = [];
    cart.totalAmount = 0;
    await cart.save();

    await connection.commit();
    await connection.close();

    res.status(201).json({ message: "Order placed successfully" });
  } catch (error) {
    console.error('Error placing order:', error.message);
    res.status(500).json({ message: 'Server Error', error });
  }
}



async function getOrdersByStore(req, res) {
  const { storeId } = req.params;

  try {
    // Connect to Oracle DB
    const connection = await oracledb.getConnection(dbConfig);

    // Execute the procedure to fetch orders by store
    const result = await connection.execute(
      `BEGIN
         C##ecommerce.get_orders_by_store(:store_id, :orders);
       END;`,
      {
        store_id: storeId,
        orders: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
      }
    );

    const orders = [];
    const resultSet = result.outBinds.orders;

    // Fetch all rows from the cursor and map them into an array
    let row;
    while ((row = await resultSet.getRow())) {
      console.log("Fetched Row:", row); // Log the row data to check what's being returned
      orders.push({
        orderId: row[0], // Order ID
        storeId: row[1], // Store ID
        storeStatus: row[2], // Store Status
        paymentAmount: row[3], // Payment Amount
        updatedAt: row[4], // Store Updated At (from store_orders)
        orderUpdatedAt: row[8], // Order Updated At (from orders)
      });
    }

    // Close the result set
    await resultSet.close();

    // Close the connection
    await connection.close();

    res.status(200).json({
      message: 'Orders fetched successfully',
      orders
    });

    console.log('Orders fetched successfully:', orders);
  } catch (error) {
    console.error('Error fetching orders by store:', error.message);
    res.status(500).json({ message: 'Server Error', error });
  }
}


// Delete Order (Customer)
async function deleteOrder(req, res) {
  const orderId = req.params.id;

  try {
    const mainOrder = await getOrderById(orderId);
    if (!mainOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const storeOrders = await getStoreOrdersByOrderId(orderId);

    // Case 1: If main order is 'cancelled', update all store orders to 'cancelled'
    if (mainOrder.STATUS === 'cancelled') {
      for (const storeOrder of storeOrders) {
        await updateStoreOrderStatus(storeOrder.STORE_ID, 'cancelled', orderId);
      }

      return res.status(200).json({ message: 'Store orders updated to cancelled for a cancelled main order.' });
    }

    // Case 2: If main order is 'pending', check if all store orders are also 'pending'
    if (mainOrder.STATUS === 'pending') {
      const nonPendingStore = storeOrders.find(order => order.STATUS !== 'pending');

      if (nonPendingStore) {
        return res.status(400).json({
          message: `Cannot delete. Store order from store ID ${nonPendingStore.STORE_ID} is already ${nonPendingStore.STATUS}.`
        });
      }

      await cancelStatusStoreOrders(orderId);
      await cancelStatusMainOrder(orderId);

      return res.status(200).json({ message: 'Order and all related store orders successfully deleted.' });
    }

    // Default fallback
    return res.status(400).json({ message: 'Order cannot be deleted. Only pending or cancelled orders are allowed.' });

  } catch (error) {
    console.error('Error deleting order:', error);
    return res.status(500).json({ message: 'Server Error', error });
  }
}


// Get Orders by User (Customer)
async function getOrdersByUser(req, res) {
  const { userId } = req.params;

  try {
    // Step 1: Connect to Oracle DB and get the orders for the user
    const connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `BEGIN get_orders_by_user(:user_id, :orders); END;`,
      {
        user_id: userId,
        orders: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
      }
    );

    const resultSet = result.outBinds.orders;
    const orders = await resultSet.getRows();
    await resultSet.close();
    await connection.close();

    if (orders.length === 0) {
      return res.status(404).json({ message: "No orders found for this user" });
    }

    // Step 2: Get the order IDs
    const orderIds = orders.map(order => order[0]); // assuming order[0] = orderId

    // Step 3: Get carts and populate product names
    const carts = await CartHistory.find({ orderId: { $in: orderIds } });

    // Fetch all product IDs used in the carts
    const allProductIds = carts.flatMap(cart =>
      cart.products.map(p => p.product)
    );

    const productDetails = await Product.find({ _id: { $in: allProductIds } }, 'name'); // fetch only name

    // Step 4: Create a map for productId => name
    const productMap = {};
    productDetails.forEach(p => {
      productMap[p._id.toString()] = p.name;
    });

    // Step 5: Match carts with orders and include product names
    const ordersWithCart = orders.map(order => {
      const orderId = order[0];
      const matchingCart = carts.find(cart => cart.orderId === orderId);

      // Enhance products with product name
      const enhancedProducts = matchingCart?.products.map(prod => ({
        ...prod._doc,
        name: productMap[prod.product.toString()] || "Unknown Product"
      }));

      return {
        orderDetails: {
          id: order[0],
          status: order[1],
          shippingAddress: order[2],
          orderId: order[0],
          createdAt: order[4],
          updatedAt: order[5],
          paymentMethod: order[6],
        },
        cart: matchingCart ? { ...matchingCart._doc, products: enhancedProducts } : null,
      };
    });

    // Step 6: Send final response
    res.status(200).json({
      message: "Orders fetched successfully",
      orders: ordersWithCart,
    });

  } catch (error) {
    console.error("Error fetching orders:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}
async function updateMainOrderStatus(orderId) {
  const connection = await oracledb.getConnection(dbConfig);

  try {
    const result = await connection.execute(
      `SELECT
         COUNT(*) AS total_orders,
         COUNT(CASE WHEN status = 'delivered' THEN 1 END) AS delivered_orders,
         COUNT(CASE WHEN status = 'shipped' THEN 1 END) AS shipped_orders
       FROM store_orders
       WHERE order_id = :order_id`,
      { order_id: orderId }
    );

    const row = result.rows[0];
    const totalOrders = row.TOTAL_ORDERS;
    const deliveredOrders = row.DELIVERED_ORDERS;
    const shippedOrders = row.SHIPPED_ORDERS;

    let newStatus = null;

    if (deliveredOrders === totalOrders) {
      newStatus = 'delivered';
    } else if (shippedOrders === totalOrders ) {
      newStatus = 'shipped';
    }

    if (newStatus) {
      await connection.execute(
        `UPDATE orders
         SET status = :status
         WHERE id = :order_id`,
        {
          status: newStatus,
          order_id: orderId,
        },
        { autoCommit: true }
      );
    }
  } catch (err) {
    console.error("Error updating main order status:", err.message);
    throw err;
  } finally {
    await connection.close();
  }
}

//Update status of order by store
// Update status of the store order (e.g., marking it as delivered)
async function updateStoreOrderStatus(storeId, status, orderId) {
  // Implement the logic to update the store's order status in the store_orders table
  const connection = await oracledb.getConnection(dbConfig);
  try {
    await connection.execute(
      `UPDATE store_orders
         SET status = :status
       WHERE store_id = :store_id AND order_id = :order_id`,
      {
        status: status,
        store_id: storeId,
        order_id: orderId
      },
      { autoCommit: true }
    );
  } catch (error) {
    console.error('Error updating store order status:', error.message);
    throw new Error('Error updating store order status');  // Throw an error to be handled by the route
  } finally {
    await connection.close(); // Make sure to close the connection
  }
}


module.exports = {
  placeOrder,
  deleteOrder,
  getOrdersByUser,
  updateMainOrderStatus,
  updateStoreOrderStatus,
  getOrdersByStore,
};
