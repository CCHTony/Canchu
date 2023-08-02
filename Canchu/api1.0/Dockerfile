# 使用 Node.js 官方映像作為基本映像
FROM node:20.4-alpine

# 將工作目錄設置為/app
WORKDIR /app

# 複製 Canchu 專案的依賴項描述檔到容器內的/app目錄
COPY package.json package-lock.json* /app/

# 安裝 Canchu 專案的依賴項
RUN npm install

# 複製 Canchu 專案代碼到容器內的/app目錄
COPY . /app

# 聲明容器將監聽的端口
EXPOSE 3000

# 指定容器運行時的命令
CMD ["npm", "start"]
