'use strict';
const { TransactionLog } = require('../../models');

class RealPaymentStrategy {
  constructor(provider) {
    // provider est déjà au format ORANGE_MONEY, MVOLA, AIRTEL_MONEY
    this.provider = provider;
  }

  async initiate({ amount, phoneNumber, declarationId, userId }) {
    try {
      // Générer un ID de transaction unique
      const transactionId = `${this.getProviderCode()}_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const mode = process.env.NODE_ENV === 'production' ? 'REAL' : 'SANDBOX';
      const status = 'PENDING';
      
      console.log(`🔍 RealPaymentStrategy - Création transaction: ${transactionId}, provider: ${this.provider}`);
      
      // Enregistrer la transaction en base de données
      await TransactionLog.create({
        transactionId,
        provider: this.provider, // Format: ORANGE_MONEY, MVOLA, AIRTEL_MONEY
        amount,
        phoneNumber,
        declarationId,
        userId,
        status,
        mode,
        metadata: {
          initiatedAt: new Date(),
          action: 'INITIATE',
          providerDisplayName: this.getProviderDisplayName()
        }
      });

      return {
        success: true,
        message: `Paiement initié sur ${this.getProviderDisplayName()}. Confirmez sur votre téléphone.`,
        transactionId,
        status,
        mode,
        provider: this.provider,
        providerDisplayName: this.getProviderDisplayName()
      };
    } catch (error) {
      console.error('❌ RealPaymentStrategy initiate error:', error);
      throw new Error(`Échec de l'initiation du paiement: ${error.message}`);
    }
  }

  async confirm({ transactionId }) {
    try {
      // Récupérer la transaction
      const transaction = await TransactionLog.findOne({
        where: { transactionId }
      });
      
      if (!transaction) {
        return { 
          success: false, 
          message: 'Transaction non trouvée', 
          status: 'FAILED' 
        };
      }
      
      // En production, ici vous appelleriez l'API du provider
      // Pour l'instant, on simule une confirmation réussie
      transaction.status = 'COMPLETED';
      transaction.metadata = {
        ...transaction.metadata,
        confirmedAt: new Date(),
        action: 'CONFIRM',
        confirmedBy: 'SYSTEM'
      };
      await transaction.save();
      
      return { 
        success: true, 
        message: 'Paiement confirmé avec succès', 
        status: 'COMPLETED',
        transactionId,
        provider: this.provider,
        providerDisplayName: this.getProviderDisplayName()
      };
    } catch (error) {
      console.error('❌ RealPaymentStrategy confirm error:', error);
      throw new Error(`Échec de la confirmation du paiement: ${error.message}`);
    }
  }

  // Méthodes utilitaires
  getProviderCode() {
    const mapping = {
      'ORANGE_MONEY': 'OM',
      'MVOLA': 'MV',
      'AIRTEL_MONEY': 'AM'
    };
    return mapping[this.provider] || 'OM';
  }

  getProviderDisplayName() {
    const mapping = {
      'ORANGE_MONEY': 'Orange Money',
      'MVOLA': 'MVola',
      'AIRTEL_MONEY': 'Airtel Money'
    };
    return mapping[this.provider] || 'Orange Money';
  }
}

module.exports = RealPaymentStrategy;