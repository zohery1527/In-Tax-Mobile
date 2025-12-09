// controllers/admin/adminDeclarationController.js
const { Declaration, User, Zone, Payment, sequelize } = require('../../models');

const adminDeclarationController = {

  getDeclarations: async (req, res) => {
    try {
      const { page = 1, limit = 20, status, period, zoneId, userId } = req.query;
      const admin = req.admin;

      const whereClause = buildDeclarationWhereClause(req.query, admin);

      const { count, rows: declarations } = await Declaration.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'nifNumber'],
            include: [{
              model: Zone,
              as: 'zone',
              attributes: ['name', 'code']
            }]
          },
          {
            model: Payment,
            as: 'payments',
            attributes: ['id', 'amount', 'status', 'paidAt'],
            required: false
          }
        ]
      });

      res.json({
        success: true,
        data: {
          declarations,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get declarations error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des déclarations'
      });
    }
  },

  getDeclarationDetail: async (req, res) => {
    try {
      const { declarationId } = req.params;
      const admin = req.admin;

      const declaration = await Declaration.findByPk(declarationId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'nifNumber', 'activityType'],
            include: [{
              model: Zone,
              as: 'zone',
              attributes: ['name', 'code', 'region']
            }]
          },
          {
            model: Payment,
            as: 'payments',
            order: [['createdAt', 'DESC']]
          }
        ]
      });

      if (!declaration) {
        return res.status(404).json({
          success: false,
          message: 'Déclaration non trouvée'
        });
      }

      // Vérifier l'accès
      if (!(await hasAccessToDeclaration(admin, declaration))) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à cette déclaration'
        });
      }

      res.json({
        success: true,
        data: { declaration }
      });

    } catch (error) {
      console.error('Get declaration detail error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des détails de la déclaration'
      });
    }
  },

  validateDeclaration: async (req, res) => {
    try {
      const { declarationId } = req.params;
      const { action, reason } = req.body; // 'APPROVE' or 'REJECT'

      const declaration = await Declaration.findByPk(declarationId, {
        include: [{
          model: User,
          as: 'user'
        }]
      });

      if (!declaration) {
        return res.status(404).json({
          success: false,
          message: 'Déclaration non trouvée'
        });
      }

      if (!(await hasAccessToDeclaration(req.admin, declaration))) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à cette déclaration'
        });
      }

      if (action === 'APPROVE') {
        await declaration.update({ 
          status: 'VALIDATED',
          validatedAt: new Date(),
          validatedBy: req.admin.id
        });

        // Notification
        await req.app.get('models').Notification.create({
          userId: declaration.userId,
          type: 'DECLARATION_SUBMITTED',
          title: 'Famaranana voamarina',
          message: `Ny famaranana volana ${declaration.period} dia voamarina soamantsara.`,
          actionUrl: `/declarations/${declaration.id}`
        });

      } else if (action === 'REJECT') {
        if (!reason) {
          return res.status(400).json({
            success: false,
            message: 'La raison du rejet est requise'
          });
        }

        await declaration.update({ 
          status: 'REJECTED',
          rejectionReason: reason,
          rejectedAt: new Date(),
          rejectedBy: req.admin.id
        });

        // Notification
        await req.app.get('models').Notification.create({
          userId: declaration.userId,
          type: 'SYSTEM_ALERT',
          title: 'Famaranana tsy voamarina',
          message: `Ny famaranana volana ${declaration.period} dia tsy voamarina: ${reason}`,
          actionUrl: `/declarations/${declaration.id}`
        });
      }

      res.json({
        success: true,
        message: `Déclaration ${action === 'APPROVE' ? 'approuvée' : 'rejetée'} avec succès`,
        data: { declaration }
      });

    } catch (error) {
      console.error('Validate declaration error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la validation de la déclaration'
      });
    }
  }
};

// Helper functions
function buildDeclarationWhereClause(query, admin) {
  const whereClause = {};

  // Filtres de base
  if (query.status) whereClause.status = query.status;
  if (query.period) whereClause.period = query.period;
  if (query.userId) whereClause.userId = query.userId;

  // Filtre zone
  if (admin.scope !== 'GLOBAL') {
    whereClause['$user.zoneId$'] = { 
      [sequelize.Op.in]: admin.zoneIds || [] 
    };
  }

  return whereClause;
}

async function hasAccessToDeclaration(admin, declaration) {
  if (admin.scope === 'GLOBAL') return true;
  
  const user = await declaration.getUser();
  const adminZones = await admin.getZones();
  const adminZoneIds = adminZones.map(z => z.id);
  
  return adminZoneIds.includes(user.zoneId);
}

module.exports = adminDeclarationController;