// config/redisConfig.js
const URL = require('url');
console.log("DEBUG: Redis Url", process.env.REDIS_URL ? "DEFINED" : "NOT DEFINED");
const redisUrl = new URL(process.env.REDIS_URL);
module.exports = {
  host: redisUri.hostname,
  port: redisUri.port,
  password: redisUri.password, // URL object handles decoding automatically
  username: redisUri.username || 'default', 
  maxRetriesPerRequest: null,
  tls: {
    rejectUnauthorized: false 
  }
};