// config/redisConfig.js
const { URL } = require('url');
console.log("DEBUG: Redis Url", process.env.REDIS_URL ? "DEFINED" : "NOT DEFINED");
const redisUrl = new URL(process.env.REDIS_URL);
module.exports = {
  host: redisUrl.hostname,
  port: redisUrl.port,
  password: process.env.REDIS_PASS || redisUrl.password, // URL object handles decoding automatically
  username: redisUrl.username || 'default', 
  maxRetriesPerRequest: null,
  tls: {
    rejectUnauthorized: false 
  }
};