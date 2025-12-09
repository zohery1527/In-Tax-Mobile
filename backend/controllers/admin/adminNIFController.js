// controllers/admin/adminNIFController.js
const { User, NIFHistory, Notification, Zone, sequelize } = require('../../models');

const adminNIFController = {

  getPendingNIFRequests: async (req, res) => {
    try {
      const { page = 1, limit = 20, zoneId } = req.query;
      const admin = req.admin;

      const whereClause = { nifStatus: 'PENDING' };
      
      // Appliquer le filtre de zone
      const zoneFilter = await buildZoneFilter(admin, zoneId);
      if (zoneFilter.zoneId) {
        whereClause.zoneId = zoneFilter.zoneId;
      }

      const { count, rows: users } = await User.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        include: [{
          model: Zone,
          as: 'zone',
          attributes: ['name', 'code', 'region']
        }],
        order: [['createdAt', 'ASC']]
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
      console.error('Get pending NIF requests error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des demandes NIF'
      });
    }
  },

  validateNIF: async (req, res) => {
    try {
      const { userId } = req.params;
      const { action, nifNumber, rejectionReason } = req.body;

      const user = await User.findByPk(userId, {
        include: [{ model: Zone, as: 'zone' }]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Vérifier l'accès
      if (!(await hasAccessToUser(req.admin, user))) {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'avez pas accès à cet utilisateur'
        });
      }

      if (action === 'APPROVE') {
        await approveNIF(user, nifNumber, req.admin);
      } else if (action === 'REJECT') {
        await rejectNIF(user, rejectionReason, req.admin);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Action invalide. Utilisez APPROVE ou REJECT'
        });
      }

      res.json({
        success: true,
        message: `NIF ${action === 'APPROVE' ? 'validé' : 'rejeté'} avec succès`,
        data: { user }
      });

    } catch (error) {
      console.error('Validate NIF error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la validation du NIF'
      });
    }
  }
};

// Helper functions
async function buildZoneFilter(admin, requestedZoneId) {
  if (admin.scope === 'GLOBAL') {
    return requestedZoneId ? { zoneId: requestedZoneId } : {};
  }

  const adminZones = await admin.getZones();
  const adminZoneIds = adminZones.map(z => z.id);
  
  if (requestedZoneId && adminZoneIds.includes(parseInt(requestedZoneId))) {
    return { zoneId: requestedZoneId };
  }
  
  return { zoneId: { [sequelize.Op.in]: adminZoneIds } };
}

async function approveNIF(user, nifNumber, admin) {
  // Vérifier doublon NIF
  const existingUser = await User.findOne({ 
    where: { nifNumber, id: { [sequelize.Op.ne]: user.id } }
  });

  if (existingUser) {
    throw new Error('Ce numéro NIF est déjà attribué à un autre utilisateur');
  }

  await user.update({
    nifNumber,
    nifStatus: 'VALIDATED',
    nifAttributionDate: new Date()
  });

  // Historique
  await NIFHistory.create({
    userId: user.id,
    nifNumber,
    action: 'VALIDATED',
    reason: 'Approuvé par administrateur',
    performedBy: admin.id,
    metadata: {
      adminName: admin.fullName,
      adminRole: admin.role
    }
  });

  // Notification
  await Notification.create({
    userId: user.id,
    type: 'NIF_STATUS',
    title: 'NIF voamarina',
    message: `Ny NIF anao ${nifNumber} dia voamarina soamantsara. Azonao atao ny manao famaranana.`,
    actionUrl: '/profile'
  });
}

async function rejectNIF(user, rejectionReason, admin) {
  if (!rejectionReason) {
    throw new Error('La raison du rejet est requise');
  }

  await user.update({
    nifStatus: 'REJECTED',
    nifAttributionDate: null
  });

  // Historique
  await NIFHistory.create({
    userId: user.id,
    nifNumber: user.nifNumber,
    action: 'REJECTED',
    reason: rejectionReason,
    performedBy: admin.id,
    metadata: {
      adminName: admin.fullName,
      rejectionReason
    }
  });

  // Notification
  await Notification.create({
    userId: user.id,
    type: 'NIF_STATUS',
    title: 'NIF tsy voamarina',
    message: `Ny fangatahana NIF dia tsy voamarina: ${rejectionReason}. Miantsoa ny fanampiana.`,
    actionUrl: '/profile'
  });
}

module.exports = adminNIFController;