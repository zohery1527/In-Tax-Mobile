'use strict';
const MobileMoneyConnector = require('../services/MobileMoneyConnector');
const { Payment, Declaration, TransactionLog, sequelize } = require('../models');

// ✅ Fonctions helpers pour éviter les problèmes de contexte
const getProviderDisplayName = (provider) => {
  const mapping = {
    'ORANGE_MONEY': 'Orange Money',
    'MVOLA': 'MVola',
    'AIRTEL_MONEY': 'Airtel Money',
    'ORANGE': 'Orange Money',
    'AIRTEL': 'Airtel Money'
  };
  return mapping[provider] || provider;
};

const mapProviderToEnum = (provider) => {
  const mapping = { 
    orange: 'ORANGE_MONEY', 
    mvola: 'MVOLA', 
    airtel: 'AIRTEL_MONEY',
    'orange-money': 'ORANGE_MONEY',
    'airtel-money': 'AIRTEL_MONEY',
    'ORANGE_MONEY': 'ORANGE_MONEY',
    'MVOLA': 'MVOLA',
    'AIRTEL_MONEY': 'AIRTEL_MONEY'
  };
  return mapping[provider.toLowerCase()] || 'ORANGE_MONEY';
};

class PaymentController {
  async initiatePayment(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { declarationId, provider, paymentAmount, mode = 'SIMULATION' } = req.body;
      const userId = req.user.id;
      const phone = req.user.phoneNumber;
      const nifNumber = req.user.nifNumber;

      console.log(`🔍 PaymentController - Initiation: declarationId=${declarationId}, provider=${provider}, mode=${mode}, userId=${userId}`);

      // Validation des données requises
      if (!declarationId || !provider) {
        await transaction.rollback();
        return res.status(400).json({ 
          success: false, 
          message: 'Données manquantes: declarationId et provider sont requis' 
        });
      }

      // Récupération et validation de la déclaration
      const declaration = await Declaration.findOne({ 
        where: { id: declarationId, userId }, 
        transaction 
      });
      
      if (!declaration) {
        await transaction.rollback();
        return res.status(404).json({ 
          success: false, 
          message: 'Déclaration non trouvée' 
        });
      }

      if (declaration.status === 'PAID') {
        await transaction.rollback();
        return res.status(400).json({ 
          success: false, 
          message: 'Cette déclaration est déjà entièrement payée' 
        });
      }

      // Détermination du montant à payer
      const amountToPay = paymentAmount || declaration.remainingAmount;
      
      if (amountToPay <= 0) {
        await transaction.rollback();
        return res.status(400).json({ 
          success: false, 
          message: 'Le montant à payer doit être supérieur à 0' 
        });
      }

      if (amountToPay > declaration.remainingAmount) {
        await transaction.rollback();
        return res.status(400).json({ 
          success: false, 
          message: `Le montant à payer (${amountToPay}) dépasse le reste dû (${declaration.remainingAmount})` 
        });
      }

      // Initialisation du paiement via MobileMoneyConnector
      console.log(`🔍 Création MobileMoneyConnector: provider=${provider}, mode=${mode}`);
      const moneyConnector = new MobileMoneyConnector(provider, mode);
      
      const result = await moneyConnector.initiatePayment({ 
        amount: amountToPay, 
        phoneNumber: phone, 
        declarationId, 
        userId 
      });

      console.log(`🔍 Résultat initiation:`, { 
        success: result.success, 
        transactionId: result.transactionId,
        provider: result.provider 
      });

      if (!result.success) {
        await transaction.rollback();
        return res.status(400).json({ 
          success: false, 
          message: result.message 
        });
      }

      // Détermination du type de paiement
      const paymentType = amountToPay === declaration.remainingAmount ? 'FULL' : 'PARTIAL';
      const remainingAfterPayment = declaration.remainingAmount - amountToPay;

      // Création de l'enregistrement Payment
      const payment = await Payment.create({
        declarationId, 
        userId, 
        nifNumber,
        amount: amountToPay,
        remainingAmount: remainingAfterPayment,
        paymentType,
        provider: result.provider || mapProviderToEnum(provider),
        transactionId: result.transactionId,
        status: result.status || 'PENDING',
        phoneNumber: phone,
        mode: result.mode || mode,
        metadata: { 
          initiation: result, 
          mode: result.mode, 
          provider: result.provider || provider,
          providerDisplayName: result.providerDisplayName || getProviderDisplayName(provider)
        }
      }, { transaction });

      await transaction.commit();
      
      console.log(`✅ Paiement initié avec succès: ${result.transactionId}`);
      
      res.status(200).json({ 
        success: true, 
        message: 'Paiement initié avec succès', 
        data: {
          payment,
          transactionId: result.transactionId,
          nextStep: 'Confirmez le paiement sur votre téléphone',
          simulationInfo: result.simulation || null,
          provider: result.provider,
          providerDisplayName: result.providerDisplayName,
          mode: result.mode || mode
        }
      });

    } catch (err) {
      await transaction.rollback();
      console.error('❌ PaymentController initiatePayment error:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de l\'initiation du paiement',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }

  async confirmPayment(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { transactionId, provider, mode = 'SIMULATION' } = req.body;
      const userId = req.user.id;

      console.log(`🔍 PaymentController - Confirmation: transactionId=${transactionId}, provider=${provider}, mode=${mode}`);

      if (!transactionId) {
        await transaction.rollback();
        return res.status(400).json({ 
          success: false, 
          message: 'Transaction ID requis' 
        });
      }

      // Récupération du paiement
      const payment = await Payment.findOne({ 
        where: { transactionId, userId }, 
        include: [{ model: Declaration, as: 'declaration' }], 
        transaction 
      });
      
      if (!payment) {
        await transaction.rollback();
        return res.status(404).json({ 
          success: false, 
          message: 'Paiement non trouvé' 
        });
      }

      if (payment.status === 'COMPLETED') {
        await transaction.rollback();
        return res.status(400).json({ 
          success: false, 
          message: 'Ce paiement est déjà confirmé' 
        });
      }

      // Confirmation du paiement - utiliser le mode du paiement original si disponible
      const confirmMode = payment.mode || mode;
      const confirmProvider = provider || payment.provider;
      
      console.log(`🔍 Confirmation avec: mode=${confirmMode}, provider=${confirmProvider}`);
      
      const moneyConnector = new MobileMoneyConnector(confirmProvider, confirmMode);
      const confirmResult = await moneyConnector.confirmPayment(transactionId);
      
      console.log(`🔍 Résultat confirmation:`, { 
        success: confirmResult.success, 
        status: confirmResult.status,
        provider: confirmResult.provider 
      });

      if (!confirmResult.success) {
        await transaction.rollback();
        return res.status(400).json({ 
          success: false, 
          message: confirmResult.message 
        });
      }

      // Mise à jour du paiement
      payment.status = confirmResult.status || 'COMPLETED';
      payment.metadata = { 
        ...payment.metadata, 
        confirmation: confirmResult, 
        confirmedAt: new Date().toISOString(),
        providerDisplayName: confirmResult.providerDisplayName || payment.metadata?.providerDisplayName
      };
      await payment.save({ transaction });

      // Mise à jour de la déclaration
      const declaration = payment.declaration;
      if (declaration) {
        declaration.paidAmount = (parseFloat(declaration.paidAmount) || 0) + parseFloat(payment.amount);
        declaration.remainingAmount = Math.max(0, declaration.taxAmount - declaration.paidAmount);
        
        if (declaration.remainingAmount === 0) {
          declaration.status = 'PAID';
        } else if (declaration.paidAmount > 0) {
          declaration.status = 'PARTIALLY_PAID';
        }
        
        await declaration.save({ transaction });
      }

      await transaction.commit();
      
      console.log(`✅ Paiement confirmé avec succès: ${transactionId}`);
      
      res.status(200).json({ 
        success: true, 
        message: 'Paiement confirmé avec succès', 
        data: {
          payment,
          confirmation: confirmResult,
          declaration: declaration ? {
            id: declaration.id,
            status: declaration.status,
            paidAmount: declaration.paidAmount,
            remainingAmount: declaration.remainingAmount
          } : null
        }
      });

    } catch (err) {
      await transaction.rollback();
      console.error('❌ PaymentController confirmPayment error:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la confirmation du paiement',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }

  async getPaymentHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, status, provider, mode } = req.query;

      const where = { userId };
      if (status) where.status = status;
      if (provider) where.provider = mapProviderToEnum(provider);
      if (mode) where.mode = mode.toUpperCase();

      const payments = await Payment.findAndCountAll({
        where,
        include: [{ 
          model: Declaration, 
          as: 'declaration', 
          attributes: ['id', 'period', 'activityType', 'amount', 'taxAmount', 'status'] 
        }],
        limit: Math.min(parseInt(limit), 50),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [['createdAt', 'DESC']]
      });

      // Formater la réponse avec des noms d'affichage
      const formattedPayments = payments.rows.map(payment => {
        const paymentData = payment.toJSON();
        
        // Ajouter le nom d'affichage du provider
        paymentData.providerDisplayName = getProviderDisplayName(payment.provider);
        
        // Formater la date pour l'affichage
        if (paymentData.createdAt) {
          paymentData.formattedDate = new Date(paymentData.createdAt).toLocaleDateString('fr-MG', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
        
        return paymentData;
      });

      res.status(200).json({ 
        success: true, 
        data: {
          payments: formattedPayments,
          total: payments.count,
          page: parseInt(page),
          totalPages: Math.ceil(payments.count / limit),
          limit: parseInt(limit)
        }
      });
    } catch (err) {
      console.error('❌ PaymentController getPaymentHistory error:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération de l\'historique des paiements',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }

  // async getPaymentDetails(req, res) {
  //   try {
  //     const { paymentId } = req.params;
  //     const userId = req.user.id;

  //     const payment = await Payment.findOne({
  //       where: { id: paymentId, userId },
  //       include: [
  //         { 
  //           model: Declaration, 
  //           as: 'declaration', 
  //           attributes: ['id', 'period', 'amount', 'taxAmount', 'status'] 
  //         },
  //         { 
  //           model: TransactionLog, 
  //           as: 'transactionLog', 
  //           where: { transactionId: sequelize.col('Payment.transactionId') }, 
  //           required: false 
  //         }
  //       ]
  //     });

  //     if (!payment) {
  //       return res.status(404).json({ 
  //         success: false, 
  //         message: 'Paiement non trouvé' 
  //       });
  //     }

  //     // Ajouter le nom d'affichage du provider
  //     const paymentData = payment.toJSON();
  //     paymentData.providerDisplayName = getProviderDisplayName(payment.provider);
      
  //     // Formater la date
  //     if (paymentData.createdAt) {
  //       paymentData.formattedDate = new Date(paymentData.createdAt).toLocaleDateString('fr-MG', {
  //         day: '2-digit',
  //         month: '2-digit',
  //         year: 'numeric',
  //         hour: '2-digit',
  //         minute: '2-digit'
  //       });
  //     }

  //     res.status(200).json({ 
  //       success: true, 
  //       data: { payment: paymentData } 
  //     });
  //   } catch (err) {
  //     console.error('❌ PaymentController getPaymentDetails error:', err);
  //     res.status(500).json({ 
  //       success: false, 
  //       message: 'Erreur lors de la récupération des détails du paiement' 
  //     });
  //   }
  // }

  async getPaymentDetails(req, res) {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    console.log(`🔍 Recherche détails paiement (version simple): ${paymentId}`);

    // 1. Récupérer seulement le paiement et sa déclaration
    const payment = await Payment.findOne({
      where: { id: paymentId, userId },
      include: [
        { 
          model: Declaration, 
          as: 'declaration',
          attributes: ['id', 'period', 'taxAmount', 'status', 'activityType', 'description']
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Paiement non trouvé' 
      });
    }

    // 2. Récupérer l'utilisateur séparément
    let userInfo = null;
    try {
      const user = await sequelize.models.User.findOne({
        where: { id: userId },
        attributes: ['firstName', 'lastName', 'phoneNumber', 'nifNumber']
      });
      
      if (user) {
        userInfo = {
          name: `${user.firstName} ${user.lastName}`,
          phone: user.phoneNumber,
          nif: user.nifNumber
        };
      }
    } catch (userError) {
      console.warn('⚠️ Erreur récupération utilisateur:', userError.message);
    }

    // 3. Récupérer les logs séparément
    let transactionLogs = [];
    try {
      transactionLogs = await TransactionLog.findAll({
        where: { 
          transactionId: payment.transactionId,
          userId: userId
        },
        order: [['createdAt', 'DESC']],
        limit: 10
      });
    } catch (logError) {
      console.warn('⚠️ Erreur récupération logs:', logError.message);
    }

    // 4. Construire la réponse
    const response = {
      id: payment.id,
      transactionId: payment.transactionId,
      amount: payment.amount,
      status: payment.status,
      provider: payment.provider,
      providerDisplayName: getProviderDisplayName(payment.provider),
      phoneNumber: payment.phoneNumber,
      createdAt: payment.createdAt,
      paidAt: payment.paidAt,
      formattedAmount: `${payment.amount?.toLocaleString('fr-FR') || '0'} Ar`,
      
      // Déclaration
      declaration: payment.declaration ? {
        id: payment.declaration.id,
        period: payment.declaration.period,
        taxAmount: payment.declaration.taxAmount,
        activityType: payment.declaration.activityType,
        status: payment.declaration.status
      } : null,
      
      // Utilisateur
      user: userInfo,
      
      // Logs
      transactionLogs: transactionLogs.map(log => ({
        id: log.id,
        status: log.status,
        time: new Date(log.createdAt).toLocaleTimeString('fr-MG', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        metadata: log.metadata || {}
      })),
      
      // Métadonnées
      metadata: payment.metadata || {}
    };

    // Formater les dates
    if (response.createdAt) {
      response.formattedDate = new Date(response.createdAt).toLocaleDateString('fr-MG', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    console.log(`✅ Détails paiement récupérés avec succès: ${paymentId}`);
    
    res.status(200).json({ 
      success: true, 
      data: { 
        payment: response 
      } 
    });

  } catch (err) {
    console.error('❌ PaymentController getPaymentDetails error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des détails du paiement'
    });
  }
}
  
  // Méthode pour simuler un paiement (pour les tests)

  async simulatePayment(req, res) {
    try {
      const { declarationId, provider = 'orange', amount } = req.body;
      const userId = req.user.id;
      
      console.log(`🔍 Simulation de paiement: declarationId=${declarationId}, provider=${provider}`);
      
      // Appeler initiatePayment en mode simulation
      req.body.mode = 'SIMULATION';
      req.body.provider = provider;
      req.body.paymentAmount = amount;
      
      return this.initiatePayment(req, res);
    } catch (err) {
      console.error('❌ PaymentController simulatePayment error:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la simulation du paiement' 
      });
    }
  }
}

module.exports = new PaymentController();