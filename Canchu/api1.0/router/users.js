const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');
const multer = require('multer');


// create the connection nod to database
const connection = require('../models/mysql').Connect

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now()
        cb(null, file.fieldname + '-' + uniqueSuffix + '.jpg')
    }
})
const upload = multer({ storage: storage })


router.post('/signup', async(req, res) => {
    try{
        const { name, email, password } = req.body;
        if(!name || !password || !email){
            res.status(400).json({error : 'All fields (name, email, password) must be entered.'});
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
            res.status(400).json({error : 'Invalid email address.'});
            return;
        }
        let mysQuery = 'SELECT `email` FROM `users` WHERE `email` = ?';
        const [rows] = await connection.execute(mysQuery, [email]);
        if(rows.length != 0){
            res.status(403).json({error : 'It should not be possible to register with a duplicate email.'});
            return;
        }
        mysQuery = 'INSERT INTO `users`(`name`, `email`, `password`, `picture`, `provider`) VALUES(?,?,?,?,?)';
        const [results] = await connection.execute(mysQuery, [name, email, password, null, 'native']);
        let id = results.insertId;
        let payload = {
                "id": id,
                "name": name,
                "email": email,
                "password":password,
                "provider": 'native',
                "picture": null
            };
        let result = {
            'data': {
                'access_token': jwt.sign(payload, process.env.SECRETKEY , { expiresIn: '1 day' }),
                "user": {
                    "id": id,
                    "name": name,
                    "email": email,
                    "provider": 'native',
                    "picture": null
                }
            }
        };
        res.json(result);
    }
    catch(err){
        res.status(500).json({ error:"Server Error."});
        console.log(err);
    }
});


router.post('/signin', async(req, res) => {
    try{
        const provider = req.body.provider;
        if(!provider){
            res.status(400).json({error : 'All fields must be entered.'});
            return;
        }
        if(provider === 'native'){
            const email = req.body.email;
            const password = req.body.password;
            if(!email || !password){
                res.status(400).json({error : 'All fields must be entered.'});
                return;
            }
            const mysqlQuery = 'SELECT * FROM `users` WHERE `email` = ?';
            const [rows] = await connection.execute(mysqlQuery, [email]);
            if(rows.length === 0){
                res.status(403).json({error : 'User Not Found'})
                return;
            }
            const user = rows[0];
            const PASSWORD = user.password;
            if(PASSWORD !== password){
                res.status(403).json({error : 'Wrong Password'});
                return;
            }
            const id = user.id;
            const name = user.name;
            const picture = user.picture;
            const payload = {
                "id": id,
                "name": name,
                "email": email,
                "password":password,
                "provider": 'native',
                "picture": picture
            };
            const result = {
                'data': {
                    'access_token': jwt.sign(payload, process.env.SECRETKEY , { expiresIn: '1 day' }),
                    "user": {
                        "id": id,
                        "provider": 'native',
                        "name": name,
                        "email": email,
                        "picture": picture
                    }
                }
            };
            res.json(result);
        }
        else if(provider === 'facebook'){
            const access_token = req.body.access_token;
            const url = `https://graph.facebook.com/v17.0/me?fields=id,name,email,picture{url}&access_token=${access_token}`;
            const user = await (await fetch(url)).json();
            const {name, email} = user;
            const picture = user.picture.data.url;
            let mysQuery = 'SELECT `email` FROM `users` WHERE `email` = ?';
            const [rows] = await connection.execute(mysQuery, [email]);
            if(rows.length != 0){
                res.status(403).json({error : 'This account is signup by native, please login by native'});
                return;
            }
            mysQuery = 'INSERT INTO `users`(`name`, `email`, `password`, `picture`, `provider`) VALUES(?,?,?,?,?)';
            const [results] = await connection.execute(mysQuery, [name, email, '', picture, 'facebook']);
            let id = results.insertId;
            const result = {
                'data': {
                    'access_token': access_token,
                    "user": {
                        "id": id,
                        "provider": 'facebook',
                        "name": name,
                        "email": email,
                        "picture": picture
                    }
                }
            };
            res.json(result);
        }
        else{
            res.status(403).json({error : 'Wrong provider'});
        }
    }
    catch(err){
        res.status(500).json({ error:"Server Error."});
        console.log(err);
    }
});


router.get('/:id/profile', async(req, res) => {
    const userId = Number(req.params.id);
    let token = req.headers.authorization;
    if(!token){
        res.status(401).json({error : 'No token'});
        return;
    }
    token = token.substring(7, token.length);
    try {
        var decoded = jwt.verify(token, process.env.SECRETKEY);
    } 
    catch(err) {
        res.status(403).json({error : 'Wrong token'});
        console.log(err);
        return;
    }
    const mysqlQuery = 'SELECT * FROM `users` WHERE `id` = ?';
    const [rows] = await connection.execute(mysqlQuery, [userId]);
    console.log(rows[0]);
    const results = {
        "data": {
          "user": {
            "id": userId,
            "name": rows[0].name,
            "picture": rows[0].picture,
            "friend_count": rows[0].friend_count,
            "introduction": rows[0].intro,
            "tags": rows[0].tags,
            "friendship": {
              "id": 0,
              "status": "requested"
            }
          }
        }
      };
    res.json(results);
});


router.put('/profile', async(req, res) => {
    let token = req.headers.authorization;
    if(!token){
        res.status(401).json({error : 'No token'});
        return;
    }
    token = token.substring(7, token.length);
    try {
        var decoded = jwt.verify(token, process.env.SECRETKEY);
    } 
    catch(err) {
        res.status(403).json({error : 'Wrong token'});
        console.log(err);
        return;
    }
    id = decoded.id;
    const { name, introduction, tags } = req.body;
    let mysQuery = 'update users set `name` = ?, `intro` = ?, `tags` = ? where `id` = ?';
    const [rows] = await connection.execute(mysQuery, [name, introduction, tags, id]);
    const result = {
        "data": {
            "user": {
                "id": id
            }
        }
    };
    res.json(result);
});


router.put('/picture', upload.single('picture'), async(req, res) => {
    let token = req.headers.authorization;
    if(!token){
        res.status(401).json({error : 'No token'});
        return;
    }
    token = token.substring(7, token.length);
    try {
        var decoded = jwt.verify(token, process.env.SECRETKEY);
    } 
    catch(err) {
        res.status(403).json({error : 'Wrong token'});
        console.log(err);
        return;
    }
    id = decoded.id;
    const picture = req.file;
    const url = `http://52.64.240.159/${picture.filename}`
    result = {
        "data": {
          "picture": url
        }
    }
    let mysQuery = 'update users set `picture` = ? where `id` = ?';
    const [rows] = await connection.execute(mysQuery, [url, id]);
    res.json(result);
});


module.exports = router;