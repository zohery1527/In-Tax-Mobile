const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.get('/zones', authController.getAllzone);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/resend-otp', authController.resendOtp);
router.post('/verify-otp', authController.verifyOTP);
router.get('/profile', authenticateToken, authController.getProfile);
router.get('/me', authenticateToken, authController.getProfile);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authenticateToken, authController.logout);
router.put('/profile', authenticateToken, authController.updateProfile);
module.exports = router;
