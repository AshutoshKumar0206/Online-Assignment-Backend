// config/redisConfig.js
console.log("DEBUG: Redis Url", process.env.REDIS_URL ? "DEFINED" : "NOT DEFINED");
module.exports = {
  url: process.env.REDIS_URL,
  maxRetriesPerRequest: null,
  tls: {
    rejectUnauthorized: false // Required for most hosted Redis providers like Upstash
  }
};