const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const app = express();

require('dotenv').config();

// 設定每分鐘允許的最大請求數量為 100
const limiter = rateLimit({
  windowMs:  1000, // 一分鐘
  max: 10, // 最大請求數量
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname + '/public'));
// 將 Rate Limiting 中間件應用到所有路由上
app.use(limiter);

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