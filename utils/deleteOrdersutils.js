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

async function deleteStoreOrders(orderId) {
  const connection = await getConnection();
  await connection.execute(
    `DELETE FROM store_orders WHERE order_id = :id`,
    [orderId],
    { autoCommit: false }
  );
}

async function deleteMainOrder(orderId) {
  const connection = await getConnection();
  await connection.execute(
    `DELETE FROM orders WHERE id = :id`,
    [orderId],
    { autoCommit: true }
  );
}

module.exports = {
  getOrderById,
  getStoreOrdersByOrderId,
  deleteStoreOrders,
  deleteMainOrder
};
