const express = require('express');
const { redisSearch, redisSet } = require('../models/function');
const router = express.Router();

// create the connection nod to database
const connectionPromise = require('../models/mysql').connectionPromise;
const verifyAccesstoken = require('../models/function').verifyAccesstoken;


router.post('/', verifyAccesstoken, async (req, res) => {
	const connection = await connectionPromise;
	const my_id = req.decoded.id;
	const context = req.body.context;

	const postQuery = 'INSERT INTO posts (poster_id, created_at, context, like_count, comment_count) VALUES (?, NOW(), ?, ?, ?)';
	const [post] = await connection.execute(postQuery, [my_id, context, 0, 0]);
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
	const my_id = req.decoded.id

	const updateQuery = 'UPDATE posts set context = ? where id = ? AND poster_id = ? ';
	const [update] = await connection.execute(updateQuery, [context, post_id, my_id]);
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

	try{
		const postQuery = 'INSERT INTO comments (post_id, user_id, created_at, content) VALUES (?, ?, NOW(), ?)';
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
	}
	catch(err){
		res.status(500).json({ error: "Server Error." });
		console.log(err);
	}
});


router.get('/search', verifyAccesstoken, async (req, res) => {

	const connection = await connectionPromise;
	let search_id = req.query.user_id;
	let cursor = req.query.cursor;
	const my_id = req.decoded.id;
	let order_key = null;
	let postKeyArr = [];
	let postArr = [];
	let likeKeyArr = [];
	let likeArr =[];
	
	let dismatch = false;

	let postIdCursor = 18446744073709551615n;
  if (cursor) {
    postIdCursor = Number.parseInt(atob(cursor));
  }

	//initialize MySQL query 
	let param = [];
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
	`;

	let condition;
	if(!search_id){
		condition = 
		`
		WHERE (users.id = ? OR users.id IN (
			SELECT CASE
				WHEN friendship.sender_id = ? THEN friendship.receiver_id
				ELSE friendship.sender_id
			END AS friend_id
			FROM friendship
			WHERE (friendship.sender_id = ? OR friendship.receiver_id = ?) AND friendship.is_friend = 1
		)) AND posts.id <= ? 
		`;
		param = [my_id, my_id, my_id, my_id, my_id, postIdCursor];
	}
	else{
		condition = `WHERE users.id = ? AND posts.id <= ? `;
		param = [my_id, search_id, postIdCursor];
		order_key = `user_${search_id}_${postIdCursor}`;
	}

	const suffix = 
	`
	GROUP BY posts.id
	ORDER BY posts.created_at DESC
	LIMIT 11
	`;
	postQuery += (condition + suffix);

	// Get post details
	let encodedNextCursor;
	
	let order = await redisSearch(order_key);
	if(order){
		for(let i = 0; i < order.length; i++){
			postKeyArr[i] = `post_${order[i]}`;
			postArr[i] = await redisSearch(postKeyArr[i]);
			if(!postArr[i]){
				dismatch = true;
				break;
			}
			likeKeyArr[i] = `like${my_id}_${order[i]}`
			likeArr[i] = await redisSearch(likeKeyArr[i]);
			if(!likeArr[i]){
				dismatch = true;
				break;
			}
		}
		if(dismatch === false){
			if(postArr.length === 11){
				const nextCursor = order[order.length-1];
				encodedNextCursor = btoa(nextCursor.toString());
			}
			else{
				encodedNextCursor = null;
			}
			const formattedPosts = postArr.map((post, i) => {
				post.is_like = likeArr[i]; 
				return post;
			});
			const display_post = formattedPosts.slice(0, 10);
			const response = {
				data: {
					posts: display_post,
					next_cursor: encodedNextCursor
				}
			};
			return res.json(response)
		}
	}
	
	let [posts] = await connection.execute(postQuery, param);
	
	if(posts.length === 11){
		const nextCursor = posts[posts.length - 1].id;
  	encodedNextCursor = btoa(nextCursor.toString());
	}
	else{
		encodedNextCursor = null;
	}

	order =[];
  const formattedPosts = posts.map((post) => {
		// 在 map 函式中同時將 id 存儲到 order 陣列中
		order.push(post.id);
	
		// 格式化 post 物件並返回
		return {
			id: post.id,
			user_id: post.user_id,
			created_at: post.created_at,
			context: post.context,
			is_liked: post.is_liked === 1,
			like_count: post.like_count,
			comment_count: post.comment_count,
			picture: post.picture,
			name: post.name
		};
	});

	if(order_key){
		await redisSet(order_key,order);
		const formattedPostsWithoutIsLiked = formattedPosts.map(({ is_liked, ...rest }) => rest);
		for(let i = 0; i < order.length; i++){
			postKeyArr[i] = `post_${order[i]}`;
			await redisSet(postKeyArr[i],formattedPostsWithoutIsLiked[i]);
			likeKeyArr[i] = `like${my_id}_${order[i]}`
			await redisSet(likeKeyArr[i], formattedPosts[i].is_liked);
		}
	}
	const display_post = formattedPosts.slice(0, 10);
	const response = {
    data: {
      posts: display_post,
      next_cursor: encodedNextCursor
    }
  };
  return res.json(response);
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
		DATE_FORMAT(CONVERT_TZ(comments.created_at, '+00:00', '+08:00'), '%Y-%m-%d %H:%i:%s') AS created_at,
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
				user_id: post.user_id,
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
	return res.json(response);
});





module.exports = router;