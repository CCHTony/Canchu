const mysql = require('mysql2/promise'); 
require('dotenv').config(); // 載入 .env 檔案中的環境變數


const connectionPromise =  mysql.createPool({
    host: 'canchu-database.cknspj9yw05b.ap-southeast-2.rds.amazonaws.com',
    user: 'user',
    password: 'password',
    database: process.env.DATABASE
});


module.exports = {
    connectionPromise
};
