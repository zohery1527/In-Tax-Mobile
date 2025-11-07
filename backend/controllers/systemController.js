const MobileMoneyConnector = require('../services/MobileMoneyConnector');

const SystemController = {
  async getMobileMoneyStatus(req, res) {
    try {
      const providers = ['ORANGE_MONEY', 'MVOLA'];
      
      const status = providers.map(provider => {
        const connector = new MobileMoneyConnector(provider);
        return connector.getProductionReadiness();
      });

      res.json({
        success: true,
        data: {
          system: 'In-Tax Mobile Money Integration',
          status: 'DEVELOPMENT_READY',
          providers: status,
          message: 'Système prêt pour intégration Mobile Money réelle'
        }
      });
    } catch (error) {
      console.error('Erreur statut système:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du statut'
      });
    }
  },

  async getSystemHealth(req, res) {
    try {
      const db = require('../models');
      await db.sequelize.authenticate();
      
      res.json({
        success: true,
        data: {
          status: 'HEALTHY',
          database: 'CONNECTED',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        data: {
          status: 'UNHEALTHY',
          database: 'DISCONNECTED',
          error: error.message
        }
      });
    }
  }
};

module.exports = SystemController;