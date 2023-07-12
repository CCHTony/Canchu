const express = require('express');
const app = express();

require('dotenv').config();

app.use(express.json());
app.use(express.static(__dirname + '/public'));

const usersRouter = require('./router/users');
const friendsRouter = require('./router/friends');

app.use('/api/1.0/users', usersRouter);
app.use('/api/1.0/friends', friendsRouter);


app.listen(3000, async() => {
    console.log('Server is running');
});