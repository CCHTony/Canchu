// 創建與資料庫的連線 (connection promise)
const connectionPromise = require('../models/mysql').connectionPromise;

// 新增群組的路由處理函式
async function createGroup(req, res){
	const connection = await connectionPromise; // 創建與資料庫的連線 (connection promise)
	const my_id = req.decoded.id; // 從解碼的存取權杖中獲取當前使用者的 ID
	const groupName = req.body.name; // 從請求中取得名字

  // 執行創建的 SQL 
	const insertQuery = 'INSERT INTO groups_info(name, creator_id) VALUES(?,?)';
	const [group] = await connection.execute(insertQuery, [groupName, my_id]);

  // 獲取創建的群組 ID
  const group_id = group.insertId;

  // 將創建者與群組建立關聯，插入到 user_group 表中
  const insertUserGroupQuery = 'INSERT INTO user_group(user_id, group_id, status) VALUES(?,?,?)';
  await connection.execute(insertUserGroupQuery, [my_id, group_id, true]); // 假設創建者的狀態為已通過（status = true）

  console.log(group);
  const results = {
    "data": {
      "group": {
        "id": group.insertId
      }
    }
  }
  res.json(results);
}

async function deleteGroup(req, res) {
  const connection = await connectionPromise; // 創建與資料庫的連線 (connection promise)
  const my_id = req.decoded.id; // 從解碼的存取權杖中獲取當前使用者的 ID
  const group_id = req.params.group_id; // 從請求中取得要刪除的群組 ID

  // 查詢群組創建者的 ID
  const creatorIdQuery = 'SELECT creator_id FROM groups_info WHERE id = ?';
  const [creatorRows] = await connection.execute(creatorIdQuery, [group_id]);
  if (creatorRows.length === 0) {
    return res.status(400).json({ error: 'Group not found.' });
  }

  const creator_id = creatorRows[0].creator_id;

  // 檢查是否為群組的創建者，只有創建者有權刪除群組
  if (my_id !== creator_id) {
    return res.status(400).json({ error: 'You do not have permission to delete this group.' });
  }

  // 執行刪除群組的 SQL 
  const deleteQuery = 'DELETE FROM groups_info WHERE id = ?';
  await connection.execute(deleteQuery, [group_id]);

  const results = {
    "data": {
      "group": {
        "id": parseInt(group_id)
      }
    }
  };
  res.json(results);
}

async function joinGroup(req, res) {
  const connection = await connectionPromise; // 創建與資料庫的連線 (connection promise)
  const my_id = req.decoded.id; // 從解碼的存取權杖中獲取當前使用者的 ID
  const group_id = req.params.group_id; // 從請求中取得要加入的群組 ID

  // 查詢群組創建者的 ID
  const creatorIdQuery = 'SELECT creator_id FROM groups_info WHERE id = ?';
  const [creatorRows] = await connection.execute(creatorIdQuery, [group_id]);
  if (creatorRows.length === 0) {
    return res.status(400).json({ error: 'Group not found.' });
  }

  const creator_id = creatorRows[0].creator_id;

  // 檢查是否為群組的創建者，創建者不能申請加入自己的群組
  if (my_id === creator_id) {
    return res.status(400).json({ error: 'Creators cannot apply to join their own group.' });
  }

  // 檢查用戶是否已經是群組的成員
  const checkMembershipQuery = 'SELECT id FROM user_group WHERE user_id = ? AND group_id = ?';
  const [membershipRows] = await connection.execute(checkMembershipQuery, [my_id, group_id]);
  if (membershipRows.length > 0) {
    return res.status(400).json({ error: 'You have already applied to join this group.' });
  }

  // 執行加入群組的 SQL 
  const insertQuery = 'INSERT INTO user_group(user_id, group_id, status) VALUES(?,?,false)';
  await connection.execute(insertQuery, [my_id, group_id]);

  const results = {
    "data": {
      "group": {
        "id": group_id
      }
    }
  };
  res.json(results);
}

async function getPendingMembers(req, res) {
  const connection = await connectionPromise; // 創建與資料庫的連線 (connection promise)
  const group_id = req.params.group_id; // 從請求中取得群組 ID

  // 檢查用戶是否為該群組的創建者
  const checkCreatorQuery = 'SELECT creator_id FROM groups_info WHERE id = ?';
  const [creatorRows] = await connection.execute(checkCreatorQuery, [group_id]);
  if (creatorRows.length === 0) {
    return res.status(400).json({ error: 'Group not found.' });
  }

  const creator_id = creatorRows[0].creator_id;
  const my_id = req.decoded.id; // 從解碼的存取權杖中獲取當前使用者的 ID

  // 判斷使用者是否有權限查看等待加入的成員信息
  if (my_id !== creator_id) {
    return res.status(400).json({ error: 'You are not authorized to view pending members of this group.' });
  }

  // 查詢等待加入的成員信息
  const getPendingMembersQuery = 'SELECT u.id, u.name, u.picture, "pending" AS status FROM users u INNER JOIN user_group ug ON u.id = ug.user_id WHERE ug.group_id = ? AND ug.status = false';
  const [pendingMembersRows] = await connection.execute(getPendingMembersQuery, [group_id]);

  const results = {
    "data": {
      "users": pendingMembersRows
    }
  };
  return res.status(200).json(results);
}

async function approveMembership(req, res) {
  const connection = await connectionPromise; // 創建與資料庫的連線 (connection promise)
  const group_id = req.params.group_id; // 從請求中取得群組 ID
  const user_id = req.params.user_id; // 從請求中取得用戶 ID

  // 檢查用戶是否為該群組的創建者
  const checkCreatorQuery = 'SELECT creator_id FROM groups_info WHERE id = ?';
  const [creatorRows] = await connection.execute(checkCreatorQuery, [group_id]);
  if (creatorRows.length === 0) {
    return res.status(400).json({ error: 'Group not found.' });
  }

  const creator_id = creatorRows[0].creator_id;
  const my_id = req.decoded.id; // 從解碼的存取權杖中獲取當前使用者的 ID

  // 判斷使用者是否為群組的創建者
  if (my_id !== creator_id) {
    return res.status(400).json({ error: 'You are not authorized to approve membership applications for this group.' });
  }

  // 更新用戶在群組中的狀態為已同意
  const approveMembershipQuery = 'UPDATE user_group SET status = true WHERE group_id = ? AND user_id = ? AND status = false';
  const [updateResult] = await connection.execute(approveMembershipQuery, [group_id, user_id]);

  // 檢查是否成功更新資料
  if (updateResult.affectedRows === 0) {
    return res.status(400).json({ error: 'User not found or membership application is already approved.' });
  }

  const results = {
    "data": {
      "user": {
        "id": user_id
      }
    }
  };

  return res.status(200).json(results);
}

async function createPost(req, res) {
  const connection = await connectionPromise; // 創建與資料庫的連線 (connection promise)
  const group_id = req.params.group_id; // 從請求中取得群組 ID
  const my_id = req.decoded.id; // 從解碼的存取權杖中獲取當前使用者的 ID
  const context = req.body.context; // 從請求中取得帖子內容

  // 檢查使用者是否在該群組中
  const checkMembershipQuery = 'SELECT user_group.user_id FROM user_group WHERE group_id = ? AND user_id = ? AND status = true';
  const [membershipRows] = await connection.execute(checkMembershipQuery, [group_id, my_id]);

  // 如果使用者不在群組中，返回 400 錯誤
  if (membershipRows.length === 0) {
    return res.status(400).json({ error: 'You are not in this group.' });
  }

  // 執行創建帖子的 SQL 
  const createPostQuery = 'INSERT INTO group_posts(group_id, user_id, context) VALUES(?,?,?)';
  const [post] = await connection.execute(createPostQuery, [group_id, my_id, context]);

  const results = {
    "data": {
      "group": {
        "id": group_id
      },
      "user": {
        "id": my_id
      },
      "post": {
        "id": post.insertId
      }
    }
  };

  return res.json(results);
}

async function getGroupPosts(req, res) {
  const connection = await connectionPromise; // 創建與資料庫的連線 (connection promise)
  const group_id = req.params.group_id; // 從請求中取得群組 ID
  const my_id = req.decoded.id; // 從解碼的存取權杖中獲取當前使用者的 ID

  // 檢查使用者是否在該群組中
  const checkMembershipQuery = 'SELECT user_group.user_id FROM user_group WHERE group_id = ? AND user_id = ? AND status = true';
  const [membershipRows] = await connection.execute(checkMembershipQuery, [group_id, my_id]);

  // 如果使用者不在群組中，返回 400 錯誤
  if (membershipRows.length === 0) {
    return res.status(400).json({ error: 'You are not in this group.' });
  }

  // 查詢群組內所有的帖子
  const getPostsQuery = 
  `
  SELECT 
    group_posts.id, 
    group_posts.group_id, 
    group_posts.user_id, 
    group_posts.context, 
    DATE_FORMAT(CONVERT_TZ(group_posts.created_at, '+00:00', '+08:00'), "%Y-%m-%d %H:%i:%s") AS created_at, 
    users.name AS user_name, 
    users.picture AS user_picture 
  FROM group_posts JOIN users 
  ON group_posts.user_id = users.id 
  WHERE group_id = ? ORDER BY created_at DESC`;
  const [postRows] = await connection.execute(getPostsQuery, [group_id]);

  // 整理帖子資料，添加相關信息
  const posts = postRows.map((post) => {
    return {
      id: post.id,
      user_id: post.user_id,
      created_at: post.created_at,
      context: post.context,
      is_liked: false,
      like_count: 0,
      comment_count: 0,
      picture: post.user_picture,
      name: post.user_name,
    };
  });

  const results = {
    data: {
      posts: posts,
    },
  };

  return res.status(200).json(results);
}


module.exports = {
  createGroup,
  deleteGroup,
  joinGroup,
  getPendingMembers,
  approveMembership,
  createPost,
  getGroupPosts
}