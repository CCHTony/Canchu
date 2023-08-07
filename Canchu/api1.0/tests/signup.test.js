const request = require('supertest');
const app = require('../server'); // 引入你的 Express 應用程式

// let server;

// beforeAll(() => {
//   // 啟動應用程式
//   server = app.listen(3000, () => {
//     console.log(`Server is running on port 3000`);
//   });
// });

// afterAll((done) => {
//   // 關閉應用程式並釋放端口
//   server.close(done);
// });

// 成功註冊
describe('Signup', () => {
  it('should register a new user and return user data', async () => {
    // 模擬請求的使用者資料
    const userData = {
      name: 'John Doe',
      email: 'john123456.doe@example.com',
      password: 'password123',
    };

    // 在這裡使用 supertest 來發送 POST 請求，模擬使用者註冊
    const res = await request(app)
      .post('/api/1.0/users/signup')
      .send(userData);

    // 確認伺服器回應的狀態碼是否正確
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('access_token');
    expect(res.body.data).toHaveProperty('user');
    expect(res.body.data.user.name).toBe(userData.name);
    expect(res.body.data.user.email).toBe(userData.email);
    expect(res.body.data.user.provider).toBe('native');
    expect(res.body.data.user.picture).toBeNull();
  });
});

// 資料缺失
describe('missing field', () => {
  it('should register a new user and return user data', async () => {
    // 模擬請求的使用者資料
    const userData = {
      email: 'joh1n.doe@example.com',
      password: 'password123',
    };

    // 在這裡使用 supertest 來發送 POST 請求，模擬使用者註冊
    const res = await request(app)
      .post('/api/1.0/users/signup')
      .send(userData);

    // 確認伺服器回應的狀態碼是否正確
    expect(res.status).toBe(400);
  });
});

// 重複註冊
describe('Signup again', () => {
  it('should register a new user and return user data', async () => {
    // 模擬請求的使用者資料
    const userData = {
      name: 'John Doe',
      email: 'john123456.doe@example.com',
      password: 'password123',
    };

    // 在這裡使用 supertest 來發送 POST 請求，模擬使用者註冊
    const res = await request(app)
      .post('/api/1.0/users/signup')
      .send(userData);

    // 確認伺服器回應的狀態碼是否正確
    expect(res.status).toBe(403);
  });
});

// 信箱錯誤
describe('wrong email', () => {
  it('should register a new user and return user data', async () => {
    // 模擬請求的使用者資料
    const userData = {
      name: 'John Doe',
      email: 'john123456.doeexample.com',
      password: 'password123',
    };

    // 在這裡使用 supertest 來發送 POST 請求，模擬使用者註冊
    const res = await request(app)
      .post('/api/1.0/users/signup')
      .send(userData);

    // 確認伺服器回應的狀態碼是否正確
    expect(res.status).toBe(400);
  });
});