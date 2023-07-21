const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const multer = require('multer');


// create the connection nod to database
const connectionPromise = require('../models/mysql').connectionPromise;
const redisSearch = require('../models/function').redisSearch;
const redisDelete = require('../models/function').redisDelete;
const redisSet = require('../models/function').redisSet;
const verifyAccesstoken = require('../models/function').verifyAccesstoken;

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'public')
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now()
		cb(null, file.fieldname + '-' + uniqueSuffix + '.jpg')
	}
})
const upload = multer({ storage: storage })


router.post('/signup', async (req, res) => {
	const connection = await connectionPromise;
	try {
		const { name, email, password } = req.body;
		if (!name || !password || !email) {
			return res.status(400).json({ error: 'All fields (name, email, password) must be entered.' });
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({ error: 'Invalid email address.' });
		}

		let userQuery = 'SELECT email FROM users WHERE email = ?';
		const [rows] = await connection.execute(userQuery, [email]);
		if (rows.length != 0) {
			return res.status(403).json({ error: 'It should not be possible to register with a duplicate email.' });
		}

		// 使用 crypto 加密
		const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

		let signupQuery = 'INSERT INTO users(name, email, password, picture, provider) VALUES(?,?,?,?,?)';
		const [results] = await connection.execute(signupQuery, [name, email, hashedPassword, null, 'native']);
		let id = results.insertId;

		const payload = {
			"id": id,
			"name": name,
			"email": email,
			"provider": 'native',
			"picture": null
		};

		const response = {
			'data': {
				'access_token': jwt.sign(payload, process.env.SECRETKEY, { expiresIn: '1 day' }),
				"user": {
					"id": id,
					"name": name,
					"email": email,
					"provider": 'native',
					"picture": null
				}
			}
		};
		res.json(response);
	}
	catch (err) {
		res.status(500).json({ error: "Server Error." });
		console.log(err);
	}
});


router.post('/signin', async (req, res) => {
	const connection = await connectionPromise;
	try {
		const provider = req.body.provider;
		if (!provider) {
			return res.status(400).json({ error: 'All fields must be entered.' });
		}

		if (provider === 'native') {
			const email = req.body.email;
			const password = req.body.password;

			if (!email || !password) {
				return res.status(400).json({ error: 'All fields must be entered.' });
			}

			const signinQuery = 'SELECT * FROM users WHERE email = ?';
			const [is_exist] = await connection.execute(signinQuery, [email]);
			if (is_exist.length === 0) {
				return res.status(403).json({ error: 'User Not Found' })
			}

			const user = is_exist[0];
			const PASSWORD = user.password;
			const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
			if (PASSWORD !== hashedPassword) {
				return res.status(403).json({ error: 'Wrong Password' });
			}
			const id = user.id;
			const name = user.name;
			const picture = user.picture;
			const payload = {
				"id": id,
				"name": name,
				"email": email,
				"provider": 'native',
				"picture": picture
			};
			const response = {
				'data': {
					'access_token': jwt.sign(payload, process.env.SECRETKEY, { expiresIn: '1 day' }),
					"user": {
						"id": id,
						"provider": 'native',
						"name": name,
						"email": email,
						"picture": picture
					}
				}
			};
			res.json(response);
		}
		else if (provider === 'facebook') {
			const access_token = req.body.access_token;
			const url = `https://graph.facebook.com/v17.0/me?fields=id,name,email,picture{url}&access_token=${access_token}`;
			const user = await (await fetch(url)).json();
			const { name, email } = user;
			const picture = user.picture.data.url;
			let userQuery = 'SELECT email FROM users WHERE email = ?';
			const [is_signup] = await connection.execute(userQuery, [email]);
			if (is_signup.length != 0) {
				return res.status(403).json({ error: 'This account is signup by native, please login by native' });
			}
			let facebookQuery = 'INSERT INTO users(name, email, password, picture, provider) VALUES(?,?,?,?,?)';
			const [signup] = await connection.execute(facebookQuery, [name, email, '', picture, 'facebook']);
			let id = signup.insertId;
			const response = {
				'data': {
					'access_token': access_token,
					"user": {
						"id": id,
						"provider": 'facebook',
						"name": name,
						"email": email,
						"picture": picture
					}
				}
			};
			res.json(response);
		}
		else {
			res.status(403).json({ error: 'Wrong provider' });
		}
	}
	catch (err) {
		res.status(500).json({ error: "Server Error." });
		console.log(err);
	}
});


router.get('/:id/profile', verifyAccesstoken, async (req, res) => {
	const connection = await connectionPromise;
	const user_id = Number(req.params.id);
	const my_id = req.decoded.id;
	const profile_key = `profile_${user_id}`;
	const friendship_key = `friendship_${my_id}_${user_id}`;
	let friendship = null;

	const Query = 
	`
	SELECT
		users.id,
		users.name,
		users.picture,
		users.intro,
		users.tags,
		(
			SELECT COUNT(*) 
			FROM friendship 
			WHERE (sender_id = users.id OR receiver_id = users.id) AND is_friend = 1
		) AS friend_count,
		friendship.id AS friendship_id,
		friendship.is_friend AS status,
		friendship.sender_id,
		friendship.receiver_id
	FROM users
	LEFT JOIN friendship 
	ON (sender_id = users.id OR receiver_id = users.id) AND (sender_id = ? OR receiver_id = ?)
	WHERE users.id = ?
	`;
	const profile_cachedResult = await redisSearch(profile_key);
	const friendship_cachedResult = await redisSearch(friendship_key);

	if(profile_cachedResult !== null && friendship_cachedResult !== null){
		const response = {
			data: {
				user: {
					id: profile_cachedResult.id,
					name: profile_cachedResult.name,
					picture: profile_cachedResult.picture,
					friend_count: profile_cachedResult.friend_count,
					introduction: profile_cachedResult.introduction,
					tags: profile_cachedResult.tags,
					friendship: friendship_cachedResult.friendship,
				}
			}
		};
		return res.json(response);
	}

	try{
		const result = (await connection.execute(Query, [my_id, my_id, user_id]))[0][0];
		if(my_id !== user_id){
			if(result.friendship_id){
				if (result.status === 1) {
					friendship = {
						id: result.friendship_id,
						status:'friend',
					};
				}
				else{
					if (result.sender_id === my_id) {
						friendship = {
							id: result.friendship_id,
							status: 'requested',
						};
					}
					else {
						friendship = {
							id: result.friendship_id,
							status: 'pending',
						};
					}
				}
			}
		}

		const response = {
			data: {
				user: {
					id: user_id,
					name: result.name,
					picture: result.picture,
					friend_count: result.friend_count,
					introduction: result.intro,
					tags: result.tags,
					friendship: friendship,
				}
			}
		};
		const profile_info = {
			id: user_id,
			name: result.name,
			picture: result.picture,
			friend_count: result.friend_count,
			introduction: result.intro,
			tags: result.tags,
		}
		const friendship_info = {
			friendship: friendship,
		}
		await redisSet(profile_key, profile_info);
		await redisSet(friendship_key, friendship_info);
		return res.json(response);
	}
	catch(err){
		res.status(500).json({ error: "Server Error." });
		console.log(err);
	}
});


router.put('/profile', verifyAccesstoken, async (req, res) => {
	const connection = await connectionPromise;
	const id = req.decoded.id;
	const profile_key = `profile_${id}`;
	const { name, introduction, tags } = req.body;

	try{
		const updateQuery = 'UPDATE users SET name = ?, intro = ?, tags = ? where id = ?';
		const [rows] = await connection.execute(updateQuery, [name, introduction, tags, id]);
		const response = {
			"data": {
				"user": {
					"id": id
				}
			}
		};
		await redisDelete(profile_key);
		return res.json(response);
	}
	catch(err){
		console.log(err);
		return res.status(500).json({ error: "Server Error." });
	}
});


router.put('/picture', verifyAccesstoken, upload.single('picture'), async (req, res) => {
	const connection = await connectionPromise;
	const id = req.decoded.id;
	const picture = req.file;
	const profile_key = `profile_${id}`;
	try{
		const url = `https://52.64.240.159/${picture.filename}`;
		const updateQuery = 'UPDATE users SET picture = ? WHERE id = ?';
		const [rows] = await connection.execute(updateQuery, [url, id]);
		response = {
			data: {
				picture: url
			}
		}
		await redisDelete(profile_key);
		return res.json(response);
	}
	catch(err){
		res.status(500).json({ error: "Server Error." });
		console.log(err);
	}
});


router.get('/search', verifyAccesstoken, async (req, res) => {
	const connection = await connectionPromise;
	const my_id = req.decoded.id;
	const keyword = `%${req.query.keyword}%`;

	console.log(keyword);
	let searchQuery = 
	`
		SELECT 
			users.id AS user_id, 
			users.name, 
			users.picture, 
			friendship.id AS friendship_id, 
			friendship.is_friend, 
			friendship.sender_id, 
			friendship.receiver_id 
		FROM users LEFT JOIN friendship 
		ON (users.id = friendship.sender_id AND friendship.receiver_id = ?) OR (users.id = friendship.receiver_id AND friendship.sender_id = ?) 
		WHERE name LIKE ? AND users.id <> ?
	`;

	try{
		const [search_result] = await connection.execute(searchQuery, [my_id, my_id, keyword, my_id]);

		const userArr = search_result.map((user) => {
			let friendship = null;
			if (user.is_friend === 1) {
				friendship = {
					id: user.friendship_id,
					status: 'friend'
				}
			}
			else if (user.sender_id === my_id) {
				friendship = {
					"id": user.friendship_id,
					"status": "requested"
				};
			}
			else if(user.receiver_id === my_id){
				friendship = {
					"id": user.friendship_id,
					"status": "pending"
				};
			}
			return {
				id: user.user_id,
				name: user.name,
				picture: user.picture,
				friendship: friendship
			};
		});
		
		const response = {
			"data": {
				"users": userArr
			}
		}
		return res.json(response);
	}
	catch(err){
		res.status(500).json({ error: "Server Error." });
		console.log(err);
	}
});



module.exports = router;
