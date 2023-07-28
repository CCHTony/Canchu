// 創建與資料庫的連線 (connection promise)
const connectionPromise = require('../models/mysql').connectionPromise;

async function sendMessage(req, res) {
  const connection = await connectionPromise; // 創建與資料庫的連線 (connection promise)
  const receiver_id = req.params.user_id; // 從請求中取得接收者的用戶 ID
  const sender_id = req.decoded.id; // 從解碼的存取權杖中獲取當前使用者的 ID
  const message = req.body.message; // 從請求中取得訊息內容

  // 檢查接收者是否存在
  const checkReceiverQuery = 'SELECT id FROM users WHERE id = ?';
  const [receiverRows] = await connection.execute(checkReceiverQuery, [receiver_id]);

  // 如果接收者不存在，返回 400 錯誤
  if (receiverRows.length === 0) {
    return res.status(400).json({ error: 'Receiver not found.' });
  }

  // 執行儲存訊息的 SQL 
  const sendMessageQuery = 'INSERT INTO messages(sender_id, receiver_id, message) VALUES(?,?,?)';
  const [messageResult] = await connection.execute(sendMessageQuery, [sender_id, receiver_id, message]);

  const results = {
    "data": {
      "message": {
        "id": messageResult.insertId
      }
    }
  };

  return res.json(results);
}


module.exports = {
  sendMessage,
  
}