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

async function getConversationMessages(req, res) {
  const connection = await connectionPromise; // 創建與資料庫的連線 (connection promise)
  const user_id = req.params.user_id; // 從請求中取得用戶 ID
  const my_id = req.decoded.id; // 從解碼的存取權杖中獲取當前使用者的 ID
  const cursor = req.query.cursor; // 從請求中取得游標

  // 檢查用戶是否存在
  const checkUserQuery = 'SELECT id FROM users WHERE id = ?';
  const [userRows] = await connection.execute(checkUserQuery, [user_id]);

  // 如果用戶不存在，返回 400 錯誤
  if (userRows.length === 0) {
    return res.status(400).json({ error: 'User not found.' });
  }

  let getMessagesQuery;
  let queryParams = [my_id, user_id, user_id, my_id];

  // If cursor is provided, use it for pagination
  if (cursor) {
    const decodedCursor = parseInt(atob(cursor));
    getMessagesQuery = `
      SELECT 
        messages.id,
        messages.message,
        DATE_FORMAT(CONVERT_TZ(messages.created_at, '+00:00', '+08:00'), "%Y-%m-%d %H:%i:%s") AS created_at,
        users.id AS user_id,
        users.name AS user_name,
        users.picture AS user_picture
      FROM messages
      JOIN users ON messages.sender_id = users.id 
      WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
        AND messages.id <= ?
      ORDER BY messages.id DESC
      LIMIT 11`;

    queryParams.push(decodedCursor);
  } else {
    // If cursor is not provided, fetch the first page
    getMessagesQuery = `
      SELECT 
        messages.id,
        messages.message,
        DATE_FORMAT(CONVERT_TZ(messages.created_at, '+00:00', '+08:00'), "%Y-%m-%d %H:%i:%s") AS created_at,
        users.id AS user_id,
        users.name AS user_name,
        users.picture AS user_picture
      FROM messages
      JOIN users ON messages.sender_id = users.id
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
      ORDER BY messages.id DESC
      LIMIT 11`;
  }

  const [messageRows] = await connection.execute(getMessagesQuery, queryParams);

  // Check if there are more messages for the next page
  let next_cursor = null;
  if (messageRows.length === 11) {
    const lastMessageId = messageRows[10].id;
    const encodedCursor = btoa(lastMessageId.toString());
    next_cursor = encodedCursor;
  }

  // Format the retrieved message data
  const messages = messageRows.map((message) => {
    return {
      id: message.id,
      message: message.message,
      created_at: message.created_at,
      user: {
        id: message.user_id,
        name: message.user_name,
        picture: message.user_picture,
      },
    };
  });
  const display_messages = messages.slice(0, 10);
  const results = {
    data: {
      messages: display_messages,
      next_cursor: next_cursor,
    },
  };

  return res.status(200).json(results);
}


module.exports = {
  sendMessage,
  getConversationMessages
}