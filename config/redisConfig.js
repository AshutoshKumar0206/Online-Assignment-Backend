// config/redisConfig.js
module.exports = {
  connection: process.env.REDIS_URL,
  maxRetriesPerRequest: null,
};