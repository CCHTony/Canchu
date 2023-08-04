const mysql = require('mysql2/promise'); 

let database;
if(process.env.NODE_ENV === 'develop'){
    database = process.env.DATABASE;
}
else if(process.env.NODE_ENV === 'test'){
    database = process.env.DATABASEFORTEST;
}

const connectionPromise =  mysql.createPool({
    host: 'mysql',
    user: 'user',
    password: process.env.PASSWORD,
    database: database
});


module.exports = {
    connectionPromise
};
