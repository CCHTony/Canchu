const mysql = require('mysql2/promise'); 


const connectionPromise =  mysql.createPool({
    host: 'canchu-database.cknspj9yw05b.ap-southeast-2.rds.amazonaws.com',
    user: 'user',
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});


module.exports = {
    connectionPromise
};
