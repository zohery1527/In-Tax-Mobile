// controllers/admin/adminNIFController.js
const { User, NIFHistory, Notification, Zone, Admin, sequelize } = require('../../models');
const { Op } = require('sequelize');

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
        attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'nifNumber', 'nifStatus', 'activityType', 'createdAt', 'zoneId'],
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
      const { action, rejectionReason } = req.body; // Retirer nifNumber

      const user = await User.findByPk(userId, {
        include: [{ model: Zone, as: 'zone' }]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Vérifier que l'utilisateur a bien un NIF
      if (!user.nifNumber) {
        return res.status(400).json({
          success: false,
          message: 'Cet utilisateur n\'a pas encore de numéro NIF'
        });
      }

      // Vérifier que le statut est bien PENDING
      if (user.nifStatus !== 'PENDING') {
        return res.status(400).json({
          success: false,
          message: `Le NIF de cet utilisateur est déjà ${user.nifStatus.toLowerCase()}`
        });
      }

      // Vérifier l'accès (ajoutez cette fonction)
      if (!(await hasAccessToUser(req.admin, user))) {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'avez pas accès à cet utilisateur'
        });
      }

      if (action === 'APPROVE') {
        await approveNIF(user, req.admin);
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
        message: `NIF ${action === 'APPROVE' ? 'approuvé' : 'rejeté'} avec succès`,
        data: { user }
      });

    } catch (error) {
      console.error('Validate NIF error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la validation du NIF',
        error: error.message
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
  
  return { zoneId: { [Op.in]: adminZoneIds } };
}

// AJOUTEZ CETTE FONCTION (manquante)
async function hasAccessToUser(admin, user) {
  if (admin.scope === 'GLOBAL') {
    return true;
  }

  const adminZones = await admin.getZones();
  const adminZoneIds = adminZones.map(z => z.id);
  
  return adminZoneIds.includes(user.zoneId);
}

async function approveNIF(user, admin) {
  // Pas besoin de vérifier le doublon car le NIF est déjà unique dans la BD
  
  // Mettre à jour l'utilisateur
  await user.update({
    nifStatus: 'VALIDATED',
    nifAttributionDate: new Date(),
    validatedBy: admin.id
  });

  // Historique
  await NIFHistory.create({
    userId: user.id,
    nifNumber: user.nifNumber, // Utiliser le nifNumber existant
    action: 'VALIDATED',
    reason: 'Approuvé par administrateur',
    performedBy: admin.id,
    metadata: {
      adminName: admin.fullName,
      adminRole: admin.role,
      attributionDate: new Date().toISOString()
    }
  });

  // Notification
  await Notification.create({
    userId: user.id,
    type: 'NIF_STATUS',
    title: 'NIF voamarina',
    message: `Ny NIF anao ${user.nifNumber} dia voamarina soamantsara. Azonao atao ny manao famaranana.`,
    actionUrl: '/profile',
    metadata: {
      nifNumber: user.nifNumber,
      status: 'VALIDATED'
    }
  });
}

async function rejectNIF(user, rejectionReason, admin) {
  if (!rejectionReason || rejectionReason.trim().length < 5) {
    throw new Error('La raison du rejet est requise (minimum 5 caractères)');
  }

  await user.update({
    nifStatus: 'REJECTED',
    rejectionReason: rejectionReason.trim(),
    validatedBy: admin.id
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
      adminRole: admin.role,
      rejectionReason: rejectionReason
    }
  });

  // Notification
  await Notification.create({
    userId: user.id,
    type: 'NIF_STATUS',
    title: 'NIF tsy voamarina',
    message: `Ny fangatahana NIF dia tsy voamarina: ${rejectionReason}. Miantsoa ny fanampiana.`,
    actionUrl: '/profile',
    metadata: {
      nifNumber: user.nifNumber,
      status: 'REJECTED',
      reason: rejectionReason
    }
  });
}

module.exports = adminNIFController;