const axios = require('axios');

class RealPaymentStrategy {
  constructor(provider) {
    this.provider = provider;
  }

  async initiate(paymentData) {
    return {
      success: true,
      status: 'PENDING',
      transactionId: `REAL_${this.provider}_${Date.now()}`,
      message: 'Paiement initié - Mode production',
      mode: 'PRODUCTION'
    };
  }

  async confirm(transactionId) {
    return {
      success: true,
      status: 'COMPLETED',
      transactionId: transactionId,
      mode: 'PRODUCTION'
    };
  }
}

module.exports = RealPaymentStrategy;