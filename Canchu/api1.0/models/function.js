const jwt = require('jsonwebtoken');
const client = require('../models/redis').client;

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

async function getCachedResult(input) {
	const cachedResult = await client.get(input);

	if (cachedResult !== null) {
		console.log('get data from cache...');
    console.log(cachedResult);
		return JSON.parse(cachedResult);
	} else {
		const result = await expensiveCalculation(input);
		console.log('save to cache...');
		await client.set(input, JSON.stringify(result));
		return result;
	}
}



module.exports = {
	verifyAccesstoken
};