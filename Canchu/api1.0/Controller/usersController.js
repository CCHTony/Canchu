// 引入所需的模組和套件
const jwt = require('jsonwebtoken'); // 引入 JSON Web Token 套件，用於處理身份驗證
const crypto = require('crypto'); // 引入 crypto 套件，用於加密處理

// 引入資料庫連線
const connectionPromise = require('../models/mysql').connectionPromise;
const { usersSignup } = require('../models/usersModel');
 // 引入自訂的 Redis 功能模組
const { redisSearch, redisSet, redisDelete, checkEmailRegex } = require('../utils/function');


// 使用者註冊 API
async function Signup(req, res){
	const { name, email, password } = req.body;

	// 檢查必填欄位是否都有輸入
	if (!name || !password || !email) {
		return res.status(400).json({ error: 'All fields must be entered.' });
	}

	// 檢查 email 格式是否正確
  if (!checkEmailRegex(email)) {
		return res.status(400).json({ error: 'Invalid email address.' });
	}

  const result = usersSignup(name, email, password);
  if(result.status !== 200){
    return res.status(result.status).json(result.message);
  }
  const id = result.id;

	// 創建用於 JWT 的 payload
	const payload = {
		"id": id,
		"name": name,
		"email": email,
		"provider": 'native',
		"picture": null
	};

	// 創建包含註冊資訊和 JWT 的回應
	const response = {
		'data': {
			'access_token': jwt.sign(payload, process.env.SECRETKEY, { expiresIn: '1 day' }),
			"user": {
				payload
			}
		}
	};
	return res.json(response);
}
// 使用者登入 API
async function Signin(req, res){
	const connection = await connectionPromise;
  const provider = req.body.provider;

  // 檢查是否提供了 provider 參數
  if (!provider) {
    return res.status(400).json({ error: 'All fields must be entered.' });
  }

  if (provider === 'native') {
    // 如果使用本地登入方式
    const email = req.body.email;
    const password = req.body.password;

    // 檢查必填欄位是否都有輸入
    if (!email || !password) {
      return res.status(400).json({ error: 'All fields must be entered.' });
    }

    // 查詢使用者是否存在
    const signinQuery = 'SELECT * FROM users WHERE email = ?';
    const [is_exist] = await connection.execute(signinQuery, [email]);
    if (is_exist.length === 0) {
      return res.status(403).json({ error: 'User Not Found' })
    }

    // 驗證密碼是否正確
    const user = is_exist[0];
    const PASSWORD = user.password;
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    if (PASSWORD !== hashedPassword) {
      return res.status(403).json({ error: 'Wrong Password' });
    }

    // 產生 JWT 的 payload
    const id = user.id;
    const name = user.name;
    const picture = user.picture;
    const payload = {
      "id": id,
      "name": name,
      "email": email,
      "provider": 'native',
      "picture": picture
    };

    // 回傳登入成功的回應，包含 JWT 和使用者資訊
    const response = {
      'data': {
        'access_token': jwt.sign(payload, process.env.SECRETKEY, { expiresIn: '1 day' }),
        "user": {
          "id": id,
          "provider": 'native',
          "name": name,
          "email": email,
          "picture": picture
        }
      }
    };
    res.json(response);
  }
  else if (provider === 'facebook') {
    // 如果使用 Facebook 登入方式
    const access_token = req.body.access_token;

    // 使用 access_token 向 Facebook API 取得使用者資訊
    const url = `https://graph.facebook.com/v17.0/me?fields=id,name,email,picture{url}&access_token=${access_token}`;
    const user = await (await fetch(url)).json();
    const { name, email } = user;
    const picture = user.picture.data.url;

    // 檢查是否已使用本地方式註冊過
    let userQuery = 'SELECT email FROM users WHERE email = ?';
    const [is_signup] = await connection.execute(userQuery, [email]);
    if (is_signup.length != 0) {
      return res.status(403).json({ error: 'This account is signup by native, please login by native' });
    }

    // 將使用者資訊新增至資料庫
    let facebookQuery = 'INSERT INTO users(name, email, password, picture, provider) VALUES(?,?,?,?,?)';
    const [signup] = await connection.execute(facebookQuery, [name, email, '', picture, 'facebook']);
    let id = signup.insertId;

    // 回傳登入成功的回應，包含 access_token 和使用者資訊
    const response = {
      'data': {
        'access_token': access_token,
        "user": {
          "id": id,
          "provider": 'facebook',
          "name": name,
          "email": email,
          "picture": picture
        }
      }
    };
    res.json(response);
  }
  else {
    // 如果 provider 參數錯誤
    res.status(403).json({ error: 'Wrong provider' });
  }
}
// 取得使用者個人資料 API
async function getProfile(req, res){
	const connection = await connectionPromise;
	const user_id = Number(req.params.id);
	const my_id = req.decoded.id;
	const profile_key = `profile_${user_id}`;
	const friendship_key = `friendship_${my_id}_${user_id}`;
	let friendship = null;

	// 查詢使用者個人資料及與當前使用者的好友關係
	const Query =
	`
	SELECT
		users.id,
		users.name,
		users.picture,
		users.intro,
		users.tags,
		(
			SELECT COUNT(*) 
			FROM friendship 
			WHERE (sender_id = users.id OR receiver_id = users.id) AND is_friend = 1
		) AS friend_count,
		friendship.id AS friendship_id,
		friendship.is_friend AS status,
		friendship.sender_id,
		friendship.receiver_id
	FROM users
	LEFT JOIN friendship 
	ON (sender_id = users.id OR receiver_id = users.id) AND (sender_id = ? OR receiver_id = ?)
	WHERE users.id = ?
	`;

	// 從快取中查詢使用者資料和好友關係
	const profile_cachedResult = await redisSearch(profile_key);
	const friendship_cachedResult = await redisSearch(friendship_key);

	// 若資料存在於快取中，則直接回傳快取中的資料
	if (profile_cachedResult !== null && friendship_cachedResult !== null) {
		const response = {
			data: {
				user: {
					id: profile_cachedResult.id,
					name: profile_cachedResult.name,
					picture: profile_cachedResult.picture,
					friend_count: profile_cachedResult.friend_count,
					introduction: profile_cachedResult.introduction,
					tags: profile_cachedResult.tags,
					friendship: friendship_cachedResult.friendship,
				}
			}
		};
		return res.json(response);
	}

  // 從資料庫中查詢使用者個人資料及好友關係
  const result = (await connection.execute(Query, [my_id, my_id, user_id]))[0][0];

  // 若當前使用者不是查詢的使用者本人，則處理好友關係
  if (my_id !== user_id) {
    if (result.friendship_id) {
      if (result.status === 1) {
        friendship = {
          id: result.friendship_id,
          status: 'friend',
        };
      }
      else {
        if (result.sender_id === my_id) {
          friendship = {
            id: result.friendship_id,
            status: 'requested',
          };
        }
        else {
          friendship = {
            id: result.friendship_id,
            status: 'pending',
          };
        }
      }
    }
  }

  // 構造回傳的資料並設置快取
  const response = {
    data: {
      user: {
        id: user_id,
        name: result.name,
        picture: result.picture,
        friend_count: result.friend_count,
        introduction: result.intro,
        tags: result.tags,
        friendship: friendship,
      }
    }
  };
  const profile_info = {
    id: user_id,
    name: result.name,
    picture: result.picture,
    friend_count: result.friend_count,
    introduction: result.intro,
    tags: result.tags,
  };
  const friendship_info = {
    friendship: friendship,
  };
  await redisSet(profile_key, profile_info);
  await redisSet(friendship_key, friendship_info);
  return res.json(response);
}
// 更新使用者個人資料 API
async function updateProfile(req, res){
	const connection = await connectionPromise;
	const id = req.decoded.id; // 從解碼的存取權杖中獲取當前使用者的 ID
	const profile_key = `profile_${id}`;
	const { name, introduction, tags } = req.body; // 從請求的資料中獲取要更新的使用者資料

  const updateQuery = 'UPDATE users SET name = ?, intro = ?, tags = ? where id = ?';

  // 執行 SQL 查詢以更新使用者資料
  const [rows] = await connection.execute(updateQuery, [name, introduction, tags, id]);

  // 構造回傳的資料，只回傳使用者 ID
  const response = {
    "data": {
      "user": {
        "id": id
      }
    }
  };

  // 在更新成功後，刪除快取中的使用者資料
  await redisDelete(profile_key);

  // 回傳成功回應
  return res.json(response);
};
// 更新使用者個人頭像 API
async function updatePicture(req, res){
	const connection = await connectionPromise;
	const id = req.decoded.id; // 從解碼的存取權杖中獲取當前使用者的 ID
	const picture = req.file; // 從請求中獲取上傳的頭像檔案
	const profile_key = `profile_${id}`;

  const url = `https://52.64.240.159/${picture.filename}`; // 頭像檔案的 URL 地址
  const updateQuery = 'UPDATE users SET picture = ? WHERE id = ?';

  // 執行 SQL 查詢以更新使用者的頭像 URL
  const [rows] = await connection.execute(updateQuery, [url, id]);

  // 構造回傳的資料，回傳更新後的頭像 URL
  response = {
    data: {
      picture: url
    }
  }

  // 在更新成功後，刪除快取中的使用者資料
  await redisDelete(profile_key);

  // 回傳成功回應
  return res.json(response);
}
// 使用者搜尋 API
async function Search(req, res){
	const connection = await connectionPromise;
	const my_id = req.decoded.id; // 從解碼的存取權杖中獲取當前使用者的 ID
	const keyword = `%${req.query.keyword}%`; // 從請求中取得搜尋的關鍵字，並加上通配符 %

	console.log(keyword); // 輸出搜尋的關鍵字至後端的控制台

	let searchQuery = 
	`
		SELECT 
			users.id AS user_id, 
			users.name, 
			users.picture, 
			friendship.id AS friendship_id, 
			friendship.is_friend, 
			friendship.sender_id, 
			friendship.receiver_id 
		FROM users LEFT JOIN friendship 
		ON (users.id = friendship.sender_id AND friendship.receiver_id = ?) OR (users.id = friendship.receiver_id AND friendship.sender_id = ?) 
		WHERE name LIKE ? AND users.id <> ?
	`;


  // 執行 SQL 查詢以搜尋符合條件的使用者
  const [search_result] = await connection.execute(searchQuery, [my_id, my_id, keyword, my_id]);

  // 將搜尋結果轉換為指定格式的使用者陣列
  const userArr = search_result.map((user) => {
    let friendship = null;
    if (user.is_friend === 1) {
      friendship = {
        id: user.friendship_id,
        status: 'friend'
      }
    }
    else if (user.sender_id === my_id) {
      friendship = {
        "id": user.friendship_id,
        "status": "requested"
      };
    }
    else if(user.receiver_id === my_id){
      friendship = {
        "id": user.friendship_id,
        "status": "pending"
      };
    }
    return {
      id: user.user_id,
      name: user.name,
      picture: user.picture,
      friendship: friendship
    };
  });
  
  // 構造回傳的資料，回傳搜尋結果的使用者陣列
  const response = {
    "data": {
      "users": userArr
    }
  }

  // 回傳成功回應
  return res.json(response);
}


module.exports = {
  Signup,
  Signin,
  getProfile,
  updateProfile,
  updatePicture,
  Search
}
