const express = require('express');
const router = express.Router();
const smsController = require('../controllers/smsController');

router.post('/receive', smsController.handleAndroidSMS);

module.exports = router;