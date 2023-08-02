const Redis = require("ioredis");


// Create a Redis instance.
const redis = new Redis({
  port: 6379, // Redis port
  host: "redis_container", // Redis host
  db: 0, // Database 0
});

module.exports = {
  redis
};
