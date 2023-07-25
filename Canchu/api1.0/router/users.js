// 引入所需的模組和套件
const express = require('express'); // 引入 Express 框架
const router = express.Router(); // 建立 Express 路由器
const jwt = require('jsonwebtoken'); // 引入 JSON Web Token 套件，用於處理身份驗證
const crypto = require('crypto'); // 引入 crypto 套件，用於加密處理
const multer = require('multer'); // 引入 multer 套件，用於處理上傳檔案

// 引入資料庫連線
const connectionPromise = require('../models/mysql').connectionPromise;
// 引入 Redis 相關函式
const redisSearch = require('../models/function').redisSearch;
const redisDelete = require('../models/function').redisDelete;
const redisSet = require('../models/function').redisSet;

const Signup = require('../Controller/usersController').Signup;
const Signin = require('../Controller/usersController').Signin;
const getProfile = require('../Controller/usersController').getProfile;
const updateProfile = require('../Controller/usersController').updateProfile;
const updatePicture = require('../Controller/usersController').updatePicture;
const Search = require('../Controller/usersController').Search
// 引入驗證 Access Token 的函式
const verifyAccesstoken = require('../models/function').verifyAccesstoken;

const TryErr = require('../utils/TryandError').TryErr;

// 設定 multer 的存儲方式和目的地
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now()
    cb(null, file.fieldname + '-' + uniqueSuffix + '.jpg')
  }
});
const upload = multer({ storage: storage });

// 使用者註冊 API
router.post('/signup', (req, res) => TryErr(Signup(req, res), res));
// 使用者登入 API
router.post('/signin', (req, res) => TryErr(Signin(req, res)));
// 取得使用者個人資料 API
router.get('/:id/profile', verifyAccesstoken, (req, res) => TryErr(getProfile(req, res)))
// 更新使用者個人資料 API
router.put('/profile', verifyAccesstoken, (req, res) => TryErr(updateProfile(req, res)))
// 更新使用者個人頭像 API
router.put('/picture', verifyAccesstoken, upload.single('picture'), (req, res) => TryErr(updatePicture(req, res)))
// 使用者搜尋 API
router.get('/search', verifyAccesstoken, (req, res) => TryErr(Search(req, res)));


module.exports = router;
