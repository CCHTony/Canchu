const express = require('express');
const router = express.Router();

// create the connection nod to database
const connectionPromise = require('../models/mysql').connectionPromise;
const verifyAccesstoken = require('../models/function').verifyAccesstoken;


router.post('/', verifyAccesstoken, async (req, res) => {
	const connection = await connectionPromise;
	const my_id = req.decoded.id;
	const context = req.body.context;

	let mysQuery = 'INSERT INTO posts (`poster_id`, `created_at`, `context`, `like_count`, `comment_count`) VALUES (?, NOW(), ?, ?, ?)';
	const [post] = await connection.execute(mysQuery, [my_id, context, 0, 0]);
	console.log(post);
	const results = {
		"data": {
			"post": {
				"id": post.insertId
			}
		}
	}
	res.json(results);
});


router.put('/:id', verifyAccesstoken, async (req, res) => {
	const connection = await connectionPromise;
	const post_id = req.params.id;
	const context = req.body.context;

	let mysQuery = 'UPDATE `posts` set `context` = ? where `id` = ?';
	const [update] = await connection.execute(mysQuery, [context, post_id]);
	console.log(update);
	const results = {
		"data": {
			"post": {
				"id": post_id
			}
		}
	}
	res.json(results);
});


router.post('/:id/like', verifyAccesstoken, async (req, res) => {
	const connection = await connectionPromise;
	const post_id = req.params.id;
	const my_id = req.decoded.id;

	let mysQuery = 'INSERT INTO `likes` (`post_id`, `user_id`, `created_at`) VALUES (?, ?, NOW())';
	const [like] = await connection.execute(mysQuery, [post_id, my_id]);
	console.log(like);
	const results = {
		"data": {
			"post": {
				"id": post_id
			}
		}
	}
	res.json(results);
});


router.delete('/:id/like', verifyAccesstoken, async (req, res) => {
	const connection = await connectionPromise;
	const post_id = req.params.id;
	const my_id = req.decoded.id;

	let mysQuery = 'DELETE FROM `likes` WHERE `post_id` = ? AND `user_id` = ?';
	const [like] = await connection.execute(mysQuery, [post_id, my_id]);
	console.log(like);
	const results = {
		"data": {
			"post": {
				"id": post_id
			}
		}
	}
	res.json(results);
});


router.post('/:id/comment', verifyAccesstoken, async (req, res) => {
	const connection = await connectionPromise;
	const post_id = Number.parseInt(req.params.id);
	const my_id = req.decoded.id;
	const content = req.body.content;

	let mysQuery = 'INSERT INTO `comments` (`post_id`, `user_id`, `created_at`, `content`) VALUES (?, ?, NOW(), ?)';
	const [comment] = await connection.execute(mysQuery, [post_id, my_id, content]);
	console.log(comment);
	const results = {
		"data": {
			"post": {
				"id": post_id
			},
			"comment": {
				"id": comment.insertId
			}
		}
	}
	res.json(results);
});


router.get('/:id', verifyAccesstoken, async (req, res) => {
	const connection = await connectionPromise;
	const post_id = req.params.id;
	const my_id = req.decoded.id;

	let mysQuery =
		`
			SELECT 
				posts.id AS post_id,
				DATE_FORMAT(CONVERT_TZ(posts.created_at, '+00:00', '+08:00'), '%Y-%m-%d %H:%i:%s') AS created_at,
				posts.context,
				users.id AS user_id,
				users.name,
				users.picture,
				COUNT(DISTINCT likes.id) AS like_count, COUNT(DISTINCT comments.id) AS comment_count 
			FROM posts 
			LEFT JOIN likes ON likes.post_id = posts.id 
			LEFT JOIN comments ON comments.post_id = posts.id 
			INNER JOIN users ON posts.poster_id = users.id 
			WHERE posts.id = ? 
			GROUP BY posts.id
		`;
	const post = (await connection.execute(mysQuery, [post_id]))[0][0];
	console.log(post);
	if (!post) {
		return res.status(404).json({ error: 'Post not found' });
	}


	const results = {
		"data": {
			"post": {
				"id": post.post_id,
				"created_at": post.created_at,
				"context": post.context,
				"is_liked": true,
				"like_count": post.like_count,
				"comment_count": post.comment_count,
				"picture": post.picture,
				"name": post.name,
				"comments": [{
					"id": 1,
					"created_at": "2023-04-10 23:21:10",
					"content": "評論評論評論評論評論評論",
					"user": {
						"id": "1",
						"name": "PJ",
						"picture": ""
					}
				}]
			}
		}
	}
	res.json(results);
});



module.exports = router;