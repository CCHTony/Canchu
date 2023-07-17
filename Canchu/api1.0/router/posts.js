const express = require('express');
const router = express.Router();

// create the connection nod to database
const connectionPromise = require('../models/mysql').connectionPromise;
const verifyAccesstoken = require('../models/function').verifyAccesstoken;


router.post('/', verifyAccesstoken, async (req, res) => {
	const connection = await connectionPromise;
	const my_id = req.decoded.id;
	const context = req.body.context;

	let mysQuery = 'INSERT INTO posts (poster_id, created_at, context, like_count, comment_count) VALUES (?, NOW(), ?, ?, ?)';
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

	let mysQuery = 'UPDATE posts set context = ? where id = ? AND poster_id = ? ';
	const [update] = await connection.execute(mysQuery, [context, post_id]);
	console.log(update);
	if (update.affectedRows === 0) {
		// Not poster or post does not exist
		return res.status(403).json({error : 'you are not poster or post does not exist'});
	}
	const response = {
		"data": {
			"post": {
				"id": post_id
			}
		}
	}
	res.json(response);
});


router.post('/:id/like', verifyAccesstoken, async (req, res) => {
	const connection = await connectionPromise;
	const post_id = req.params.id;
	const my_id = req.decoded.id;

	let likeQuery = 'INSERT IGNORE INTO likes (post_id, user_id, created_at) VALUES (?, ?, NOW())';
	const [like] = await connection.execute(likeQuery, [post_id, my_id]);
	console.log(like);
	if(like.affectedRows === 0){
		return res.status(400).json({ error: 'You have already liked it.' });
	}
	const response = {
		"data": {
			"post": {
				"id": post_id
			}
		}
	}
	res.json(response);
});


router.delete('/:id/like', verifyAccesstoken, async (req, res) => {
	const connection = await connectionPromise;
	const post_id = req.params.id;
	const my_id = req.decoded.id;

	let likeQuery = 'DELETE FROM likes WHERE post_id = ? AND user_id = ?';
	const [like] = await connection.execute(likeQuery, [post_id, my_id]);
	console.log(like);
	if(like.affectedRows === 0){
		return res.status(400).json({ error: "You haven't liked it yet!" });
	}
	const response = {
		"data": {
			"post": {
				"id": post_id
			}
		}
	}
	res.json(response);
});


router.post('/:id/comment', verifyAccesstoken, async (req, res) => {
	const connection = await connectionPromise;
	const post_id = Number.parseInt(req.params.id);
	const my_id = req.decoded.id;
	const content = req.body.content;

	let postQuery = 'INSERT INTO comments (post_id, user_id, created_at, content) VALUES (?, ?, NOW(), ?)';
	const [comment] = await connection.execute(postQuery, [post_id, my_id, content]);
	console.log(comment);
	const response = {
		"data": {
			"post": {
				"id": post_id
			},
			"comment": {
				"id": comment.insertId
			}
		}
	}
	res.json(response);
});


router.get('/search', verifyAccesstoken, async (req, res) => {
	console.log(req.baseUrl);
	const connection = await connectionPromise;
	let search_id = req.query.user_id;
	let cursor = req.query.cursor;
	const my_id = req.decoded.id;

	if(!search_id){
		search_id = my_id;
	}

	let postIdCursor = 0;
  if (cursor) {
    postIdCursor = Number.parseInt(atob(cursor));
  }

	// Get post details
	let postQuery =
	`
	SELECT
		posts.id AS id,
		DATE_FORMAT(CONVERT_TZ(posts.created_at, '+00:00', '+08:00'), '%Y-%m-%d %H:%i:%s') AS created_at,
		posts.context,
		users.id AS user_id,
		users.name,
		users.picture,
		COUNT(DISTINCT likes.id) AS like_count,
		COUNT(DISTINCT comments.id) AS comment_count,
		(SELECT COUNT(*) FROM likes WHERE post_id = posts.id AND user_id = ?) AS is_liked
	FROM posts
	LEFT JOIN likes ON likes.post_id = posts.id
	LEFT JOIN comments ON comments.post_id = posts.id
	INNER JOIN users ON posts.poster_id = users.id
	WHERE users.id = ? AND posts.id > ?
	GROUP BY posts.id
	LIMIT 11
	`;

	let posts = (await connection.execute(postQuery, [my_id, search_id, postIdCursor]));
	console.log(posts);
	if (posts.length === 0) {
		return res.status(404).json({ error: 'Post not found' });
	}
	let encodedNextCursor;
	if(posts.length === 11){
		const nextCursor = posts[posts.length - 1].id;
  	encodedNextCursor = btoa(nextCursor.toString());
		posts = posts.slice(0, 9);
	}
	else{
		encodedNextCursor = null;
	}

  const formattedPosts = posts.map((post) => ({
    id: post.id,
    user_id: post.user_id,
    created_at: post.created_at,
    context: post.context,
    is_liked: post.is_liked === 1,
    like_count: post.like_count,
    comment_count: post.comment_count,
    picture: post.picture,
    name: post.name
  }));


	 const response = {
    data: {
      posts: formattedPosts,
      next_cursor: encodedNextCursor
    }
  };

  res.json(response);
});


router.get('/:id', verifyAccesstoken, async (req, res) => {
	const connection = await connectionPromise;
	const post_id = req.params.id;
	const my_id = req.decoded.id;

	// Get post details
	let postQuery =
	`
	SELECT
		posts.id AS postId,
		DATE_FORMAT(CONVERT_TZ(posts.created_at, '+00:00', '+08:00'), '%Y-%m-%d %H:%i:%s') AS created_at,
		posts.context,
		users.id AS user_id,
		users.name,
		users.picture,
		COUNT(DISTINCT likes.id) AS like_count,
		COUNT(DISTINCT comments.id) AS comment_count,
		(SELECT COUNT(*) FROM likes WHERE post_id = ? AND user_id = ?) AS is_liked
	FROM posts
	LEFT JOIN likes ON likes.post_id = posts.id
	LEFT JOIN comments ON comments.post_id = posts.id
	INNER JOIN users ON posts.poster_id = users.id
	WHERE posts.id = ?
	GROUP BY posts.id
	`;
	const post = (await connection.execute(postQuery, [post_id, my_id, post_id]))[0][0];
	console.log(post);
	if (!post) {
		return res.status(404).json({ error: 'Post not found' });
	}

  // Check if the post is liked by the user
	const isLiked = post.is_liked === 1;

	// Get comments for the post
	let commentsQuery =
	`
	SELECT 
		comments.id,
		DATE_FORMAT(CONVERT_TZ(comments.created_at, '+00:00', '+08:00'), '%Y-%m-%d %H:%i:%s'),
		comments.content,
		users.id AS user_id,
		users.name,
		users.picture
	FROM comments
	INNER JOIN users ON comments.user_id = users.id
	WHERE comments.post_id = ?
	`;
	const [commentResults] = await connection.execute(commentsQuery, [post_id]);
	const comments = commentResults.map((comment) => ({
		id: comment.id,
		created_at: comment.created_at,
		content: comment.content,
		user: {
			id: comment.user_id,
			name: comment.name,
			picture: comment.picture,
		},
	}));


	// Build the response object
	const response = {
		data: {
			post: {
				id: post.postId,
				created_at: post.created_at,
				context: post.context,
				is_liked: isLiked,
				like_count: post.like_count,
				comment_count: post.comment_count,
				picture: post.picture,
				name: post.name,
				comments: comments,
			},
		},
	};
	res.json(response);
});





module.exports = router;