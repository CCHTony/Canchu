const { redisSearch, redisSet, redisDelete } = require('../models/function'); // 引入自訂的 Redis 功能模組

// 創建與資料庫的連線 (connection promise)
const connectionPromise = require('../models/mysql').connectionPromise;

// 新增帖子的路由處理函式
async function createPost(req, res){
	const connection = await connectionPromise; // 創建與資料庫的連線 (connection promise)
	const my_id = req.decoded.id; // 從解碼的存取權杖中獲取當前使用者的 ID
	const context = req.body.context; // 從請求中取得帖子內容
	const order_key = `user_${my_id}_18446744073709551615`; // 用於存儲使用者帖子順序的 Redis key

	const postQuery = 'INSERT INTO posts (poster_id, created_at, context, like_count, comment_count) VALUES (?, NOW(), ?, ?, ?)';

  const [post] = await connection.execute(postQuery, [my_id, context, 0, 0]); // 在資料庫中新增帖子
  console.log(post);
  const results = {
    "data": {
      "post": {
        "id": post.insertId
      }
    }
  }
  await redisDelete(order_key); // 刪除緩存中的使用者帖子順序數據，因為新增了一個帖子
  res.json(results);
}

// 更新帖子內容的路由處理函式
async function updatePost (req, res){
	const connection = await connectionPromise; // 創建與資料庫的連線 (connection promise)
	const post_id = req.params.id; // 從請求中取得帖子 ID
	const context = req.body.context; // 從請求中取得新的帖子內容
	const my_id = req.decoded.id // 從解碼的存取權杖中獲取當前使用者的 ID
	const postKey = `post_${post_id}`; // 用於存儲帖子的 Redis key

	const updateQuery = 'UPDATE posts set context = ? where id = ? AND poster_id = ? ';
  const [update] = await connection.execute(updateQuery, [context, post_id, my_id]); // 在資料庫中更新帖子內容
  console.log(update);
  if (update.affectedRows === 0) {
    // 如果當前使用者不是帖子的作者，或者帖子不存在，則返回錯誤訊息
    return res.status(403).json({error : 'you are not poster or post does not exist'});
  }
  const response = {
    "data": {
      "post": {
        "id": post_id
      }
    }
  }
  await redisDelete(postKey); // 刪除緩存中的帖子數據，因為帖子內容已更新
  res.json(response);
}

// 對帖子按讚的路由處理函式
async function Like(req, res){
	const connection = await connectionPromise; // 創建與資料庫的連線 (connection promise)
	const post_id = req.params.id; // 從請求中取得帖子 ID
	const my_id = req.decoded.id; // 從解碼的存取權杖中獲取當前使用者的 ID
	const postKey = `post_${post_id}`; // 用於存儲帖子的 Redis key
	const likeKey = `like_${my_id}_${post_id}`; // 用於存儲按讚狀態的 Redis key

	let likeQuery = 'INSERT IGNORE INTO likes (post_id, user_id, created_at) VALUES (?, ?, NOW())';
  const [like] = await connection.execute(likeQuery, [post_id, my_id]); // 在資料庫中插入按讚紀錄，如果已經按讚過則忽略
  console.log(like);
  if(like.affectedRows === 0){
    return res.status(400).json({ error: 'You have already liked it.' });
  }
  const response = {
    "data": {
      "post": {
        "id": post_id
      }
    }
  }
  await redisDelete(postKey); // 刪除緩存中的帖子數據，因為按讚狀態已更新
  await redisDelete(likeKey); // 刪除緩存中的按讚狀態數據
  res.json(response);
}

// 取消帖子按讚的路由處理函式
async function deleteLike(req, res){
	const connection = await connectionPromise; // 創建與資料庫的連線 (connection promise)
	const post_id = req.params.id; // 從請求中取得帖子 ID
	const my_id = req.decoded.id; // 從解碼的存取權杖中獲取當前使用者的 ID
	const postKey = `post_${post_id}`; // 用於存儲帖子的 Redis key
	const likeKey = `like_${my_id}_${post_id}`; // 用於存儲按讚狀態的 Redis key

	let likeQuery = 'DELETE FROM likes WHERE post_id = ? AND user_id = ?';
  const [like] = await connection.execute(likeQuery, [post_id, my_id]); // 從資料庫中刪除按讚紀錄
  console.log(like);
  if(like.affectedRows === 0){
    return res.status(400).json({ error: "You haven't liked it yet!" });
  }
  const response = {
    "data": {
      "post": {
        "id": post_id
      }
    }
  }
  await redisDelete(postKey); // 刪除緩存中的帖子數據，因為按讚狀態已更新
  await redisDelete(likeKey); // 刪除緩存中的按讚狀態數據
  res.json(response);
}

// 發布帖子評論的路由處理函式
async function Comment(req, res){
	const connection = await connectionPromise; // 創建與資料庫的連線 (connection promise)
	const post_id = Number.parseInt(req.params.id); // 從請求中取得帖子 ID，並轉換為數字型態
	const my_id = req.decoded.id; // 從解碼的存取權杖中獲取當前使用者的 ID
	const content = req.body.content; // 從請求中取得評論內容
	const postKey = `post_${post_id}`; // 用於存儲帖子的 Redis key

  const postQuery = 'INSERT INTO comments (post_id, user_id, created_at, content) VALUES (?, ?, NOW(), ?)';
  const [comment] = await connection.execute(postQuery, [post_id, my_id, content]); // 在資料庫中插入評論
  console.log(comment);
  const response = {
    "data": {
      "post": {
        "id": post_id
      },
      "comment": {
        "id": comment.insertId // 回傳評論的 ID
      }
    }
  }
  await redisDelete(postKey); // 刪除緩存中的帖子數據，因為帖子內容已更新（新增評論）
  res.json(response);
}

// 搜尋帖子的路由處理函式
async function searchPost(req, res){

	const connection = await connectionPromise; // 創建與資料庫的連線 (connection promise)
	let search_id = req.query.user_id; // 從請求中取得搜尋的使用者 ID
	let cursor = req.query.cursor; // 從請求中取得遊標
	const my_id = req.decoded.id; // 從解碼的存取權杖中獲取當前使用者的 ID
	let order_key = null; // 用於存儲排序用的 Redis key
	let postKeyArr = []; // 用於存儲帖子用的 Redis key 陣列
	let postArr = []; // 用於存儲帖子物件的陣列
	let likeKeyArr = []; // 用於存儲點贊用的 Redis key 陣列
	let likeArr =[]; // 用於存儲點贊的陣列

	let dismatch = false; // 用於檢查是否發生 Redis 與 MySQL 查詢結果不一致的情況

  let postIdCursor = 18446744073709551615n; // 初始化帖子 ID 遊標，預設值為最大值
  if (cursor) {
    postIdCursor = Number.parseInt(atob(cursor)); // 若有遊標，則解碼並轉換為數字型態
  }
  console.log(postIdCursor);

  // 初始化 MySQL 查詢的參數
  let param = [];
  let postQuery =
  `
  SELECT
    posts.id AS id,
    DATE_FORMAT(CONVERT_TZ(posts.created_at, '+00:00', '+08:00'), '%Y-%m-%d %H:%i:%s') AS created_at,
    posts.context,
    users.id AS user_id,
    users.name,
    users.picture,
    COUNT(DISTINCT likes.id) AS like_count,
    COUNT(DISTINCT comments.id) AS comment_count,
    (SELECT COUNT(*) FROM likes WHERE post_id = posts.id AND user_id = ?) AS is_liked
  FROM posts
  LEFT JOIN likes ON likes.post_id = posts.id
  LEFT JOIN comments ON comments.post_id = posts.id
  INNER JOIN users ON posts.poster_id = users.id 
  `;

  let condition;
  if(!search_id){
    condition = 
    `
    WHERE (users.id = ? OR users.id IN (
      SELECT CASE
        WHEN friendship.sender_id = ? THEN friendship.receiver_id
        ELSE friendship.sender_id
      END AS friend_id
      FROM friendship
      WHERE (friendship.sender_id = ? OR friendship.receiver_id = ?) AND friendship.is_friend = 1
    )) AND posts.id <= ? 
    `;
    param = [my_id, my_id, my_id, my_id, my_id, postIdCursor];
  }
  else{
    condition = `WHERE users.id = ? AND posts.id <= ? `;
    param = [my_id, search_id, postIdCursor];
    order_key = `user_${search_id}_${postIdCursor}`;
  }

  const suffix = 
  `
  GROUP BY posts.id
  ORDER BY posts.created_at DESC
  LIMIT 11
  `;
  postQuery += (condition + suffix);

  // 初始化下一個遊標
  let encodedNextCursor;

  console.log(order_key);
  let order = await redisSearch(order_key);
  if(order){
    console.log(order);
    // 如果緩存中已存在帖子和點贊的 Redis key，則逐個獲取帖子和點贊的數據
    for(let i = 0; i < order.length; i++){

      postKeyArr[i] = `post_${order[i]}`;
      postArr[i] = await redisSearch(postKeyArr[i]);
      if(!postArr[i]){
        console.log('postArr problem');
        dismatch = true;
        break;
      }
      likeKeyArr[i] = `like_${my_id}_${order[i]}`
      likeArr[i] = await redisSearch(likeKeyArr[i]);
      if(likeArr[i] === null){
        console.log('likeArr problem');
        dismatch = true;
        break;
      }
    }
    // 如果緩存中的數據和 MySQL 查詢結果不一致，設置 dismatch 為 true
    if(dismatch === false){
      // 如果 postArr 長度為 11，表示有更多帖子，獲取下一個遊標
      if(postArr.length === 11){
        const nextCursor = order[order.length-1];
        console.log(nextCursor);
        encodedNextCursor = btoa(nextCursor.toString()); // 將下一個遊標轉換為 Base64 編碼
      }
      else{
        encodedNextCursor = null; // 若沒有下一個遊標，則設置為 null
      }
      // 將點贊數據添加到帖子物件中
      const formattedPosts = postArr.map((post, i) => {
        post.is_like = likeArr[i]; 
        return post;
      });
      // 獲取前 10 個帖子和下一個遊標，構造回應物件
      const display_post = formattedPosts.slice(0, 10);
      const response = {
        data: {
          posts: display_post,
          next_cursor: encodedNextCursor
        }
      };
      console.log('cache');
      return res.json(response)
    }
  }
  
  let [posts] = await connection.execute(postQuery, param);
  
  // 如果查詢到的帖子數量為 11，表示有更多帖子，獲取下一個遊標
  if(posts.length === 11){
    const nextCursor = posts[posts.length - 1].id;
      encodedNextCursor = btoa(nextCursor.toString()); // 將下一個遊標轉換為 Base64 編碼
  }
  else{
    encodedNextCursor = null; // 若沒有下一個遊標，則設置為 null
  }

  // 初始化 order 陣列
  order =[];
  // 格式化帖子物件並將 id 存儲到 order 陣列中
  const formattedPosts = posts.map((post) => {
    order.push(post.id);
    return {
      id: post.id,
      user_id: post.user_id,
      created_at: post.created_at,
      context: post.context,
      is_liked: post.is_liked === 1,
      like_count: post.like_count,
      comment_count: post.comment_count,
      picture: post.picture,
      name: post.name
    };
  });

  console.log('DB');
  // 如果指定了 order_key，表示要將數據存儲到緩存中
  if(order_key){
    await redisSet(order_key,order);
    const formattedPostsWithoutIsLiked = formattedPosts.map(({ is_liked, ...rest }) => rest);
    for(let i = 0; i < order.length; i++){
      postKeyArr[i] = `post_${order[i]}`;
      await redisSet(postKeyArr[i],formattedPostsWithoutIsLiked[i]);
      likeKeyArr[i] = `like_${my_id}_${order[i]}`
      await redisSet(likeKeyArr[i], formattedPosts[i].is_liked);
    }
  }
  
  // 獲取前 10 個帖子和下一個遊標，構造回應物件
  const display_post = formattedPosts.slice(0, 10);
  const response = {
    data: {
      posts: display_post,
      next_cursor: encodedNextCursor
    }
  };
  return res.json(response);
}

// 獲取單個帖子詳細信息的路由處理函式
async function detail(req, res){
	const connection = await connectionPromise; // 創建與資料庫的連線 (connection promise)
	const post_id = req.params.id; // 從請求中取得帖子的 ID
	const my_id = req.decoded.id; // 從解碼的存取權杖中獲取當前使用者的 ID

	// 查詢單個帖子的詳細信息，包括發布者的資訊、點贊數、評論數等
	let postQuery =
	`
	SELECT
		posts.id AS postId,
		DATE_FORMAT(CONVERT_TZ(posts.created_at, '+00:00', '+08:00'), '%Y-%m-%d %H:%i:%s') AS created_at,
		posts.context,
		users.id AS user_id,
		users.name,
		users.picture,
		COUNT(DISTINCT likes.id) AS like_count,
		COUNT(DISTINCT comments.id) AS comment_count,
		(SELECT COUNT(*) FROM likes WHERE post_id = ? AND user_id = ?) AS is_liked
	FROM posts
	LEFT JOIN likes ON likes.post_id = posts.id
	LEFT JOIN comments ON comments.post_id = posts.id
	INNER JOIN users ON posts.poster_id = users.id
	WHERE posts.id = ?
	GROUP BY posts.id
	`;

  // 執行帖子詳細信息的查詢
  const post = (await connection.execute(postQuery, [post_id, my_id, post_id]))[0][0];
  console.log(post);

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  // 檢查帖子是否被當前使用者點贊
  const isLiked = post.is_liked === 1;

  // 獲取帖子的評論
  let commentsQuery =
  `
  SELECT 
    comments.id,
    DATE_FORMAT(CONVERT_TZ(comments.created_at, '+00:00', '+08:00'), '%Y-%m-%d %H:%i:%s') AS created_at,
    comments.content,
    users.id AS user_id,
    users.name,
    users.picture
  FROM comments
  INNER JOIN users ON comments.user_id = users.id
  WHERE comments.post_id = ?
  `;

  const [commentResults] = await connection.execute(commentsQuery, [post_id]);
  const comments = commentResults.map((comment) => ({
    id: comment.id,
    created_at: comment.created_at,
    content: comment.content,
    user: {
      id: comment.user_id,
      name: comment.name,
      picture: comment.picture,
    },
  }));

  // 構造回應物件，包含帖子詳細信息和相關的評論
  const response = {
    data: {
      post: {
        id: post.postId,
        user_id: post.user_id,
        created_at: post.created_at,
        context: post.context,
        is_liked: isLiked,
        like_count: post.like_count,
        comment_count: post.comment_count,
        picture: post.picture,
        name: post.name,
        comments: comments,
      },
    },
  };
  return res.json(response);
}

module.exports = {
  createPost,
  updatePost,
  Like,
  deleteLike,
  Comment,
  searchPost,
  detail
}