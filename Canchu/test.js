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
  await redis.get(key, (err, result) => {
		if (err) {
			console.error(err);
			return res.status(500).json({ error: "Server Error." });
		} 
    else {
			const cachedResult = JSON.parse(result)
      console.log(cachedResult);
      console.log('123')
			return(cachedResult);
		}
	});
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
    console.log(result); // Prints "value"
  });

  console.log('3')
  const abc = await redisSearch('mykey');
  console.log(abc);
}

main()