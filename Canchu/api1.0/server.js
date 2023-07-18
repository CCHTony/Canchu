const express = require('express');
const cors = require('cors')
const app = express();

require('dotenv').config();

app.use(cors());
app.use(express.json());
app.use('/public', express.static(__dirname + '/public'));

const usersRouter = require('./router/users');
const friendsRouter = require('./router/friends');
const eventsRouter = require('./router/events');
const postsRouter = require('./router/posts');

app.use('/api/1.0/users', usersRouter);
app.use('/api/1.0/friends', friendsRouter);
app.use('/api/1.0/events', eventsRouter);
app.use('/api/1.0/posts', postsRouter);


app.listen(3000, () => {
	console.log('Server is running');
});