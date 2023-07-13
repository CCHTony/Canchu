const express = require('express');
const router = express.Router();

// create the connection nod to database
const connectionPromise = require('../models/mysql').connectionPromise;
const verifyAccesstoken = require('../models/function').verifyAccesstoken;

router.post('/', verifyAccesstoken, async(req, res) => {
    const connection = await connectionPromise;
    const my_id = req.decoded.id;
    const context = req.body.context;

    let mysQuery = 'INSERT INTO posts`(`poster_id`, `created_at`, `context`, `like_count`, `comment_count`) VALUES(?,NOW(),?,?,?)';
    const [post] = await connection.execute(mysQuery, [my_id, context, 0, 0]);
    const results = {
        "data": {
            "post": {
                "id": post[0].id
            }
        }
    }
    res.json(results);
});