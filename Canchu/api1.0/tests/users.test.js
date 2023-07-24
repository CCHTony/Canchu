// __tests__/router.test.js

const express = require('express');
const request = require('supertest');
const router = require('../router/users'); // 导入要测试的路由

jest.mock('../models/mysql', () => ({
  connectionPromise: Promise.resolve({
    // 模拟数据库连接的对象
    execute: jest.fn((query, params) => {
      // 模拟数据库查询，这里可以根据需要返回不同的测试数据
      if (query.startsWith('SELECT')) {
        // 模拟SELECT查询
        if (query.includes('users WHERE email = ?')) {
          // 模拟检查用户是否存在
          if (params[0] === 'existing@example.com') {
            return [[{ email: 'existing@example.com' }]]; // 用户已存在
          }
          return [[]]; // 用户不存在
        } else if (query.includes('users WHERE email = ? AND password = ?')) {
          // 模拟验证用户密码
          if (params[0] === 'existing@example.com' && params[1] === 'hashed_password') {
            return [[{ id: 1, name: 'Existing User', email: 'existing@example.com', password: 'hashed_password' }]]; // 用户密码正确
          }
          return [[]]; // 用户密码不正确
        }
      } else if (query.startsWith('INSERT INTO users')) {
        // 模拟插入新用户
        return [{ insertId: 2 }];
      } else if (query.startsWith('UPDATE users')) {
        // 模拟更新用户信息
        return [[{ id: 1 }]];
      }
      return [[]];
    }),
  }),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mocked_jwt'), // 模拟签发JWT的函数，返回一个假的JWT
}));

const app = express();
app.use(express.json());
app.use('/', router); // 在Express应用中使用我们的路由

describe('POST /signup', () => {
  it('should return 400 if missing required fields', async () => {
    const response = await request(app)
      .post('/signup')
      .send({});
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('All fields (name, email, password) must be entered.');
  });

  it('should return 400 if email format is invalid', async () => {
    const response = await request(app)
      .post('/signup')
      .send({ name: 'Test User', email: 'invalid_email', password: '123456' });
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('Invalid email address.');
  });

  it('should return 403 if email is already registered', async () => {
    const response = await request(app)
      .post('/signup')
      .send({ name: 'Test User', email: 'existing@example.com', password: '123456' });
    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe('It should not be possible to register with a duplicate email.');
  });

  it('should return 200 and JWT token if signup is successful', async () => {
    const response = await request(app)
      .post('/signup')
      .send({ name: 'New User', email: 'newuser@example.com', password: '123456' });
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.access_token).toBe('mocked_jwt'); // 使用模拟的JWT
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.user.id).toBe(2); // 使用模拟的插入用户的ID
    expect(response.body.data.user.name).toBe('New User');
    expect(response.body.data.user.email).toBe('newuser@example.com');
  });
});

