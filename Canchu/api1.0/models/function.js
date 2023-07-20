const jwt = require('jsonwebtoken');


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


module.exports = {
	verifyAccesstoken
};