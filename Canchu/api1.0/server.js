// 引入所需的模組和套件
const express = require('express'); // 引入 Express 框架
const cors = require('cors'); // 引入 CORS 套件，用於處理跨來源請求
// const rateLimit = require('express-rate-limit'); // 引入 express-rate-limit 套件，用於實現請求速率限制
const { rateLimiter } = require('./utils/rateLimiter')
const app = express(); // 建立 Express 應用程式實例

require('dotenv').config(); // 載入 .env 檔案中的環境變數

// 設定每分鐘允許的最大請求數量為 10，時間窗口為 1000 毫秒 (1 秒)
// const limiter = rateLimit({
//   windowMs: 1000, // 一秒鐘
//   max: 10, // 最大請求數量
// });

app.use(cors()); // 使用 CORS 中間件，允許跨來源請求
app.use(express.json()); // 使用內建的 express.json 中間件，解析請求的 JSON 資料
app.use(express.static(__dirname + '/public')); // 設定靜態檔案的伺服器路徑，用於處理靜態檔案請求

// 將 Rate Limiting 中間件應用到所有路由上，以實現請求速率限制
//app.use(limiter);
app.use(rateLimiter);

// 引入路由模組
const usersRouter = require('./router/users');
const friendsRouter = require('./router/friends');
const eventsRouter = require('./router/events');
const postsRouter = require('./router/posts');

// 設定路由，將路由模組套用到相對應的路徑上
app.use('/api/1.0/users', usersRouter);
app.use('/api/1.0/friends', friendsRouter);
app.use('/api/1.0/events', eventsRouter);
app.use('/api/1.0/posts', postsRouter);

// 啟動伺服器監聽指定的端口，並在啟動後印出 'Server is running' 訊息
app.listen(3000, () => {
	console.log('Server is running');
});

module.exports = {
	app
}
