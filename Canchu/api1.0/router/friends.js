const express = require('express');
const router = express.Router();


const { getFriend, sendFriendRequest, getFriendRequest, agreeFriendRequest, deleteFriend} = require('../Controller/friendsController')

const verifyAccesstoken = require('../models/function').verifyAccesstoken;

const TryErr = require('../utils/TryandError').TryErr;


router.get('/', verifyAccesstoken, (req, res) => TryErr(getFriend(req, res), res));

router.post('/:user_id/request', verifyAccesstoken, (req, res) => TryErr(sendFriendRequest(req, res), res));

router.get('/pending', verifyAccesstoken, (req, res) => TryErr(getFriendRequest(req, res), res));

router.post('/:friendship_id/agree', verifyAccesstoken, (req, res) => TryErr(agreeFriendRequest(req, res), res));

router.delete('/:friendship_id', verifyAccesstoken, (req, res) => TryErr(deleteFriend(req, res), res));

module.exports = router;