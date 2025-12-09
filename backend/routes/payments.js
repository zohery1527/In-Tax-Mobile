const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');
// const { validatePaymentInitiation, validatePaymentConfirmation } = require('../middleware/validate');

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes de paiement avec validation
router.post('/initiate', paymentController.initiatePayment);
router.post('/confirm', paymentController.confirmPayment);
router.get('/history', paymentController.getPaymentHistory);
router.get('/:paymentId', paymentController.getPaymentDetails);

// Routes de webhooks (sans authentification token, mais avec signature)
// router.post('/webhook/orange', paymentController.handleOrangeWebhook);
// router.post('/webhook/mvola', paymentController.handleMvolaWebhook);
// router.post('/webhook/airtel', paymentController.handleAirtelWebhook);

// Route de simulation (pour les tests en développement)
if (process.env.NODE_ENV !== 'production') {
  router.post('/simulate', paymentController.simulatePayment);
  router.post('/test/webhook', paymentController.testWebhook);
}

module.exports = router;