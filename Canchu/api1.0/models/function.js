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

async function redisdelete(key){
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





module.exports = {
	verifyAccesstoken,
	redisSearch
};