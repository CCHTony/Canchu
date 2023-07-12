const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// create the connection nod to database
const connectionPromise = require('../models/mysql').connectionPromise;


router.post('/:user_id/request', async(req, res) => {
    const connection = await connectionPromise;
    const receiver_id = req.params.user_id;
    let token = req.headers.authorization;
    if(!token){
        res.status(401).json({error : 'No token'});
        return;
    }
    token = token.substring(7, token.length);
    try {
        var decoded = jwt.verify(token, process.env.SECRETKEY);
    } 
    catch(err) {
        res.status(403).json({error : 'Wrong token'});
        console.log(err);
        return;
    }
    let mysQuery = 'SELECT `id` FROM `users` WHERE `id` = ?';
    const [is_receiver_exist] = await connection.execute(mysQuery, [receiver_id]);
    if(!is_receiver_exist.length){
        res.status(400).json({error : 'This user is not exist.'});
        return;
    }
    const sender_id = decoded.id
    mysQuery = 'SELECT `is_friend` FROM `friendship` WHERE `sender_id` = ? AND `receiver_id` = ?';
    let [friendship] = await connection.execute(mysQuery, [sender_id, receiver_id]);
    if(friendship.length){
        if(friendship[0].is_friend){
            res.status(400).json({error : 'You are already friends.'});
            return;
        }
        res.status(400).json({error : 'The request already exists.'});
        return;
    }
    mysQuery = 'SELECT `is_friend` FROM `friendship` WHERE `sender_id` = ? AND `receiver_id` = ?';
    [friendship] = await connection.execute(mysQuery, [receiver_id, sender_id]);
    if(friendship.length){
        if(friendship[0].is_friend){
            res.status(400).json({error : 'You are already friends.'});
            return;
        }
        res.status(400).json({error : 'This user has already sent you a friend request!'});
        return;
    }
    mysQuery = 'INSERT INTO `friendship`(`sender_id`, `receiver_id`, `is_friend`) VALUES(?,?,?)';
    const [rows] = await connection.execute(mysQuery, [sender_id, receiver_id, false]);
    const type = 'friend request'
    mysQuery = 'INSERT INTO `events`(`sender_id`, `receiver_id`, `type`, `is_read`, `created_at`) VALUES(?,?,?,?,NOW())';
    const [event] = await connection.execute(mysQuery, [sender_id, receiver_id, type, false]);
    result = {
        "data": {
            "friendship": {
                "id": rows.insertId
            }
        }
    }
    res.json(result);
});


router.get('/pending', async(req, res) => {
    const connection = await connectionPromise;
    let token = req.headers.authorization;
    if(!token){
        res.status(401).json({error : 'No token'});
        return;
    }
    token = token.substring(7, token.length);
    try {
        var decoded = jwt.verify(token, process.env.SECRETKEY);
    } 
    catch(err) {
        res.status(403).json({error : 'Wrong token'});
        console.log(err);
        return;
    }
    const my_id = decoded.id;
    mysQuery = 'SELECT `users`.`id` AS `user_id`, `name`, `picture`, `friendship`.`id` AS `friendship_id` FROM `users` JOIN `friendship` ON `users`.`id` = `sender_id` WHERE `receiver_id` = ? AND `is_friend` = false';
    const [pending] = await connection.execute(mysQuery, [my_id]);
    console.log(pending);
    let user_result = [];
    for(let i = 0; i < pending.length; i++){
        let temp = {
            "id": pending[i].user_id,
            "name": pending[i].name,
            "picture": pending[i].picture,
            "friendship": {
                "id": pending[i].friendship_id,
                "status": "pending"
            }
        }
        user_result.push(temp);
    }
    const result = {
        "data": {
            "users":user_result 
        }
    };
    res.json(result);
});


router.post('/:friendship_id/agree', async(req, res) => {
    const connection = await connectionPromise;
    let token = req.headers.authorization;
    const friendship_id = req.params.friendship_id;
    if(!token){
        res.status(401).json({error : 'No token'});
        return;
    }
    token = token.substring(7, token.length);
    try {
        var decoded = jwt.verify(token, process.env.SECRETKEY);
    } 
    catch(err) {
        res.status(403).json({error : 'Wrong token'});
        console.log(err);
        return;
    }
    const my_id = decoded.id;
    let mysQuery = 'SELECT `is_friend`, `receiver_id` FROM `friendship` WHERE `id` = ?';
    const [request_exist] = await connection.execute(mysQuery, [friendship_id]);
    if(!request_exist.length){
        res.status(400).json({error : 'Request does not exist.'});
        return;
    }
    const is_friend = request_exist[0].is_friend;
    const receiver_id = request_exist[0].receiver_id;
    if(is_friend){
        res.status(400).json({error : 'You are already friends.'});
        return;
    }
    if(my_id !== receiver_id){
        res.status(400).json({error : 'Sender cannot agree the request'});
        return;
    }
    try{
        mysQuery = 'UPDATE `friendship` SET `is_friend` = TRUE WHERE `id` = ?' ;
        const [agreement] = await connection.execute(mysQuery, [friendship_id]);
    }catch(err){
        res.status(500).json({error : 'Server error'})
        console.log(err);
    }
    const result = {
        "data": {
            "friendship": {
                "id": friendship_id
            }
        }
    }
    res.json(result);
});


router.delete('/:friendship_id', async(req, res) => {
    const connection = await connectionPromise;
    let token = req.headers.authorization;
    const friendship_id = req.params.friendship_id;
    if(!token){
        res.status(401).json({error : 'No token'});
        return;
    }
    token = token.substring(7, token.length);
    try {
        var decoded = jwt.verify(token, process.env.SECRETKEY);
    } 
    catch(err) {
        res.status(403).json({error : 'Wrong token'});
        console.log(err);
        return;
    }
    const my_id = decoded.id;
    let mysQuery = 'SELECT `is_friend`, `sender_id`, `receiver_id` FROM `friendship` WHERE `id` = ?';
    const [relation_exist] = await connection.execute(mysQuery, [friendship_id]);
    if(!relation_exist.length){
        res.status(400).json({error : 'Friendship or friendship invitation does not exist.'});
        return;
    }
    const is_friend = relation_exist[0].is_friend;
    const sender_id = relation_exist[0].sender_id;
    if(is_friend || my_id === sender_id){
        mysQuery = 'DELETE FROM `friendship` WHERE `id` = ?';
        const [temp] = await connection.execute(mysQuery, [friendship_id]);
        const result = {
            "data": {
                "friendship": {
                    "id": friendship_id
                }
            }
        }
        res.json(result);
        return;
    }
    res.status(400).json({error : 'You cannot delete a request sent by someone else.'})
});

module.exports = router;