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

function redisSearch(key){
  redis.get(key, (err, result) => {
		if (err) {
			console.error(err);
			return res.status(500).json({ error: "Server Error." });
		} else {
			const cachedResult = JSON.parse(result)
			return(cachedResult);
		}
	});
} 


module.exports = {
	verifyAccesstoken,
	redisSearch
};