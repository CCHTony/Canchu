// Import ioredis.
// You can also use `import { Redis } from "ioredis"`
// if your project is a TypeScript project,
// Note that `import Redis from "ioredis"` is still supported,
// but will be deprecated in the next major version.
const Redis = require("ioredis");

// Create a Redis instance.
// By default, it will connect to localhost:6379.
// We are going to cover how to specify connection options soon.
const redis = new Redis({
  port: 6379, // Redis port
  host: "localhost", // Redis host
  db: 0, // Database 0
});

const ob = {
  a:123,
  b:'123'
}

async function redisSearch(key){
  try {
    const result = await redis.get(key);
    const cachedResult = JSON.parse(result);
    return cachedResult;
  } 
  catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error." });
  }
}

async function redisDelete(key) {
  try {
    const result = await redis.del(key); 
    console.log(result);
    return result; 
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error." }); // 如果发生异常，返回服务器错误信息
  }
}

async function redisSet(key, value) {
  try {
    const result = await redis.set(key, JSON.stringify(value)); 
    return result; 
  } 
	catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error." }); 
  }
}


async function main(){
  redis.set("mykey", JSON.stringify(ob, null, 2)); 

  // ioredis supports the node.js callback style
  await redis.get("key", (err, result) => {
    if (err) {
      console.error(err);
    } else {
      console.log('1')
      console.log(result); // Prints "value"
    }
  });

  // Or ioredis returns a promise if the last argument isn't a function
  await redis.get("mykey").then((result) => {
    console.log('2')
    console.log(result);
    console.log(typeof(result)) // Prints "value"
  });

  console.log('3')
  await redisDelete('mykey');
 
  const efg = await redisSet('mykey', ob);
  console.log(efg);
  const abc = await redisSearch('mykey');
  console.log(abc);
  
}

main()