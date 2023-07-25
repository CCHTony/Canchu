// 引入所需的模組和套件
const express = require('express'); // 引入 Express 框架
const router = express.Router(); // 建立 Express 路由器
const multer = require('multer'); // 引入 multer 套件，用於處理上傳檔案

// 引入 usersController 中的函式
const { 
  Signup,          // 使用者註冊
  Signin,          // 使用者登入
  getProfile,      // 取得使用者個人資料
  updateProfile,   // 更新使用者個人資料
  updatePicture,   // 更新使用者個人頭像
  Search           // 使用者搜尋
} = require('../Controller/usersController');

// 引入驗證 Access Token 的函式
const verifyAccesstoken = require('../models/function').verifyAccesstoken;
// 引入 multer 套件，用於處理上傳檔案
const { upload } = require('../utils/multer');
// 引入自訂的 TryErr 函式，用於處理錯誤並統一回傳格式
const TryErr = require('../utils/TryandError').TryErr;


// 使用者註冊 API
router.post('/signup', (req, res) => TryErr(Signup(req, res), res));
// 使用者登入 API
router.post('/signin', (req, res) => TryErr(Signin(req, res), res));
// 取得使用者個人資料 API
router.get('/:id/profile', verifyAccesstoken, (req, res) => TryErr(getProfile(req, res), res))
// 更新使用者個人資料 API
router.put('/profile', verifyAccesstoken, (req, res) => TryErr(updateProfile(req, res), res))
// 更新使用者個人頭像 API
router.put('/picture', verifyAccesstoken, upload.single('picture'), (req, res) => TryErr(updatePicture(req, res), res))
// 使用者搜尋 API
router.get('/search', verifyAccesstoken, (req, res) => TryErr(Search(req, res), res));

// 匯出這些路由設定
module.exports = router;
