const jwt = require('jsonwebtoken');
const redis = require('../models/redis').redis;

function verifyAccesstoken(req, res, next) {
	let token = req.headers.authorization;
	if (!token) {
		res.status(401).json({ error: 'No token' });
		return;
	}
	token = token.substring(7, token.length);
	try {
		var decoded = jwt.verify(token, process.env.SECRETKEY);
		req.decoded = decoded;
	}
	catch (err) {
		res.status(403).json({ error: 'Wrong token' });
		console.log(err);
		return;
	}
	next();
}

async function redisSearch(key){
	const cachedResult = await client.get(input.toString());

  if (cachedResult !== null) {
    console.log('从缓存中获取结果...');
    return JSON.parse(cachedResult);
  } else {
    const result = await expensiveCalculation(input);
    console.log('将结果存入缓存...');
    await client.set(input.toString(), JSON.stringify(result));
    return result;
  }
} 


module.exports = {
	verifyAccesstoken,
	redisSearch
};