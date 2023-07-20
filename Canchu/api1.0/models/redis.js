import { createClient } from 'redis';

const redisOptions = {
  host: 'localhost', // Redis服務器的主機地址
  port: 6379, // Redis監聽的port
};

const client = createClient(redisOptions);

client.on('error', err => console.log('Redis Client Error', err));
await client.connect();

module.exports = {
  client
};