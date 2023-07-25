const express = require('express'); // 引入 Express 框架
const router = express.Router(); // 創建一個路由 (router) 物件

const { createPost, updatePost, Like, deleteLike, Comment, searchPost, detail} = require('../Controller/postsController')
// 引入自訂的 TryErr 函式，用於處理錯誤並統一回傳格式
const TryErr = require('../utils/TryandError').TryErr;

// 引入存取權杖驗證的功能
const verifyAccesstoken = require('../models/function').verifyAccesstoken;

// 新增帖子的路由處理函式
router.post('/', verifyAccesstoken, (req, res) => TryErr(createPost(req, res), res));
// 更新帖子內容的路由處理函式
router.put('/:id', verifyAccesstoken, (req, res) => TryErr(updatePost(req, res), res));
// 對帖子按讚的路由處理函式
router.post('/:id/like', verifyAccesstoken, (req, res) => TryErr(Like(req, res), res));
// 取消帖子按讚的路由處理函式
router.delete('/:id/like', verifyAccesstoken, (req, res) => TryErr(deleteLike(req, res), res));
// 發布帖子評論的路由處理函式
router.post('/:id/comment', verifyAccesstoken, (req, res) => TryErr(Comment(req, res), res));
// 搜尋帖子的路由處理函式
router.get('/search', verifyAccesstoken, (req, res) => TryErr(searchPost(req, res), res));
// 獲取單個帖子詳細信息的路由處理函式
router.get('/:id', verifyAccesstoken, (req, res) => TryErr(detail(req, res), res));


module.exports = router;