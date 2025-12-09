// controllers/admin/adminSystemController.js
const { SystemConfig, Zone, Admin, AuditLog } = require('../../models');

const adminSystemController = {

  getSystemConfig: async (req, res) => {
    try {
      const configs = await SystemConfig.findAll({
        order: [['category', 'ASC'], ['key', 'ASC']]
      });

      res.json({
        success: true,
        data: { configs }
      });

    } catch (error) {
      console.error('Get system config error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la configuration'
      });
    }
  },

  updateSystemConfig: async (req, res) => {
    try {
      const { key, value, description } = req.body;

      const [config, created] = await SystemConfig.findOrCreate({
        where: { key },
        defaults: { 
          value, 
          description,
          category: 'SYSTEM',
          updatedBy: req.admin.id
        }
      });

      if (!created) {
        await config.update({ 
          value, 
          description,
          updatedBy: req.admin.id
        });
      }

      // Audit
      await AuditLog.create({
        adminId: req.admin.id,
        action: 'UPDATE_CONFIG',
        resource: 'SYSTEM',
        resourceId: key,
        details: { key, value, previousValue: config._previousDataValues.value }
      });

      res.json({
        success: true,
        message: `Configuration ${key} mise à jour avec succès`,
        data: { config }
      });

    } catch (error) {
      console.error('Update system config error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la configuration'
      });
    }
  },

  getZones: async (req, res) => {
    try {
      const zones = await Zone.findAll({
        where: { isActive: true },
        order: [['region', 'ASC'], ['name', 'ASC']]
      });

      res.json({
        success: true,
        data: { zones }
      });

    } catch (error) {
      console.error('Get zones error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des zones'
      });
    }
  }
};

module.exports = adminSystemController;