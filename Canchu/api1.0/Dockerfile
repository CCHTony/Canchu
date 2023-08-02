# 使用 Node.js 官方映像作為基本映像
FROM node:20.4-alpine

# 將工作目錄設置為/app
WORKDIR /app

# 複製 Canchu 專案代碼到容器內的/app目錄
COPY . .

# 安裝 Canchu 專案的依賴項
RUN npm install

# 聲明容器將監聽的端口
EXPOSE 3000
