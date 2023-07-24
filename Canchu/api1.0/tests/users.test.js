const request = require('supertest'); // 引入 supertest 来发送请求
const express = require('express'); // 引入 Express 框架
const app = express(); // 创建 Express 应用

// 引入 router 文件，注意这里需要修改文件路径
const router = require('../router/users');

// 将路由添加到应用中
app.use('/', router);

describe('Signup API', () => {
  // 测试注册成功的情况
  it('should register a new user and return access_token and user data', async () => {
    const newUser = {
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: 'secretpassword',
    };

    // 使用 supertest 发送 POST 请求
    const response = await request(app)
      .post('/signup')
      .send(newUser);

    // 断言返回状态码为 200
    expect(response.status).toBe(200);

    // 断言返回结果中包含 access_token 和 user 数据
    expect(response.body.data).toHaveProperty('access_token');
    expect(response.body.data.user).toHaveProperty('id');
    expect(response.body.data.user.name).toBe(newUser.name);
    expect(response.body.data.user.email).toBe(newUser.email);
    expect(response.body.data.user.provider).toBe('native');
    expect(response.body.data.user.picture).toBe(null);
  });

  // 测试必填字段缺失的情况
  it('should return 400 status and error message for missing fields', async () => {
    const newUser = {
      email: 'johndoe@example.com',
      password: 'secretpassword',
    };

    const response = await request(app)
      .post('/signup')
      .send(newUser);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('All fields (name, email, password) must be entered.');
  });

  // 测试无效的 email 地址
  it('should return 400 status and error message for invalid email address', async () => {
    const newUser = {
      name: 'John Doe',
      email: 'invalidemail',
      password: 'secretpassword',
    };

    const response = await request(app)
      .post('/signup')
      .send(newUser);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid email address.');
  });

  // 测试已存在的 email 地址
  it('should return 403 status and error message for duplicate email address', async () => {
    const newUser = {
      name: 'John Doe',
      email: 'existingemail@example.com',
      password: 'secretpassword',
    };

    const response = await request(app)
      .post('/signup')
      .send(newUser);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('It should not be possible to register with a duplicate email.');
  });
});
