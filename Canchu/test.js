import { createClient } from 'redis';

const redisOptions = {
  host: 'localhost', // Redis服务器的主机地址
  port: 6379, // Redis服务器的端口号
};

const client = createClient(redisOptions);

client.on('error', err => console.log('Redis Client Error', err));

await client.connect();

await client.set('foo', 'bar');
const value = await client.get('foo');
console.log(value);