// controllers/admin/adminUserController.js
const { User, Zone, Declaration, Payment, NIFHistory, sequelize } = require('../../models');

const adminUserController = {

  getUsers: async (req, res) => {
    try {
      const { page = 1, limit = 20, search, status, activityType, zoneId } = req.query;
      const admin = req.admin;

      const whereClause = buildUserWhereClause(req.query, admin);

      const { count, rows: users } = await User.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        order: [['createdAt', 'DESC']],
        attributes: { 
          exclude: ['otpHash', 'otpExpirestAt', 'fcmToken'] 
        },
        include: [{
          model: Zone,
          as: 'zone',
          attributes: ['id', 'name', 'code', 'region']
        }]
      });

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des utilisateurs'
      });
    }
  },

  getUserDetail: async (req, res) => {
    try {
      const { userId } = req.params;
      const admin = req.admin;

      const user = await User.findByPk(userId, {
        attributes: { exclude: ['otpHash', 'otpExpirestAt', 'fcmToken'] },
        include: [
          {
            model: Zone,
            as: 'zone',
            attributes: ['id', 'name', 'code', 'region']
          },
          {
            model: Declaration,
            as: 'declarations',
            limit: 10,
            order: [['createdAt', 'DESC']]
          },
          {
            model: Payment,
            as: 'payments', 
            limit: 10,
            order: [['createdAt', 'DESC']]
          },
          {
            model: NIFHistory,
            as: 'nifHistories',
            limit: 5,
            order: [['createdAt', 'DESC']]
          }
        ]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Vérifier l'accès à la zone
      if (!(await hasAccessToUser(admin, user))) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à cet utilisateur'
        });
      }

      res.json({
        success: true,
        data: { user }
      });

    } catch (error) {
      console.error('Get user detail error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des détails utilisateur'
      });
    }
  },

  updateUserStatus: async (req, res) => {
    try {
      const { userId } = req.params;
      const { isActive, reason } = req.body;
      const admin = req.admin;

      const user = await User.findByPk(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      if (!(await hasAccessToUser(admin, user))) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à cet utilisateur'
        });
      }

      await user.update({ isActive });

      // Log l'action
      await req.auditLog.create({
        adminId: admin.id,
        action: `USER_${isActive ? 'ACTIVATED' : 'DEACTIVATED'}`,
        resource: 'USER',
        resourceId: userId,
        details: { reason, previousStatus: !isActive }
      });

      res.json({
        success: true,
        message: `Utilisateur ${isActive ? 'activé' : 'désactivé'} avec succès`,
        data: { user }
      });

    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du statut utilisateur'
      });
    }
  }
};

// Helper functions
function buildUserWhereClause(query, admin) {
  const whereClause = {};

  // Filtres de base
  if (query.status) whereClause.isActive = query.status === 'active';
  if (query.activityType) whereClause.activityType = query.activityType;
  if (query.nifStatus) whereClause.nifStatus = query.nifStatus;

  // Recherche texte
  if (query.search) {
    whereClause[sequelize.Op.or] = [
      { firstName: { [sequelize.Op.iLike]: `%${query.search}%` } },
      { lastName: { [sequelize.Op.iLike]: `%${query.search}%` } },
      { phoneNumber: { [sequelize.Op.iLike]: `%${query.search}%` } },
      { nifNumber: { [sequelize.Op.iLike]: `%${query.search}%` } }
    ];
  }

  // Filtre zone
  if (query.zoneId) {
    whereClause.zoneId = query.zoneId;
  } else if (admin.scope !== 'GLOBAL') {
    // Appliquer le filtre de zone automatiquement si pas spécifié
    whereClause.zoneId = { [sequelize.Op.in]: admin.zoneIds || [] };
  }

  return whereClause;
}

async function hasAccessToUser(admin, user) {
  if (admin.scope === 'GLOBAL') return true;
  
  const adminZones = await admin.getZones();
  const adminZoneIds = adminZones.map(z => z.id);
  
  return adminZoneIds.includes(user.zoneId);
}

module.exports = adminUserController;