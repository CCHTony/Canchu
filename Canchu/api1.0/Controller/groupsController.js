// 創建與資料庫的連線 (connection promise)
const connectionPromise = require('../models/mysql').connectionPromise;

// 新增帖子的路由處理函式
async function createGroup(req, res){
	const connection = await connectionPromise; // 創建與資料庫的連線 (connection promise)
	const my_id = req.decoded.id; // 從解碼的存取權杖中獲取當前使用者的 ID
	const groupName = req.body.name; // 從請求中取得名字

	const groupNameQuery = 'SELECT groups_info.name FROM groups_info WHERE name = ?';
	const [rows] = await connection.execute(groupNameQuery, [groupName]);
	if (rows.length != 0) {
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


module.exports = {
  createGroup,

}