const oracledb = require('oracledb');
const calculateCartTotals = require('../utils/calculateCartTotals');
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { getOrderById, getStoreOrdersByOrderId, deleteStoreOrders, deleteMainOrder } = require('../utils/deleteOrdersutils');

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
    const totalAmount=await calculateCartTotals(cart);

    // Connect to Oracle DB
    const connection = await oracledb.getConnection(dbConfig);
    
    // Execute the stored procedure to create an order
    const result = await connection.execute(
      `DECLARE
         v_order_id NUMBER;
       BEGIN
         C##ecommerce.create_order(:user_id, :cart_id, :shipping_address, :payment_mode,:total_amount, v_order_id);
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

    const grouped = {};
    for (const item of cart.products) {
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

    await connection.commit();


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

    if (mainOrder.STATUS !== 'pending') {
      return res.status(400).json({ message: 'Order cannot be deleted. Status is not pending.' });
    }

    const storeOrders = await getStoreOrdersByOrderId(orderId);
    const nonPendingStore = storeOrders.find(order => order.STATUS !== 'pending');

    if (nonPendingStore) {
      return res.status(400).json({
        message: `Cannot delete. Store order from store ID ${nonPendingStore.STORE_ID} is already ${nonPendingStore.STATUS}.`
      });
    }

    await deleteStoreOrders(orderId);
    await deleteMainOrder(orderId);

    return res.status(200).json({ message: 'Order and all related store orders successfully deleted.' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return res.status(500).json({ message: 'Server Error', error });
  }
};

// // Get Orders by User (Customer)
// async function getOrdersByUser(req, res) {
//   const { userId } = req.params;
  
//   try {
//     const connection = await oracledb.getConnection(dbConfig);
    
//     // Execute the procedure to fetch orders by user
//     const result = await connection.execute(
//       `BEGIN
//          get_order_by_user(:user_id);
//        END;`,
//       {
//         user_id: userId,
//       }
//     );

//     res.status(200).json({ message: 'Orders fetched successfully', result });
    
//     // Close the connection
//     await connection.close();
//   } catch (error) {
//     console.error('Error fetching orders:', error.message);
//     res.status(500).json({ message: 'Server Error', error });
//   }
// }

// // Update Order Status (Admin)
// async function updateOrderStatus(req, res) {
//   const { orderId, status } = req.body;
  
//   try {
//     const connection = await oracledb.getConnection(dbConfig);
    
//     // Execute the procedure to update the order status
//     await connection.execute(
//       `BEGIN
//          update_order_status(:order_id, :status);
//        END;`,
//       {
//         order_id: orderId,
//         status: status,
//       }
//     );

//     res.status(200).json({ message: 'Order status updated successfully' });

//     // Close the connection
//     await connection.close();
//   } catch (error) {
//     console.error('Error updating order status:', error.message);
//     res.status(500).json({ message: 'Server Error', error });
//   }
// }

async function updateMainOrderStatus(orderId) {
  // Check if all store orders for the given orderId are marked as 'delivered'
  const connection = await oracledb.getConnection(dbConfig);

  const result = await connection.execute(
    `SELECT COUNT(*) AS total_orders,
            COUNT(CASE WHEN status = 'delivered' THEN 1 END) AS delivered_orders
       FROM store_orders
      WHERE order_id = :order_id`,
    { order_id: orderId }
  );

  const row = result.rows[0];
  const totalOrders = row.TOTAL_ORDERS;
  const deliveredOrders = row.DELIVERED_ORDERS;

  if (totalOrders === deliveredOrders) {
    // If all store orders are delivered, update the main order status to 'delivered'
    await connection.execute(
      `UPDATE orders
         SET status = 'delivered'
       WHERE id = :order_id`,
      { order_id: orderId },
      { autoCommit: true }
    );
  }

  // Close the connection
  await connection.close();
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
  // getOrdersByUser,
  updateMainOrderStatus,
  updateStoreOrderStatus,
  getOrdersByStore,
};
