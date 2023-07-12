const express = require('express');
const app = express();

require('dotenv').config();

app.use(express.json());
app.use(express.static(__dirname + '/public'));

const usersRouter = require('./router/users');
const friendsRouter = require('./router/friends');
const eventsRouter = require('./router/events')

app.use('/api/1.0/users', usersRouter);
app.use('/api/1.0/friends', friendsRouter);
app.use('/api/1.0/events', eventsRouter);


app.listen(3000, () => {
    console.log('Server is running');
});