const mysql = require('mysql2/promise'); 


const connection = mysql.createConnection({
    host: 'localhost',
    user: 'user',
    password: process.env.PASSWORD,
    database: 'canchu'
});

module.exports = {
    connection
};