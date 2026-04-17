const { Queue } = require('bullmq');
const redisConfig = require("../config/redisConfig")
const plagiarismQueue = new Queue('plagiarism-tasks', {
  connection: {
    ...redisConfig,
    url: redisConfig?.url
  }
});

module.exports = plagiarismQueue;