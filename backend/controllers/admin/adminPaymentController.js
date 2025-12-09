// controllers/admin/adminPaymentController.js
const { Payment, User, Declaration, Zone, sequelize } = require('../../models');

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
            attributes: ['firstName', 'lastName', 'phoneNumber'],
            include: [{
              model: Zone,
              as: 'zone',
              attributes: ['name', 'code']
            }]
          },
          {
            model: Declaration,
            as: 'declaration',
            attributes: ['period', 'activityType', 'taxAmount']
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
            attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'nifNumber'],
            include: [{
              model: Zone,
              as: 'zone',
              attributes: ['name', 'code', 'region']
            }]
          },
          {
            model: Declaration,
            as: 'declaration',
            attributes: ['id', 'period', 'amount', 'taxAmount', 'status']
          }
        ]
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Paiement non trouvé'
        });
      }

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
        refundReason: reason
      });

      // Mettre à jour la déclaration
      const declaration = await payment.getDeclaration();
      if (declaration) {
        const newPaidAmount = Math.max(0, declaration.paidAmount - payment.amount);
        await declaration.update({
          paidAmount: newPaidAmount,
          remainingAmount: declaration.taxAmount - newPaidAmount,
          status: newPaidAmount === 0 ? 'PENDING' : 'PARTIALLY_PAID'
        });
      }

      // Notification
      await req.app.get('models').Notification.create({
        userId: payment.userId,
        type: 'PAYMENT_REFUNDED',
        title: 'Fandoavana namerina',
        message: `Ny fandoavana ${payment.amount} Ar dia naverina. Anton-daharana: ${reason}`,
        actionUrl: `/payments/${payment.id}`
      });

      res.json({
        success: true,
        message: 'Paiement remboursé avec succès',
        data: { payment }
      });

    } catch (error) {
      console.error('Refund payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du remboursement du paiement'
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

  // Filtre date
  if (query.startDate || query.endDate) {
    whereClause.createdAt = {};
    if (query.startDate) whereClause.createdAt[sequelize.Op.gte] = new Date(query.startDate);
    if (query.endDate) whereClause.createdAt[sequelize.Op.lte] = new Date(query.endDate);
  }

  // Filtre zone
  if (admin.scope !== 'GLOBAL') {
    whereClause['$user.zoneId$'] = { 
      [sequelize.Op.in]: admin.zoneIds || [] 
    };
  }

  return whereClause;
}

async function getPaymentStats(whereClause) {
  const totalRevenue = await Payment.sum('amount', {
    where: { ...whereClause, status: 'COMPLETED' }
  });

  const completedCount = await Payment.count({
    where: { ...whereClause, status: 'COMPLETED' }
  });

  const pendingCount = await Payment.count({
    where: { ...whereClause, status: 'PENDING' }
  });

  return {
    totalRevenue: totalRevenue || 0,
    completedCount,
    pendingCount
  };
}

async function hasAccessToPayment(admin, payment) {
  if (admin.scope === 'GLOBAL') return true;
  
  const user = await payment.getUser();
  const adminZones = await admin.getZones();
  const adminZoneIds = adminZones.map(z => z.id);
  
  return adminZoneIds.includes(user.zoneId);
}

module.exports = adminPaymentController;