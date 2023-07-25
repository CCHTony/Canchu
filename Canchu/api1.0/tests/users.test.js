// 引入 supertest 和 Express 應用程式
const request = require('supertest');
const app = require('../app'); // 假設你的 Express 應用程式在 app.js 中

// 使用 jest.fn() 模擬資料庫連線的相關函式
jest.mock('../models/mysql', () => {
  return {
    connectionPromise: jest.fn(() => {
      // 在這裡模擬資料庫連線
      // 例如，你可以返回一個假的連線對象，只需包含你測試中需要的方法即可
      return {
        execute: jest.fn(async (query, params) => {
          // 假設在測試中你要模擬的 SQL 查詢結果
          if (query.startsWith('SELECT email')) {
            return [[], null]; // 返回一個空的結果
          } else if (query.startsWith('INSERT INTO users')) {
            // 返回一個假的插入結果
            return [{ insertId: 1 }, null];
          }
        }),
      };
    }),
  };
});

// 使用 jest.fn() 模擬 JSON Web Token 簽發函式
jest.mock('jsonwebtoken', () => {
  return {
    sign: jest.fn(() => {
      // 在這裡模擬簽發 JWT 的過程
      // 例如，你可以返回一個假的 JWT
      return 'fake_jwt_token';
    }),
  };
});

describe('Signup API', () => {
  it('should register a new user and return access_token and user data', async () => {
    // 準備要測試的請求資料
    const requestData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'test123',
    };

    // 使用 supertest 發送 POST 請求
    const response = await request(app)
      .post('/signup')
      .send(requestData);

    // 驗證回應
    expect(response.status).toBe(200);
    expect(response.body.data.access_token).toBe('fake_jwt_token');
    expect(response.body.data.user).toEqual({
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      provider: 'native',
      picture: null,
    });

    // 驗證模擬的資料庫連線函式是否被呼叫過
    const { connectionPromise } = require('../models/mysql');
    expect(connectionPromise).toHaveBeenCalled();
  });
});
