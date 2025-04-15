// utils/redisClient.js
const { createClient } = require('redis');

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => console.error('❌ Redis Client Error:', err));
client.on('connect', () => console.log('✅ Redis connected'));

// Connect to Redis
client.connect().catch(console.error);

// Improved cache clearing function
async function clearProductCache() {
  try {
    // Use SCAN instead of KEYS for better performance in production
    const scanIterator = client.scanIterator({
      MATCH: 'products*',
      COUNT: 100
    });
    
    let keys = [];
    for await (const key of scanIterator) {
      keys.push(key);
    }
    
    if (keys.length > 0) {
      await client.del(keys);
      console.log(`🗑️ Cleared ${keys.length} product cache entries`);
    }
  } catch (err) {
    console.error("Error clearing product cache:", err);
    throw err; // Re-throw to handle in routes
  }
}

// Promisified methods
const getAsync = async (key) => await client.get(key);
const setAsync = async (key, value, options) => {
  return options?.EX 
    ? await client.set(key, value, { EX: options.EX })
    : await client.set(key, value);
};

module.exports = {
  get: getAsync,
  set: setAsync,
  clearProductCache,
  client
};