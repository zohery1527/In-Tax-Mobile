const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Routes utilisateur
router.get('/', authenticateToken, notificationController.getUserNotifications);
router.put('/:notificationId/read', authenticateToken, notificationController.markAsRead);
router.put('/read-all', authenticateToken, notificationController.markAllAsRead);

// Route admin pour générer les rappels
router.post('/generate-reminders', authenticateToken, requireRole(['ADMIN']), notificationController.generateReminders);

module.exports = router;