// 創建與資料庫的連線 (connection promise)
const connectionPromise = require('../models/mysql').connectionPromise;

// 新增群組的路由處理函式
async function createGroup(req, res){
	const connection = await connectionPromise; // 創建與資料庫的連線 (connection promise)
	const my_id = req.decoded.id; // 從解碼的存取權杖中獲取當前使用者的 ID
	const groupName = req.body.name; // 從請求中取得名字

	const groupNameQuery = 'SELECT groups_info.name FROM groups_info WHERE name = ?';
	const [rows] = await connection.execute(groupNameQuery, [groupName]);
	if (rows.length !== 0) {
    return res.status(400).json({ error: 'This group name has already been used.' });
	}

  // 執行創建的 SQL 
	const insertQuery = 'INSERT INTO groups_info(name, creator_id) VALUES(?,?)';
	const [group] = await connection.execute(insertQuery, [groupName, my_id]);

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



module.exports = {
  createGroup,
  deleteGroup,
  joinGroup,
  getPendingMembers
}