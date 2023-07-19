const express = require('express');
const router = express.Router();


// create the connection nod to database
const connectionPromise = require('../models/mysql').connectionPromise;
const verifyAccesstoken = require('../models/function').verifyAccesstoken;


router.get('/', verifyAccesstoken, async (req, res) => {
	const connection = await connectionPromise;
	const my_id = req.decoded.id;

	let friendQuery =
		`
			SELECT 
				users.id AS user_id, 
				users.name, 
				users.picture, 
				friendship.id AS friendship_id 
			FROM users JOIN friendship 
			ON users.id = friendship.sender_id OR users.id = friendship.receiver_id 
			WHERE friendship.is_friend = true AND (friendship.receiver_id = ? OR friendship.sender_id = ?) AND users.id != ?
    `;
	const [friends] = await connection.execute(friendQuery, [my_id, my_id, my_id]);
	console.log(friends)

	const my_friends = friends.map((friend) => ({
    "id": friend.user_id,
    "name": friend.name,
    "picture": friend.picture,
    "friendship": {
        "id": friend.friendship_id,
        "status": "friend"
    }
	}));

	const response = {
		"data": {
			"users": my_friends
		}
	}
	res.json(response);
});


router.post('/:user_id/request', verifyAccesstoken, async (req, res) => {
	const connection = await connectionPromise;
	const receiver_id = req.params.user_id;
	const sender_id = req.decoded.id

	if(receiver_id === sender_id){
		return res.status(400).json({ error: 'You can not send request to yourself' });
	}
	const userQuery = 'SELECT id FROM users WHERE id = ?';
	const [is_receiver_exist] = await connection.execute(userQuery, [receiver_id]);
	if (!is_receiver_exist.length) {
		return res.status(400).json({ error: 'This user is not exist.' });
	}

	const checkRelationQuery = 'SELECT is_friend FROM friendship WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)';
  const [friendship] = await connection.execute(checkRelationQuery, [sender_id, receiver_id, receiver_id, sender_id]);
  if (friendship.length) {
    if (friendship[0].is_friend) {
      return res.status(400).json({ error: 'You are already friends.' });
    } 
		else {
      return res.status(400).json({ error: 'The request already exists.' });
    }
  }

	const friendQuery = 'INSERT INTO friendship(sender_id, receiver_id, is_friend) VALUES(?,?,?)';
	const [makeFriend] = await connection.execute(friendQuery, [sender_id, receiver_id, false]);
	const type = 'friend request'
	const eventQuery = 'INSERT INTO events(sender_id, receiver_id, type, is_read, created_at) VALUES(?,?,?,?,NOW())';
	const [event] = await connection.execute(eventQuery, [sender_id, receiver_id, type, false]);
	response = {
		"data": {
			"friendship": {
				"id": makeFriend.insertId
			}
		}
	}
	res.json(response);
});


router.get('/pending', verifyAccesstoken, async (req, res) => {
	const connection = await connectionPromise;
	const my_id = req.decoded.id;

	const friendQuery =
		`
			SELECT 
				users.id AS user_id, 
				users.name, 
				users.picture, 
				friendship.id AS friendship_id 
			FROM users JOIN friendship 
			ON users.id = friendship.sender_id 
			WHERE friendship.receiver_id = ? AND friendship.is_friend = false
    `;
	const [pending] = await connection.execute(friendQuery, [my_id]);
	console.log(pending);
	const user_result = pending.map(item => ({
		id: item.user_id,
		name: item.name,
		picture: item.picture,
		friendship: {
			id: item.friendship_id,
			status: "pending"
		}
	}));
	const response = {
		"data": {
			"users": user_result
		}
	};
	return res.json(response);
});


router.post('/:friendship_id/agree', verifyAccesstoken, async (req, res) => {
	const connection = await connectionPromise;
	const friendship_id = req.params.friendship_id;
	const my_id = req.decoded.id;

	const requestQuery = 'SELECT is_friend, receiver_id, sender_id FROM friendship WHERE id = ?';
	const [request_exist] = await connection.execute(requestQuery, [friendship_id]);
	if (!request_exist.length) {
		return res.status(400).json({ error: 'Request does not exist.' });
	}

	const is_friend = request_exist[0].is_friend;
	const receiver_id = request_exist[0].receiver_id;
	const sender_id = request_exist[0].sender_id;

	if (is_friend) {
		return res.status(400).json({ error: 'You are already friends.' });
	}
	if (my_id !== receiver_id) {
		return res.status(400).json({ error: 'Sender cannot agree the request' });
	}

	try {
		const updateQuery = 'UPDATE friendship SET is_friend = TRUE WHERE id = ?';
		const [agreement] = await connection.execute(updateQuery, [friendship_id]);

		const eventQuery = 'INSERT INTO events(sender_id, receiver_id, type, is_read, created_at) VALUES(?,?,?,?,NOW())';
		const [event] = await connection.execute(eventQuery, [my_id, sender_id, 'accepts friend request', false]);
	} catch (err) {
		console.log(err);
		return res.status(500).json({ error: 'Server error' })
	}

	const response = {
		"data": {
			"friendship": {
				"id": friendship_id
			}
		}
	}
	return res.json(response);
});


router.delete('/:friendship_id', verifyAccesstoken, async (req, res) => {
	const connection = await connectionPromise;
	const friendship_id = req.params.friendship_id;

	const chechFriendQuery = 'SELECT is_friend, sender_id, receiver_id FROM friendship WHERE id = ?';
	const [relation_exist] = await connection.execute(chechFriendQuery, [friendship_id]);
	if (!relation_exist.length) {
		return res.status(400).json({ error: 'Friendship or friendship invitation does not exist.' });
	}

	const deleteFriendQuery = 'DELETE FROM friendship WHERE id = ?';
	const [temp] = await connection.execute(deleteFriendQuery, [friendship_id]);
	const response = {
		"data": {
			"friendship": {
				"id": friendship_id
			}
		}
	}
	return res.json(response);
});


module.exports = router;