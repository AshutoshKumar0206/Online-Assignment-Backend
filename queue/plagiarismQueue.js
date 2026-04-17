const { Queue } = require('bullmq');
const connection = require("../config/redisConfig")
const plagiarismQueue = new Queue('plagiarism-tasks', {
  connection
});

module.exports = plagiarismQueue;