const mysql = require('mysql2/promise'); 

const connectionPromise =  mysql.createConnection({
    host: 'localhost',
    user: 'user',
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});


module.exports = {
    connectionPromise
};
