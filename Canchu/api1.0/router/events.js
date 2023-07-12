const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// create the connection nod to database
const connectionPromise = require('../models/mysql').connectionPromise;
const verifyAccesstoken = require('../models/function').verifyAccesstoken;

router.get('/', verifyAccesstoken, async(req, res) => {
    const connection = await connectionPromise;
    const my_id = req.decoded.id;

    let notification_result = [];
    let mysQuery = 'SELECT `events`.`id` AS `events_id`, `type`, `is_read`, DATE_FORMAT(`created_at`, "%Y-%m-%d %H:%i:%s") AS `formatted_created_at`, `name`, `picture` FROM `users` JOIN `events` ON `users`.`id` = `events`.`sender_id` WHERE `receiver_id` = ?';
    const [notification] = await connection.execute(mysQuery, [my_id]);
    console.log(notification);
    for(let i = 0; i < notification.length; i++){
        let TOF;
        let summary = '';
        if(notification[i].type === 'friend request'){
            summary = 'invited you to be friends.';
        }
        else{
            summary = 'has accepted your friend request.';
        }
        let temp = {
                "id": notification[i].events_id,
                "type": notification[i].type,
                "is_read": Boolean(notification[i].is_read),
                "image": notification[i].picture,
                "created_at": notification[i].formatted_created_at,
                "summary": `${notification[i].name} ${summary}`
            };
        notification_result.push(temp);
    }
    const result = {
        "data": {
            "events":notification_result 
        }
    };
    res.json(result);
});


router.post('/:event_id/read', verifyAccesstoken, async(req, res) => {
    const connection = await connectionPromise;
    const event_id = req.params.event_id;
    const my_id = req.decoded.id;

    let mysQuery = 'SELECT `id` FROM `events` WHERE `receiver_id` = ? AND `id` = ?';
    const [event] = await connection.execute(mysQuery, [my_id, event_id]);
    if(event.length === 0){
        res.status(400).json({error : 'You do not have this event!'})
        return;
    }
    mysQuery = 'UPDATE `events` SET `is_read` = TRUE WHERE `id` = ?';
    const [update] = await connection.execute(mysQuery, [event_id]);
    console.log(event);
    const result = {
        "data": {
            "event": {
                "id": event_id
            }
        }
    }
    res.json(result);
});


module.exports = router;