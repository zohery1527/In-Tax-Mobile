const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// === ROUTES UTILISATEUR (VENDEURS) ===
router.get('/', authenticateToken, notificationController.getUserNotifications);
router.put('/:notificationId/read', authenticateToken, notificationController.markAsRead);
router.put('/read-all', authenticateToken, notificationController.markAllAsRead);

// === ROUTES ADMIN ===
router.post('/generate-reminders', authenticateToken, requireRole(['ADMIN']), notificationController.generateReminders);
router.delete('/cleanup-expired', authenticateToken, requireRole(['ADMIN']), notificationController.cleanupExpired);

// === NOUVELLES ROUTES ADMIN ===
router.post('/run-monthly-reminders', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const result = await require('../jobs/notificationJobs').runMonthlyReminders();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/run-check-missing', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const result = await require('../jobs/notificationJobs').runCheckMissingDeclarations();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/run-notify-late', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const result = await require('../jobs/notificationJobs').runNotifyLateDeclarations();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;