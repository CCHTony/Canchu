const crypto = require('crypto'); // 引入 crypto 套件，用於加密處理

// 引入資料庫連線
const connectionPromise = require('../models/mysql').connectionPromise;


async function usersSignup(name, email, password){
  const connection = await connectionPromise;
  // 檢查是否已經有相同的 email 註冊過
	const userQuery = 'SELECT email FROM users WHERE email = ?';
	const [rows] = await connection.execute(userQuery, [email]);
	if (rows.length != 0) {
    const error = {
      message:{
        error: 'It should not be possible to register with a duplicate email.'
      },
      status:403
    }
		return error
	}
	// 使用 crypto 加密密碼
	const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

	// 執行註冊的 SQL 
	const signupQuery = 'INSERT INTO users(name, email, password, picture, provider) VALUES(?,?,?,?,?)';
	const [results] = await connection.execute(signupQuery, [name, email, hashedPassword, null, 'native']);
  const sucess = {
    id:results.insertId,
    status:200
  }
  return sucess
}

module.exports = {
  usersSignup
}