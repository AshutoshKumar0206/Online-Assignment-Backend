// config/redisConfig.js
console.log("DEBUG: Redis Url", process.env.REDIS_URL ? "DEFINED" : "NOT DEFINED");
module.exports = {
  connection: process.env.REDIS_URL,
  maxRetriesPerRequest: null,
};