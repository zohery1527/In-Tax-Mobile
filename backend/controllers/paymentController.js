const MobileMoneyConnector = require('../services/MobileMoneyConnector');
const smsService = require('../services/SMSService');
const db = require('../models');
const { Declaration, Payment } = db;

class PaymentController {
  async initiatePayment(req, res) {
    try {
      const { declarationId, provider, phoneNumber } = req.body;
      const userId = req.user.id;

      const missingFields = ['declarationId', 'provider', 'phoneNumber']
        .filter(field => !req.body[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Champs manquants: ${missingFields.join(', ')}`
        });
      }

      const declaration = await Declaration.findOne({
        where: { id: declarationId, userId }
      });

      if (!declaration) {
        return res.status(404).json({
          success: false,
          message: "Déclaration non trouvée"
        });
      }

      if (declaration.status === 'PAID') {
        return res.status(400).json({
          success: false,
          message: "Cette déclaration a déjà été payée"
        });
      }

      const moneyConnector = new MobileMoneyConnector(provider);
      const paymentData = {
        amount: declaration.taxAmount,
        phoneNumber: phoneNumber,
        declarationId: declarationId,
        userId: userId
      };

      const paymentResult = await moneyConnector.initiatePayment(paymentData);

      if (!paymentResult.success) {
        return res.status(400).json({
          success: false,
          message: paymentResult.message
        });
      }

      const payment = await Payment.create({
        declarationId,
        userId,
        nifNumber: req.user.nifNumber,
        amount: declaration.taxAmount,
        provider,
        transactionId: paymentResult.transactionId,
        status: paymentResult.status,
        phoneNumber,
        metadata: {
          initiation: paymentResult,
          sandbox: paymentResult.mode === 'SIMULATION'
        }
      });

      res.json({
        success: true,
        message: "Paiement initié avec succès",
        data: {
          paymentId: payment.id,
          transactionId: paymentResult.transactionId,
          status: paymentResult.status,
          amount: declaration.taxAmount,
          provider: provider
        }
      });

    } catch (error) {
      console.error('Erreur initiation paiement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'initiation du paiement'
      });
    }
  }

  async confirmPayment(req, res) {
    try {
      const { transactionId, provider } = req.body;
      const userId = req.user.id;

      if (!transactionId) {
        return res.status(400).json({
          success: false,
          message: "Transaction ID est requis"
        });
      }

      const payment = await Payment.findOne({
        where: { transactionId, userId },
        include: [{ model: Declaration, as: 'declaration' }]
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Paiement non trouvé'
        });
      }

      const moneyConnector = new MobileMoneyConnector(provider || payment.provider);
      const confirmationResult = await moneyConnector.confirmPayment(transactionId);

      if (!confirmationResult.success) {
        return res.status(400).json({
          success: false,
          message: confirmationResult.message
        });
      }

      payment.status = confirmationResult.status;
      payment.metadata = {
        ...payment.metadata,
        confirmation: confirmationResult,
        confirmedAt: new Date().toISOString()
      };
      await payment.save();

      if (confirmationResult.status === 'COMPLETED') {
        await Declaration.update(
          { status: 'PAID' },
          { where: { id: payment.declarationId } }
        );

        try {
          await smsService.sendPaymentConfirmation(
            payment.phoneNumber,
            confirmationResult.amount || payment.amount,
            payment.declaration.period,
            payment.transactionId
          );
          console.log('✅ SMS confirmation paiement envoyé');
        } catch (smsError) {
          console.error('❌ Erreur envoi SMS paiement:', smsError);
        }
      }

      res.json({
        success: true,
        message: 'Paiement confirmé avec succès',
        data: {
          paymentId: payment.id,
          transactionId: transactionId,
          status: confirmationResult.status,
          amount: confirmationResult.amount || payment.amount
        }
      });

    } catch (error) {
      console.error('Erreur confirmation paiement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la confirmation du paiement'
      });
    }
  }

  async getPaymentHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      const payments = await Payment.findAndCountAll({
        where: { userId },
        include: [{
          model: Declaration,
          as: 'declaration',
          attributes: ['period', 'amount', 'activityType']
        }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });

      res.json({
        success: true,
        data: {
          payments: payments.rows,
          total: payments.count,
          page: parseInt(page),
          totalPages: Math.ceil(payments.count / limit)
        }
      });
    } catch (error) {
      console.error('Erreur historique paiements:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'historique'
      });
    }
  }
}

module.exports = new PaymentController();