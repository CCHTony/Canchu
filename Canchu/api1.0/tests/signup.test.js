const request = require('supertest');
const {app} = require('../server'); // 引入你的 Express 應用程式


beforeAll(() => {
  server = app.listen(3000, () => {
    console.log('Server is running');
  });
});

afterAll((done) => {
  server.close(done);
});

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
  });

  // 可以新增更多的測試用例，測試不同情境下的 API 行為
});

