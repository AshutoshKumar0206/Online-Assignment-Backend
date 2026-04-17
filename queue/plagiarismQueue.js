const { Queue } = require('bullmq');
const redisConfig = require("../config/redisConfig")
const plagiarismQueue = new Queue('plagiarism-tasks', {
  connection: redisConfig?.connection,
  maxRetriesPerRequest: redisConfig?.maxRetriesPerRequest
});

module.exports = plagiarismQueue;