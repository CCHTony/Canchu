const redis = require('../models/redis').redis;

const LIMIT_REQ = 11;
const LIMIT_TIME = 1;
const BLOCK_TIME = 30;

async function rateLimiter(req, res, next){
  const clientIp = req.header['X-Forwarded-For'];
  const key = `rate_limit_${clientIp}`;
  try {
    // 使用 INCR 命令對計數進行自增操作
    const currentCount = await redis.incr(key);

    if (currentCount === 1) {
      // 如果 IP 尚未有限制記錄，設置過期時間（一分鐘）
      await redis.expire(key, LIMIT_TIME);
    } 
    else if (currentCount > LIMIT_REQ) {
      // 超過限制，拒絕請求
      await redis.expire(key, BLOCK_TIME);
      return res.status(429).send('Too Many Requests');
    }
  } 
  catch (error) {
    console.error('Error in rate limiter:', error);
  }
  // 繼續處理請求
  next();
}

module.exports = {
  rateLimiter
}