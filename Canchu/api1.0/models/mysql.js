const mysql = require('mysql2/promise'); 

async function Connect(){
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'user',
        password: process.env.PASSWORD,
        database: 'canchu'
    });
    return connection;
}
const connection = Connect();

module.exports = {
    connection
};