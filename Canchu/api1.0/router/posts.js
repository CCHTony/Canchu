const express = require('express');
const router = express.Router();

// create the connection nod to database
const connectionPromise = require('../models/mysql').connectionPromise;
const verifyAccesstoken = require('../models/function').verifyAccesstoken;


router.post('/', verifyAccesstoken, async(req, res) => {
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


router.put('/:id', verifyAccesstoken, async(req, res) => {
    const connection = await connectionPromise;
    const post_id = req.params.id;
    const my_id = req.decoded.id;
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


module.exports = router;