// controllers/admin/adminPaymentController.js
const { Payment, User, Declaration, Zone, sequelize } = require('../../models');
const { Op } = require('sequelize'); // Import correct

const adminPaymentController = {

  getPayments: async (req, res) => {
    try {
      const { page = 1, limit = 20, status, provider, startDate, endDate, zoneId } = req.query;
      const admin = req.admin;

      const whereClause = buildPaymentWhereClause(req.query, admin);

      const { count, rows: payments } = await Payment.findAndCountAll({
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
              attributes: ['id', 'name', 'code', 'region']
            }]
          },
          {
            model: Declaration,
            as: 'declaration',
            attributes: ['id', 'period', 'activityType', 'taxAmount', 'status']
          }
        ]
      });

      // Statistiques supplémentaires
      const stats = await getPaymentStats(whereClause);

      res.json({
        success: true,
        data: {
          payments,
          stats,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get payments error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des paiements'
      });
    }
  },

  getPaymentDetail: async (req, res) => {
    try {
      const { paymentId } = req.params;
      const admin = req.admin;

      const payment = await Payment.findByPk(paymentId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'nifNumber', 'zoneId'],
            include: [{
              model: Zone,
              as: 'zone',
              attributes: ['name', 'code', 'region']
            }]
          },
          {
            model: Declaration,
            as: 'declaration',
            attributes: ['id', 'period', 'amount', 'taxAmount', 'status', 'createdAt']
          }
        ]
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Paiement non trouvé'
        });
      }

      // Vérifier l'accès
      if (!(await hasAccessToPayment(admin, payment))) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à ce paiement'
        });
      }

      res.json({
        success: true,
        data: { payment }
      });

    } catch (error) {
      console.error('Get payment detail error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des détails du paiement'
      });
    }
  },

  refundPayment: async (req, res) => {
    try {
      const { paymentId } = req.params;
      const { reason } = req.body;

      if (!reason || reason.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message: 'La raison du remboursement est requise (minimum 5 caractères)'
        });
      }

      const payment = await Payment.findByPk(paymentId, {
        include: [{
          model: User,
          as: 'user'
        }]
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Paiement non trouvé'
        });
      }

      if (payment.status !== 'COMPLETED') {
        return res.status(400).json({
          success: false,
          message: 'Seuls les paiements complétés peuvent être remboursés'
        });
      }

      // Vérifier l'accès
      if (!(await hasAccessToPayment(req.admin, payment))) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à ce paiement'
        });
      }

      // Marquer comme remboursé
      await payment.update({
        status: 'REFUNDED',
        refundedAt: new Date(),
        refundedBy: req.admin.id,
        refundReason: reason.trim()
      });

      // Mettre à jour la déclaration associée
      const declaration = await payment.getDeclaration();
      if (declaration) {
        const newPaidAmount = Math.max(0, declaration.paidAmount - payment.amount);
        const newRemainingAmount = Math.max(0, declaration.taxAmount - newPaidAmount);
        
        await declaration.update({
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: newPaidAmount === 0 ? 'PENDING' : 
                 newPaidAmount >= declaration.taxAmount ? 'PAID' : 'PARTIALLY_PAID'
        });
      }

      // Créer une notification (si le modèle Notification existe)
      try {
        const { Notification } = require('../../models');
        await Notification.create({
          userId: payment.userId,
          type: 'PAYMENT_REFUNDED',
          title: 'Fandoavana namerina',
          message: `Ny fandoavana ${payment.amount.toLocaleString()} Ar dia naverina. Anton-daharana: ${reason}`,
          actionUrl: `/payments/${payment.id}`,
          metadata: {
            paymentId: payment.id,
            amount: payment.amount,
            reason: reason
          }
        });
      } catch (notifError) {
        console.warn('Notification error:', notifError);
        // Ne pas bloquer le processus si la notification échoue
      }

      // Audit log (si le modèle AuditLog existe)
      try {
        const { AuditLog } = require('../../models');
        await AuditLog.create({
          adminId: req.admin.id,
          action: 'PAYMENT_REFUND',
          resource: 'PAYMENT',
          resourceId: payment.id,
          details: {
            paymentId: payment.id,
            amount: payment.amount,
            reason: reason,
            previousStatus: 'COMPLETED',
            newStatus: 'REFUNDED'
          }
        });
      } catch (auditError) {
        console.warn('Audit log error:', auditError);
      }

      res.json({
        success: true,
        message: 'Paiement remboursé avec succès',
        data: { 
          payment,
          refund: {
            date: new Date(),
            amount: payment.amount,
            reason: reason
          }
        }
      });

    } catch (error) {
      console.error('Refund payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du remboursement du paiement'
      });
    }
  },

  // Nouvelle fonction: Statistiques des paiements
  getPaymentStatistics: async (req, res) => {
    try {
      const { startDate, endDate, zoneId } = req.query;
      const admin = req.admin;

      const whereClause = {};
      
      // Filtre date
      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
        if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
      }

      // Statistiques par statut
      const statusStats = await Payment.findAll({
        where: whereClause,
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'total']
        ],
        group: ['status'],
        raw: true
      });

      // Statistiques par mois
      const monthlyStats = await Payment.findAll({
        where: {
          ...whereClause,
          status: 'COMPLETED'
        },
        attributes: [
          [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'month'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'total']
        ],
        group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'DESC']],
        limit: 12,
        raw: true
      });

      // Top 5 utilisateurs
      const topUsers = await Payment.findAll({
        where: {
          ...whereClause,
          status: 'COMPLETED'
        },
        attributes: [
          'userId',
          [sequelize.fn('COUNT', sequelize.col('Payment.id')), 'paymentCount'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'totalPaid']
        ],
        include: [{
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'nifNumber']
        }],
        group: ['userId', 'user.id'],
        order: [[sequelize.fn('SUM', sequelize.col('amount')), 'DESC']],
        limit: 5,
        raw: true
      });

      res.json({
        success: true,
        data: {
          statusStats,
          monthlyStats,
          topUsers: topUsers.filter(u => u.user),
          summary: {
            totalTransactions: statusStats.reduce((sum, stat) => sum + parseInt(stat.count), 0),
            totalRevenue: statusStats
              .filter(stat => stat.status === 'COMPLETED')
              .reduce((sum, stat) => sum + parseFloat(stat.total || 0), 0)
          }
        }
      });

    } catch (error) {
      console.error('Get payment statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  }
};

// Helper functions
function buildPaymentWhereClause(query, admin) {
  const whereClause = {};

  // Filtres de base
  if (query.status) whereClause.status = query.status;
  if (query.provider) whereClause.provider = query.provider;
  if (query.userId) whereClause.userId = query.userId;
  if (query.declarationId) whereClause.declarationId = query.declarationId;

  // Filtre date - CORRIGÉ avec Op importé
  if (query.startDate || query.endDate) {
    whereClause.createdAt = {};
    if (query.startDate) whereClause.createdAt[Op.gte] = new Date(query.startDate);
    if (query.endDate) whereClause.createdAt[Op.lte] = new Date(query.endDate);
  }

  // Filtre zone
  if (admin && admin.scope && admin.scope !== 'GLOBAL') {
    // Si l'admin a des zones, filtrer par zone
    if (admin.zoneIds && admin.zoneIds.length > 0) {
      whereClause['$user.zoneId$'] = { 
        [Op.in]: admin.zoneIds 
      };
    } else if (admin.zoneId) {
      // Si l'admin a une seule zone
      whereClause['$user.zoneId$'] = admin.zoneId;
    }
  }

  return whereClause;
}

async function getPaymentStats(whereClause) {
  try {
    const totalRevenue = await Payment.sum('amount', {
      where: { ...whereClause, status: 'COMPLETED' }
    });

    const completedCount = await Payment.count({
      where: { ...whereClause, status: 'COMPLETED' }
    });

    const pendingCount = await Payment.count({
      where: { ...whereClause, status: 'PENDING' }
    });

    const failedCount = await Payment.count({
      where: { ...whereClause, status: 'FAILED' }
    });

    const refundedCount = await Payment.count({
      where: { ...whereClause, status: 'REFUNDED' }
    });

    return {
      totalRevenue: totalRevenue || 0,
      completedCount,
      pendingCount,
      failedCount,
      refundedCount,
      totalCount: completedCount + pendingCount + failedCount + refundedCount
    };
  } catch (error) {
    console.error('Get payment stats error:', error);
    return {
      totalRevenue: 0,
      completedCount: 0,
      pendingCount: 0,
      failedCount: 0,
      refundedCount: 0,
      totalCount: 0
    };
  }
}

async function hasAccessToPayment(admin, payment) {
  try {
    // Si admin est GLOBAL, accès complet
    if (!admin || admin.scope === 'GLOBAL') {
      return true;
    }

    // Récupérer l'utilisateur du paiement
    const user = await payment.getUser();
    if (!user) {
      return false;
    }

    // Si l'admin a une zone unique
    if (admin.zoneId) {
      return admin.zoneId === user.zoneId;
    }

    // Si l'admin a plusieurs zones
    if (admin.getZones) {
      const adminZones = await admin.getZones();
      if (!adminZones || !Array.isArray(adminZones)) {
        return false;
      }
      const adminZoneIds = adminZones.map(z => z.id);
      return adminZoneIds.includes(user.zoneId);
    }

    // Si admin.zoneIds existe directement
    if (admin.zoneIds && Array.isArray(admin.zoneIds)) {
      return admin.zoneIds.includes(user.zoneId);
    }

    return false;
  } catch (error) {
    console.error('Has access to payment error:', error);
    return false;
  }
}

module.exports = adminPaymentController;