const { Queue } = require('bullmq');
const redisConfig = require("../config/redisConfig")
const plagiarismQueue = new Queue('plagiarism-tasks', {
  connection: redisConfig?.connection
});

module.exports = plagiarismQueue;