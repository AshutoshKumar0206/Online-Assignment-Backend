// config/redisConfig.js
module.exports = {
  connectionString: process.env.REDIS_URL,
  maxRetriesPerRequest: null,
};