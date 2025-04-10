const oracledb = require("oracledb");
const { getConnection } = require("../config/oracle");

async function getOrderById(orderId) {
  const connection = await getConnection();
  const result = await connection.execute(
    `SELECT * FROM orders WHERE id = :id`,
    [orderId],
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  return result.rows[0];
}

async function getStoreOrdersByOrderId(orderId) {
  const connection = await getConnection();
  const result = await connection.execute(
    `SELECT * FROM store_orders WHERE order_id = :id`,
    [orderId],
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  return result.rows;
}

async function cancelStatusStoreOrders(orderId) {
  const connection = await getConnection();
  await connection.execute(
    `Update store_orders SET status = 'cancelled' WHERE order_id = :id`,
    [orderId],
    { autoCommit: false }
  );
}

async function cancelStatusMainOrder(orderId) {
  const connection = await getConnection();
  await connection.execute(
    `Update orders SET status = 'cancelled' WHERE id = :id`,
    [orderId],
    { autoCommit: true }
  );
}

module.exports = {
  getOrderById,
  getStoreOrdersByOrderId,
  cancelStatusStoreOrders,
  cancelStatusMainOrder,
};
