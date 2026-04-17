const { Queue } = require('bullmq');
const redisConfig = require("../config/redisConfig")
const plagiarismQueue = new Queue('plagiarism-tasks', {
  connection: {
    host: redisConfig.hostname,
    port: redisConfig.port,
    password: redisConfig.password, // URL object handles decoding automatically
    username: redisConfig.username, 
    maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
    tls: redisConfig.tls
  }
});

module.exports = plagiarismQueue;