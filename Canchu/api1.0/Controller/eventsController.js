// create the connection nod to database
const connectionPromise = require('../models/mysql').connectionPromise;

async function getEvent(req, res){
	const connection = await connectionPromise;
	const my_id = req.decoded.id;

	const eventQuery = 
	`
	SELECT 
		events.id AS events_id, 
		type, is_read, 
		DATE_FORMAT(CONVERT_TZ(created_at, '+00:00', '+08:00'), "%Y-%m-%d %H:%i:%s") AS formatted_created_at, 
		name, picture 
	FROM users JOIN events 
	ON users.id = events.sender_id 
	WHERE receiver_id = ? 
	ORDER BY created_at DESC
	`;
	const [notification] = await connection.execute(eventQuery, [my_id]);

	const notification_result = notification.map((notification) => {
		let summary = '';
		if (notification.type === 'friend request') {
			summary = 'invited you to be friends.';
		} else {
			summary = 'has accepted your friend request.';
		}
		return {
			id: notification.events_id,
			type: notification.type,
			is_read: Boolean(notification.is_read),
			image: notification.picture,
			created_at: notification.formatted_created_at,
			summary: `${notification.name} ${summary}`,
		};
	});
	const response = {
		"data": {
			"events": notification_result
		}
	};
	return res.json(response);
}

async function readEvent(req, res){
	const connection = await connectionPromise;
	const event_id = req.params.event_id;
	const my_id = req.decoded.id;

	const checkEventQuery = 'SELECT id FROM events WHERE receiver_id = ? AND id = ?';
	const [event] = await connection.execute(checkEventQuery, [my_id, event_id]);
	if (event.length === 0) {
		return res.status(400).json({ error: 'You do not have this event!' });
	}
	const readQuery = 'UPDATE events SET is_read = TRUE WHERE id = ?';
	const [update] = await connection.execute(readQuery, [event_id]);
	console.log(event);
	const response = {
		"data": {
			"event": {
				"id": event_id
			}
		}
	}
	return res.json(response);
}

module.exports = {
  getEvent,
  readEvent
}