const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin, requireAgentOrAbove } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/dashboard', requireAgentOrAbove, adminController.getDashboard);
router.get('/declarations/pending', requireAgentOrAbove, adminController.getPendingDeclarations);
router.patch('/declarations/:declarationId/validate', requireAgentOrAbove, adminController.validateDeclaration);
router.post('/nif/validate', requireAdmin, adminController.validateNIF);
router.get('/users', requireAdmin, adminController.getAllUsers);
router.patch('/payments/:paymentId/confirm', requireAdmin, adminController.confirmPaymentManual);
router.get('/export/:type', requireAdmin, adminController.exportData);
router.get('/summary', requireAdmin, adminController.getSummary);
router.get('/export/:type', requireAdmin, adminController.exportData);
module.exports = router;

