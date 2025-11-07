const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');

router.get('/health', systemController.getSystemHealth);
router.get('/mobile-money-status', systemController.getMobileMoneyStatus);

module.exports = router;