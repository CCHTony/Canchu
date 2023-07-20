const Redis = require("ioredis");

// Create a Redis instance.
// By default, it will connect to localhost:6379.
// We are going to cover how to specify connection options soon.
const redis = new Redis({
  port: 6379, // Redis port
  host: "localhost", // Redis host
  db: 0, // Database 0
});

module.exports = {
  redis
};
