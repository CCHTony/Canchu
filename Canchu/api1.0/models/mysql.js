const mysql = require('mysql2/promise'); 


const connectionPromise =  mysql.createPool({
    host: 'mysql',
    user: 'user',
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});


module.exports = {
    connectionPromise
};
