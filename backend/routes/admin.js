// routes/admin.js - VERSION CORRIGÉE
const express = require('express');
const router = express.Router();

// Import de tous les contrôleurs
const adminAuthController = require('../controllers/admin/adminAuthController');
const adminDashboardController = require('../controllers/admin/adminDashboardController');
const adminUserController = require('../controllers/admin/adminUserController');
const adminDeclarationController = require('../controllers/admin/adminDeclarationController');
const adminPaymentController = require('../controllers/admin/adminPaymentController');
const adminNIFController = require('../controllers/admin/adminNIFController');
const adminExportController = require('../controllers/admin/adminExportController');
const adminSystemController = require('../controllers/admin/adminSystemController');
const adminAuditController = require('../controllers/admin/adminAuditController');
const adminAuth = require('../middleware/adminAuth');

// 🔐 AUTHENTIFICATION
router.post('/login', adminAuthController.login);
router.get('/profile', adminAuth.authenticate, adminAuthController.getProfile);
router.put('/profile', adminAuth.authenticate, adminAuthController.updateProfile);

// 📊 DASHBOARD - ROUTES COMPLÈTES AJOUTÉES
router.get('/dashboard', 
  adminAuth.authenticate,
  adminAuth.requirePermission('dashboard:view'),
  adminDashboardController.getDashboard
);

router.get('/dashboard/charts', 
  adminAuth.authenticate,
  adminAuth.requirePermission('dashboard:view'),
  adminDashboardController.getChartsData
);

router.get('/dashboard/quick-stats', 
  adminAuth.authenticate,
  adminAuth.requirePermission('dashboard:view'),
  adminDashboardController.getQuickStats
);

router.get('/dashboard/recent-activities', 
  adminAuth.authenticate,
  adminAuth.requirePermission('dashboard:view'),
  adminDashboardController.getRecentActivities
);

router.get('/dashboard/zone-statistics', 
  adminAuth.authenticate,
  adminAuth.requirePermission('dashboard:view'),
  adminDashboardController.getZoneStatistics
);

router.get('/dashboard/top-payers', 
  adminAuth.authenticate,
  adminAuth.requirePermission('dashboard:view'),
  adminDashboardController.getTopPayers
);

// 👥 UTILISATEURS
router.get('/users', adminAuth.authenticate, adminAuth.requirePermission('user:view'), adminUserController.getUsers);
router.get('/users/:userId', adminAuth.authenticate, adminAuth.requirePermission('user:view'), adminUserController.getUserDetail);
router.put('/users/:userId/status', adminAuth.authenticate, adminAuth.requirePermission('user:update'), adminUserController.updateUserStatus);

// 📝 DÉCLARATIONS
router.get('/declarations', adminAuth.authenticate, adminAuth.requirePermission('declaration:view'), adminDeclarationController.getDeclarations);
router.get('/declarations/:declarationId', adminAuth.authenticate, adminAuth.requirePermission('declaration:view'), adminDeclarationController.getDeclarationDetail);
router.put('/declarations/:declarationId/validate', adminAuth.authenticate, adminAuth.requirePermission('declaration:validate'), adminDeclarationController.validateDeclaration);

// 💰 PAIEMENTS
router.get('/payments', adminAuth.authenticate, adminAuth.requirePermission('payment:view'), adminPaymentController.getPayments);
router.get('/payments/:paymentId', adminAuth.authenticate, adminAuth.requirePermission('payment:view'), adminPaymentController.getPaymentDetail);
router.put('/payments/:paymentId/refund', adminAuth.authenticate, adminAuth.requirePermission('payment:refund'), adminPaymentController.refundPayment);

// 🆔 VALIDATION NIF
router.get('/nif/pending', adminAuth.authenticate, adminAuth.requirePermission('nif:validate'), adminNIFController.getPendingNIFRequests);
router.put('/nif/:userId/validate', adminAuth.authenticate, adminAuth.requirePermission('nif:validate'), adminNIFController.validateNIF);

// 📤 EXPORTATIONS
router.get('/export/users', adminAuth.authenticate, adminAuth.requirePermission('report:export'), adminExportController.exportUsers);
router.get('/export/declarations', adminAuth.authenticate, adminAuth.requirePermission('report:export'), adminExportController.exportDeclarations);
router.get('/export/payments', adminAuth.authenticate, adminAuth.requirePermission('report:export'), adminExportController.exportPayments);

// ⚙️ SYSTÈME
router.get('/system/config', adminAuth.authenticate, adminAuth.requireRole(['SUPER_ADMIN']), adminSystemController.getSystemConfig);
router.put('/system/config', adminAuth.authenticate, adminAuth.requireRole(['SUPER_ADMIN']), adminSystemController.updateSystemConfig);
router.get('/zones', adminAuth.authenticate, adminAuth.requirePermission('zone:view'), adminSystemController.getZones);

// 📋 AUDIT
router.get('/audit-logs', adminAuth.authenticate, adminAuth.requireRole(['SUPER_ADMIN']), adminAuditController.getAuditLogs);

module.exports = router;