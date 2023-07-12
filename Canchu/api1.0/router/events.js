const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// create the connection nod to database
const connection = require('../models/mysql').connection;






module.exports = router;