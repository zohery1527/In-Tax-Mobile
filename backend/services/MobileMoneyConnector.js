const RealPaymentStrategy = require('./paymentStrategies/RealPaymentStrategy');
const SimulationPaymentStrategy = require('./paymentStrategies/SimulationPaymentStrategy');

class MobileMoneyConnector {
  constructor(provider) {
    this.provider = provider;
    this.mode = this.detectMode();
  }

  detectMode() {
    if (process.env.ORANGE_MONEY_API_KEY && process.env.NODE_ENV === 'production') {
      return 'PRODUCTION';
    } else {
      return 'SIMULATION';
    }
  }

  async initiatePayment(paymentData) {
    const strategy = this.getPaymentStrategy();
    return await strategy.initiate(paymentData);
  }

  async confirmPayment(transactionId) {
    const strategy = this.getPaymentStrategy();
    return await strategy.confirm(transactionId);
  }

  getPaymentStrategy() {
    switch (this.mode) {
      case 'PRODUCTION':
        return new RealPaymentStrategy(this.provider);
      default:
        return new SimulationPaymentStrategy(this.provider);
    }
  }

  getProductionReadiness() {
    return {
      status: this.mode === 'PRODUCTION' ? 'LIVE' : 'READY',
      provider: this.provider,
      mode: this.mode,
      missing: this.getMissingConfigurations(),
      estimatedIntegrationTime: '2-3 jours'
    };
  }

  getMissingConfigurations() {
    const missing = [];
    if (!process.env.ORANGE_MONEY_API_KEY) missing.push('ORANGE_MONEY_API_KEY');
    if (!process.env.MVOLA_CONSUMER_KEY) missing.push('MVOLA_CONSUMER_KEY');
    return missing;
  }
}

module.exports = MobileMoneyConnector;
