const { ECDH } = require("crypto");
const oracledb = require("oracledb");

oracledb.initOracleClient();
const dbConfig = {
  user: "C##ecommerce",
  password:"ecommerce123",
  connectString: 'localhost:1521/XE',
};

let connection;

async function getConnection() {
  if (!connection) {
    connection = await oracledb.getConnection(dbConfig);
  }
  return connection;
}

async function runQuery(sql, binds = {}) {
  const conn = await oracledb.getConnection(dbConfig);
  const result = await conn.execute(sql, binds, {
    outFormat: oracledb.OUT_FORMAT_OBJECT,
  });
  await conn.close();
  return result.rows;
}

async function runProcedure(sql, binds = {}) {
  const conn = await oracledb.getConnection(dbConfig);
  await conn.execute(sql, binds, { autoCommit: true });
  await conn.close();
}

module.exports = { runQuery, runProcedure ,getConnection};
