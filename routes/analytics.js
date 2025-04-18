const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const Product = require('../models/Product'); // your mongoose model

const dbConfig = {
    user: "C##ecommerce",
    password:"ecommerce123",
    connectString: 'localhost:1521/XE',
};

// 1. Total Revenue
router.get('/total-revenue/:storeId', async (req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    const result = await conn.execute(
      `BEGIN get_total_revenue(:store_id, :total); END;`,
      {
        store_id: req.params.storeId,
        total: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );
    console.log(result.outBinds.total);
    res.json({ totalRevenue: result.outBinds.total });
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (err) {
        console.error('Error closing connection', err);
      }
    }
  }
});

// 2. Total Orders
router.get('/total-orders/:storeId', async (req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    const result = await conn.execute(
      `BEGIN get_total_orders(:store_id, :count); END;`,
      {
        store_id: req.params.storeId,
        count: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );
    console.log(result.outBinds.count);
    res.json({ totalOrders: result.outBinds.count });
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (err) {
        console.error('Error closing connection', err);
      }
    }
  }
});

// 3. Sales Over Time
router.get('/sales-over-time/:storeId', async (req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection(dbConfig);
    const result = await conn.execute(
      `BEGIN get_sales_over_time(:store_id, :cursor); END;`,
      {
        store_id: req.params.storeId,
        cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
      }
    );
    const rows = await result.outBinds.cursor.getRows();
    await result.outBinds.cursor.close();
    console.log(rows);
    res.json(rows);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (err) {
        console.error('Error closing connection', err);
      }
    }
  }
});

// 4. Ratings Over Time (MongoDB)
router.get('/ratings-over-time/:storeId', async (req, res) => {
  try {
    const storeId = req.params.storeId;
    const products = await Product.find({ store: storeId }).lean();

    const ratings = {};

    products.forEach(p => {
      const month = new Date(p.updatedAt).toLocaleString('default', { month: 'short' });
      if (!ratings[month]) ratings[month] = { total: 0, count: 0 };
      ratings[month].total += p.rating;
      ratings[month].count += 1;
    });

    const data = Object.entries(ratings).map(([month, value]) => ({
      month,
      averageRating: (value.total / value.count).toFixed(2),
    }));
    console.log(data);
    res.json(data);
  } catch (err) {
    console.error('Error fetching ratings', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
