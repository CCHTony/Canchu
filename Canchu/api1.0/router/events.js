// 引入必要的模組和函式
const express = require('express');
const router = express.Router();

// 引入 eventsController 中的函式
const { 
  getEvent,   // 取得事件資料
  readEvent   // 標記事件為已讀
} = require('../Controller/eventsController');

// 引入自訂的 TryErr 函式，用於處理錯誤並統一回傳格式
const TryErr = require('../utils/TryandError').TryErr;
// 引入自訂的驗證函式 verifyAccesstoken，用於驗證使用者的存取權限
const verifyAccesstoken = require('../utils/function').verifyAccesstoken;

// 設定路由，並指定相對應的處理函式，並且使用 verifyAccesstoken 函式來進行身份驗證
router.get('/', verifyAccesstoken, (req, res) => TryErr(getEvent(req, res), res));
// 當客戶端發送 GET 請求到根目錄時，會先進行身份驗證，通過驗證後執行 getEvent 函式處理取得事件資料的請求
router.post('/:event_id/read', verifyAccesstoken, (req, res) => TryErr(readEvent(req, res), res));
// 當客戶端發送 POST 請求到 /:event_id/read 路徑時，會先進行身份驗證，通過驗證後執行 readEvent 函式處理標記事件為已讀的請求

// 匯出這些路由設定
module.exports = router;
