const db = require('../models');
const { User, Declaration, Payment, Zone, NIFHistory } = db;

const adminController = {
  async getDashboard(req, res) {
    try {
      const totalUsers = await User.count();
      const totalDeclarations = await Declaration.count();
      const totalPayments = await Payment.count({ where: { status: 'COMPLETED' } });
      const totalRevenue = await Payment.sum('amount', { where: { status: 'COMPLETED' } }) || 0;

      const recentDeclarations = await Declaration.findAll({
        where: { status: "PENDING" },
        limit: 5,
        order: [['createdAt', 'DESC']],
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'phoneNumber'],
          include: [{
            model: Zone,
            as: 'zone',
            attributes: ['name']
          }]
        }]
      });

      res.json({
        success: true,
        data: {
          stats: {
            totalUsers,
            totalDeclarations,
            totalPayments,
            totalRevenue,
            pendingDeclarations: await Declaration.count({ where: { status: 'PENDING' } })
          },
          recentDeclarations
        }
      });
    } catch (error) {
      console.error("Erreur dashboard:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération du dashboard"
      });
    }
  },

  async validateNIF(req, res) {
    try {
      const { userId, action, reason } = req.body;
      
      if (!['VALIDATED', 'REJECTED'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: "Action doit être 'VALIDATED' ou 'REJECTED'"
        });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé"
        });
      }

      await user.update({ nifStatus: action });

      await NIFHistory.create({
        userId,
        nifNumber: user.nifNumber,
        action: action,
        reason: reason,
        performedBy: req.user.id,
        metadata: {
          validatedAt: new Date().toISOString(),
          validatorRole: req.user.role
        }
      });

      res.json({
        success: true,
        message: `NIF ${action === 'VALIDATED' ? 'validé' : 'rejeté'}`,
        data: {
          user: {
            id: user.id,
            nifNumber: user.nifNumber,
            nifStatus: action
          }
        }
      });
    } catch (error) {
      console.error("Erreur validation NIF:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la validation du NIF"
      });
    }
  },

  async getPendingDeclarations(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      
      const declarations = await Declaration.findAndCountAll({
        where: { status: 'PENDING' },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'nifNumber', 'nifStatus'],
          include: [{
            model: Zone,
            as: 'zone',
            attributes: ['name', 'region']
          }]
        }],
        order: [['createdAt', 'ASC']],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });

      res.json({
        success: true,
        data: {
          declarations: declarations.rows,
          total: declarations.count,
          page: parseInt(page),
          totalPages: Math.ceil(declarations.count / limit)
        }
      });
    } catch (error) {
      console.error('Erreur liste déclarations:', error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des déclarations"
      });
    }
  },

  async validateDeclaration(req, res) {
    try {
      const { declarationId } = req.params;

      const declaration = await Declaration.findByPk(declarationId, {
        include: [{
          model: User,
          as: 'user'
        }]
      });

      if (!declaration) {
        return res.status(404).json({
          success: false,
          message: "Déclaration non trouvée"
        });
      }

      if (declaration.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          message: "Cette déclaration a déjà été traitée"
        });
      }

      await declaration.update({ status: "VALIDATED" });

      res.json({
        success: true,
        message: "Déclaration validée avec succès"
      });
    } catch (error) {
      console.error("Erreur validation déclaration:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la validation de la déclaration"
      });
    }
  },

  async confirmPaymentManual(req, res) {
    try {
      const { paymentId } = req.params;

      const payment = await Payment.findByPk(paymentId, {
        include: [
          { model: Declaration, as: 'declaration' },
          { model: User, as: 'user' }
        ]
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Paiement non trouvé"
        });
      }

      payment.status = 'COMPLETED';
      payment.metadata = {
        ...payment.metadata,
        manuallyConfirmed: true,
        confirmedBy: req.user.id,
        confirmedAt: new Date().toISOString()
      };

      await payment.save();
      await payment.declaration.update({ status: 'PAID' });

      res.json({
        success: true,
        message: "Paiement confirmé manuellement",
        data: { payment }
      });
    } catch (error) {
      console.error("Erreur confirmation manuelle:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la confirmation du paiement"
      });
    }
  },

  async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 20, role, zoneId } = req.query;
      
      const whereClause = {};
      if (role) whereClause.role = role;
      if (zoneId) whereClause.zoneId = zoneId;

      if (req.user.role === 'AGENT') {
        whereClause.zoneId = req.user.zoneId;
        whereClause.role = 'VENDEUR';
      }

      const users = await User.findAndCountAll({
        where: whereClause,
        include: [{
          model: Zone,
          as: 'zone',
          attributes: ['name', 'region']
        }],
        attributes: { exclude: ['password'] },
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          users: users.rows,
          total: users.count,
          page: parseInt(page),
          totalPages: Math.ceil(users.count / limit)
        }
      });
    } catch (error) {
      console.error('Erreur liste utilisateurs:', error);
      res.status(500).json({
        success: false,

        message: "Erreur lors de la récupération des utilisateurs"
      });
    }
  }
};

module.exports = adminController;