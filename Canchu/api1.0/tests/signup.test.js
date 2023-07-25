const request = require('supertest');
const {app} = require('../server'); // 引入你的 Express 應用程式
const crypto = require('crypto');


// 測試使用者註冊 API
describe('Signup API', () => {
  it('should register a new user and return access_token and user data', async () => {
    // 模擬請求的使用者資料
    const userData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123',
    };

    // 在這裡使用 supertest 來發送 POST 請求，模擬使用者註冊
    const res = await request(app)
      .post('/api/1.0/users/signup')
      .send(userData);

    // 確認伺服器回應的狀態碼是否正確
    expect(res.status).toBe(200);

    // 確認伺服器回應的 JSON 格式是否正確
    expect(res.body).toBeDefined();
    expect(res.body.data).toBeDefined();
    expect(res.body.data.access_token).toBeDefined();
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.id).toBeDefined();
    expect(res.body.data.user.name).toBe(userData.name);
    expect(res.body.data.user.email).toBe(userData.email);
    expect(res.body.data.user.provider).toBe('native');

    // 確認加密後的密碼是否正確
    const hashedPassword = crypto.createHash('sha256').update(userData.password).digest('hex');
    expect(res.connection.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO users'),
      expect.arrayContaining([userData.name, userData.email, hashedPassword, null, 'native'])
    );
  });

  // 可以新增更多的測試用例，測試不同情境下的 API 行為
});
