const request = require('supertest');
const {app} = require('../server'); // 引入你的 Express 應用程式

// beforeAll(async () => {
//   // 啟動應用程式
//   server = app.listen(3000, () => {
//     console.log(`Server is running on port ${port}`);
//   });
// });

afterAll((done) => {
  // 關閉應用程式並釋放端口
  app.listen(3000).close(done);
});

// 成功註冊
describe('Signin', () => {
  it('login and return user data', async () => {
    // 模擬請求的使用者資料
    const userData = {
      provider: "native",
      email: "john123456.doe@example.com",
      password: "password123"
    };

    // 在這裡使用 supertest 來發送 POST 請求，模擬使用者註冊
    const res = await request(app)
      .post('/api/1.0/users/signin')
      .send(userData);

    // 確認伺服器回應的狀態碼是否正確
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('access_token');
    expect(res.body.data).toHaveProperty('user');
    expect(res.body.data.user.provider).toBe(userData.provider);
    expect(res.body.data.user.email).toBe(userData.email);
  });
});

// 資料缺失
describe('missing provider', () => {
  it('res.status 400', async () => {
    // 模擬請求的使用者資料
    const userData = {
      email: 'john123456.doe@example.com',
      password: 'password123',
    };

    // 在這裡使用 supertest 來發送 POST 請求，模擬使用者註冊
    const res = await request(app)
      .post('/api/1.0/users/signin')
      .send(userData);

    // 確認伺服器回應的狀態碼是否正確
    expect(res.status).toBe(400);
  });
});

// 資料缺失
describe('missing email', () => {
  it('res.status 400', async () => {
    // 模擬請求的使用者資料
    const userData = {
      provider: "native",
      password: "password123"
    };

    // 在這裡使用 supertest 來發送 POST 請求，模擬使用者註冊
    const res = await request(app)
      .post('/api/1.0/users/signin')
      .send(userData);

    // 確認伺服器回應的狀態碼是否正確
    expect(res.status).toBe(400);
  });
});

// 資料缺失
describe('missing password', () => {
  it('res.status 400', async () => {
    // 模擬請求的使用者資料
    const userData = {
      provider: "native",
      email: "john123456.doe@example.com",
    };

    // 在這裡使用 supertest 來發送 POST 請求，模擬使用者註冊
    const res = await request(app)
      .post('/api/1.0/users/signin')
      .send(userData);

    // 確認伺服器回應的狀態碼是否正確
    expect(res.status).toBe(400);
  });
});


// 無此使用者
describe('user not found', () => {
  it('res.status 403', async () => {
    // 模擬請求的使用者資料
    const userData = {
      name: 'none',
      email: 'nobody@example.com',
      password: 'password123',
    };

    // 在這裡使用 supertest 來發送 POST 請求，模擬使用者註冊
    const res = await request(app)
      .post('/api/1.0/users/signin')
      .send(userData);

    // 確認伺服器回應的狀態碼是否正確
    expect(res.status).toBe(403);
  });
});

// 密碼錯誤
describe('wrong password', () => {
  it('res.status 403', async () => {
    // 模擬請求的使用者資料
    const userData = {
      provider: "native",
      email: "john123456.doe@example.com",
      password: "wrong"
    };

    // 在這裡使用 supertest 來發送 POST 請求，模擬使用者註冊
    const res = await request(app)
      .post('/api/1.0/users/signin')
      .send(userData);

    // 確認伺服器回應的狀態碼是否正確
    expect(res.status).toBe(403);
  });
});