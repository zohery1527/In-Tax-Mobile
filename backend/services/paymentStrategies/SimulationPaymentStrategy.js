'use strict';
const { TransactionLog } = require('../../models');

class SimulationPaymentStrategy {
  constructor(provider) {
    // provider est déjà au format ORANGE_MONEY, MVOLA, AIRTEL_MONEY
    this.provider = provider;
    
    // Configuration par provider (clés en format simplifié)
    this.simulationData = {
      'orange': { 
        name: 'Orange Money', 
        successRate: 0.95, 
        delay: 2000,
        confirmationRate: 0.98,
        ussdCode: (amount) => `#144*1*${amount}*INTAX#`,
        code: 'OM'
      },
      'mvola': { 
        name: 'MVola', 
        successRate: 0.90, 
        delay: 3000,
        confirmationRate: 0.95,
        ussdCode: (amount) => `*133*1*${amount}*INTAX#`,
        code: 'MV'
      },
      'airtel': { 
        name: 'Airtel Money', 
        successRate: 0.85, 
        delay: 2500,
        confirmationRate: 0.92,
        ussdCode: (amount) => `*144*${amount}*INTAX#`,
        code: 'AM'
      }
    };
  }

  async initiate({ amount, phoneNumber, declarationId, userId }) {
    const providerConfig = this.getProviderConfig();
    
    // Simuler un délai de traitement
    await this.simulateDelay(providerConfig.delay);

    const isSuccess = Math.random() < providerConfig.successRate;
    const transactionId = `SIM_${providerConfig.code}_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    if (!isSuccess) {
      await TransactionLog.create({
        transactionId,
        provider: this.provider, // Format: ORANGE_MONEY, MVOLA, AIRTEL_MONEY
        amount,
        phoneNumber,
        declarationId,
        userId,
        status: 'FAILED',
        mode: 'SIMULATION',
        metadata: {
          initiatedAt: new Date(),
          action: 'INITIATE',
          simulation: { 
            success: false, 
            reason: 'Échec aléatoire de simulation',
            providerName: providerConfig.name
          }
        }
      });

      return {
        success: false,
        status: 'FAILED',
        transactionId,
        message: `${providerConfig.name} : Échec de la transaction simulée. Veuillez réessayer.`,
        mode: 'SIMULATION',
        provider: this.provider,
        providerDisplayName: providerConfig.name
      };
    }

    await TransactionLog.create({
      transactionId,
      provider: this.provider, // Format: ORANGE_MONEY, MVOLA, AIRTEL_MONEY
      amount,
      phoneNumber,
      declarationId,
      userId,
      status: 'PENDING',
      mode: 'SIMULATION',
      metadata: {
        initiatedAt: new Date(),
        action: 'INITIATE',
        simulation: {
          confirmationCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
          expiresIn: '5 minutes',
          ussdCode: providerConfig.ussdCode(amount),
          success: true,
          providerName: providerConfig.name
        }
      }
    });

    return {
      success: true,
      status: 'PENDING',
      transactionId,
      message: `${providerConfig.name} : Paiement initié. Confirmez sur votre téléphone.`,
      mode: 'SIMULATION',
      provider: this.provider,
      providerDisplayName: providerConfig.name,
      simulation: {
        confirmationCode: '123456', // Code fixe pour les tests
        expiresIn: '5 minutes',
        ussdCode: providerConfig.ussdCode(amount),
        providerName: providerConfig.name
      }
    };
  }

  async confirm({ transactionId }) {
    if (!transactionId.startsWith('SIM_')) {
      return {
        success: false,
        status: 'FAILED',
        message: 'Transaction non trouvée'
      };
    }

    const transaction = await TransactionLog.findOne({
      where: { transactionId }
    });
    
    if (!transaction) {
      return {
        success: false,
        status: 'FAILED',
        message: 'Transaction non trouvée'
      };
    }

    await this.simulateDelay(1500);

    const providerConfig = this.getProviderConfig();
    const isConfirmed = Math.random() < providerConfig.confirmationRate;

    if (!isConfirmed) {
      transaction.status = 'FAILED';
      transaction.metadata = {
        ...transaction.metadata,
        confirmedAt: new Date(),
        action: 'CONFIRM',
        simulation: { 
          ...transaction.metadata.simulation, 
          success: false,
          reason: 'Paiement expiré'
        }
      };
      await transaction.save();

      return {
        success: false,
        status: 'FAILED',
        transactionId: transactionId,
        message: 'Paiement expiré ou annulé par l\'utilisateur',
        mode: 'SIMULATION',
        provider: this.provider,
        providerDisplayName: providerConfig.name
      };
    }

    transaction.status = 'COMPLETED';
    transaction.metadata = {
      ...transaction.metadata,
      confirmedAt: new Date(),
      action: 'CONFIRM',
      simulation: { 
        ...transaction.metadata.simulation, 
        success: true,
        confirmedAt: new Date(),
        receiptNumber: `RC${Date.now()}`,
        providerName: providerConfig.name
      }
    };
    await transaction.save();

    return {
      success: true,
      status: 'COMPLETED',
      transactionId: transactionId,
      message: 'Paiement confirmé avec succès',
      mode: 'SIMULATION',
      provider: this.provider,
      providerDisplayName: providerConfig.name,
      simulation: {
        confirmedAt: new Date(),
        receiptNumber: `RC${Date.now()}`,
        providerName: providerConfig.name
      }
    };
  }

  // Méthodes utilitaires
  getProviderConfig() {
    // Convertir ORANGE_MONEY en orange pour la configuration
    const providerKey = this.getProviderKey();
    return this.simulationData[providerKey] || this.simulationData.orange;
  }

  getProviderKey() {
    const mapping = {
      'ORANGE_MONEY': 'orange',
      'MVOLA': 'mvola',
      'AIRTEL_MONEY': 'airtel'
    };
    return mapping[this.provider] || 'orange';
  }

  getProviderCode() {
    const config = this.getProviderConfig();
    return config.code || 'OM';
  }

  async simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = SimulationPaymentStrategy;