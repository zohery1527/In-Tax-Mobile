'use strict';
const RealPaymentStrategy = require('./paymentStrategies/RealPaymentStrategy');
const SimulationPaymentStrategy = require('./paymentStrategies/SimulationPaymentStrategy');

class MobileMoneyConnector {
  constructor(provider, mode = 'REAL') {
    // Mapping standardisé pour correspondre au modèle TransactionLog
    const mapping = { 
      orange: 'ORANGE_MONEY', 
      mvola: 'MVOLA', 
      airtel: 'AIRTEL_MONEY' 
    };
    
    // Convertir le provider entrant en format standard
    const normalizedProvider = mapping[provider.toLowerCase()] || 'ORANGE_MONEY';
    
    this.provider = normalizedProvider; // Format: ORANGE_MONEY, MVOLA, AIRTEL_MONEY
    this.originalProvider = provider.toLowerCase(); // Format: orange, mvola, airtel
    this.mode = mode;
    
    // Passer le provider standardisé aux stratégies
    this.strategy = mode === 'SIMULATION' 
      ? new SimulationPaymentStrategy(normalizedProvider)
      : new RealPaymentStrategy(normalizedProvider);
  }

  async initiatePayment({ amount, phoneNumber, declarationId, userId }) {
    try {
      const result = await this.strategy.initiate({ 
        amount, 
        phoneNumber, 
        declarationId, 
        userId 
      });
      return result;
    } catch (err) {
      console.error('❌ MobileMoneyConnector initiatePayment error:', err);
      return { 
        success: false, 
        message: err.message || 'Erreur initiation paiement', 
        transactionId: null, 
        status: 'FAILED' 
      };
    }
  }

  async confirmPayment(transactionId) {
    try {
      const result = await this.strategy.confirm({ transactionId });
      return result;
    } catch (err) {
      console.error('❌ MobileMoneyConnector confirmPayment error:', err);
      return { 
        success: false, 
        message: err.message || 'Erreur confirmation paiement', 
        status: 'FAILED' 
      };
    }
  }
}

module.exports = MobileMoneyConnector;