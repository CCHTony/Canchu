const express = require('express');
const router = express.Router();

const TryErr = require('../utils/TryandError').TryErr;

const { getEvent, readEvent } = require('../Controller/eventsController')

const verifyAccesstoken = require('../models/function').verifyAccesstoken;

router.get('/', verifyAccesstoken, (req, res) => TryErr(getEvent(req, res), res));

router.post('/:event_id/read', verifyAccesstoken, (req, res) => TryErr(readEvent(req, res), res));

module.exports = router;