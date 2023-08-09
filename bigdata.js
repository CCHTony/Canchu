const crypto = require('crypto'); // 引入 crypto 套件，用於加密處理
// 引入資料庫連線
const connectionPromise = require('./Canchu/api1.0/models/mysql').connectionPromise;

const TIMES = 5000
const NAME = 'test'
const EMAIL = 'test@test.com'
const PASSWORD = 'test'


async function generateData(times){
  const connection = await connectionPromise;
  // 使用 crypto 加密密碼
	const hashedPassword = crypto.createHash('sha256').update(PASSWORD).digest('hex');
  // 註冊帳戶
	const signupQuery = 'INSERT INTO users(name, email, password, picture, provider) VALUES(?,?,?,?,?)';
	const [results] = await connection.execute(signupQuery, [NAME, EMAIL, hashedPassword, null, 'native']);
  const id = results.insertId

  for(let i = 0; i < times; i++){
    const postQuery = 'INSERT INTO posts (poster_id, created_at, context, like_count, comment_count) VALUES (?, NOW(), ?, ?, ?)';
    await connection.execute(postQuery, [id, i , 0, 0]); // 在資料庫中新增帖子
  }
}

generateData(TIMES);


