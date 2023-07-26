// 引入必要的模組和函式
const express = require('express');
const router = express.Router();

// 引入 friendsController 中的函式
const { 
  getFriend,               // 取得好友清單
  sendFriendRequest,       // 寄送好友請求
  getFriendRequest,        // 取得待處理好友請求清單
  agreeFriendRequest,      // 同意好友請求
  deleteFriend             // 刪除好友
} = require('../Controller/friendsController');

// 引入自訂的驗證函式 verifyAccesstoken，用於驗證使用者的存取權限
const verifyAccesstoken = require('../utils/function').verifyAccesstoken;
// 引入自訂的 TryErr 函式，用於處理錯誤並統一回傳格式
const TryErr = require('../utils/TryandError').TryErr;

// 設定路由，並指定相對應的處理函式，並且使用 verifyAccesstoken 函式來進行身份驗證
router.get('/', verifyAccesstoken, (req, res) => TryErr(getFriend(req, res), res));
// 當客戶端發送 GET 請求到根目錄時，會先進行身份驗證，通過驗證後執行 getFriend 函式處理好友清單的請求
router.post('/:user_id/request', verifyAccesstoken, (req, res) => TryErr(sendFriendRequest(req, res), res));
// 當客戶端發送 POST 請求到 /:user_id/request 路徑時，會先進行身份驗證，通過驗證後執行 sendFriendRequest 函式寄送好友請求
router.get('/pending', verifyAccesstoken, (req, res) => TryErr(getFriendRequest(req, res), res));
// 當客戶端發送 GET 請求到 /pending 路徑時，會先進行身份驗證，通過驗證後執行 getFriendRequest 函式處理待處理好友請求清單的請求
router.post('/:friendship_id/agree', verifyAccesstoken, (req, res) => TryErr(agreeFriendRequest(req, res), res));
// 當客戶端發送 POST 請求到 /:friendship_id/agree 路徑時，會先進行身份驗證，通過驗證後執行 agreeFriendRequest 函式處理同意好友請求的請求
router.delete('/:friendship_id', verifyAccesstoken, (req, res) => TryErr(deleteFriend(req, res), res));
// 當客戶端發送 DELETE 請求到 /:friendship_id 路徑時，會先進行身份驗證，通過驗證後執行 deleteFriend 函式處理刪除好友的請求

// 匯出這些路由設定
module.exports = router;
