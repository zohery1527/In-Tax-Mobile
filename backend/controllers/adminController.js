const db = require('../models');
const { User, Declaration, Payment, Zone, NIFHistory } = db;
const ExportUtils = require('../utils/exportUtils');

const adminController = {

  // 🧭 DASHBOARD
  async getDashboard(req, res) {
    try {
      const [
        totalUsers,
        totalDeclarations,
        totalPayments,
        totalRevenue,
        pendingDeclarations,
        recentDeclarations
      ] = await Promise.all([
        User.count(),
        Declaration.count(),
        Payment.count({ where: { status: 'COMPLETED' } }),
        Payment.sum('amount', { where: { status: 'COMPLETED' } }).then(sum => sum || 0),
        Declaration.count({ where: { status: 'PENDING' } }),
        Declaration.findAll({
          where: { status: "PENDING" },
          limit: 5,
          order: [['createdAt', 'DESC']],
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'phoneNumber'],
            include: [{ model: Zone, as: 'zone', attributes: ['name'] }]
          }]
        })
      ]);

      res.json({
        success: true,
        data: {
          stats: {
            totalUsers,
            totalDeclarations,
            totalPayments,
            totalRevenue,
            pendingDeclarations
          },
          recentDeclarations
        }
      });
    } catch (error) {
      console.error("Erreur dashboard:", error);
      res.status(500).json({ success: false, message: "Erreur lors de la récupération du dashboard" });
    }
  },

  // 🧾 VALIDATION NIF
  async validateNIF(req, res) {
    try {
      const { userId, action, reason } = req.body;
      if (!userId || !action) {
        return res.status(400).json({ success: false, message: "Paramètres manquants" });
      }

      if (!['VALIDATED', 'REJECTED'].includes(action)) {
        return res.status(400).json({ success: false, message: "Action invalide" });
      }

      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });

      await user.update({ nifStatus: action });

      await NIFHistory.create({
        userId,
        nifNumber: user.nifNumber,
        action,
        reason: reason || '',
        performedBy: req.user?.id || null,
        metadata: {
          validatedAt: new Date().toISOString(),
          validatorRole: req.user?.role || 'SYSTEM'
        }
      });

      res.json({
        success: true,
        message: `NIF ${action === 'VALIDATED' ? 'validé' : 'rejeté'}`,
        data: { user: { id: user.id, nifNumber: user.nifNumber, nifStatus: action } }
      });
    } catch (error) {
      console.error("Erreur validation NIF:", error);
      res.status(500).json({ success: false, message: "Erreur lors de la validation du NIF" });
    }
  },

  // 📋 DÉCLARATIONS EN ATTENTE
  async getPendingDeclarations(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const declarations = await Declaration.findAndCountAll({
        where: { status: 'PENDING' },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'nifNumber', 'nifStatus'],
          include: [{ model: Zone, as: 'zone', attributes: ['name', 'region'] }]
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
          totalPages: Math.ceil(declarations.count / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Erreur liste déclarations:', error);
      res.status(500).json({ success: false, message: "Erreur lors de la récupération des déclarations" });
    }
  },

  // ✅ VALIDATION DÉCLARATION
  async validateDeclaration(req, res) {
    try {
      const { declarationId } = req.params;
      const declaration = await Declaration.findByPk(declarationId, { include: [{ model: User, as: 'user' }] });

      if (!declaration) return res.status(404).json({ success: false, message: "Déclaration non trouvée" });
      if (declaration.status !== 'PENDING') {
        return res.status(400).json({ success: false, message: "Cette déclaration a déjà été traitée" });
      }

      await declaration.update({ status: "VALIDATED" });
      res.json({ success: true, message: "Déclaration validée avec succès" });
    } catch (error) {
      console.error("Erreur validation déclaration:", error);
      res.status(500).json({ success: false, message: "Erreur lors de la validation de la déclaration" });
    }
  },

  // 💰 CONFIRMATION PAIEMENT MANUEL
  async confirmPaymentManual(req, res) {
    try {
      const { paymentId } = req.params;
      const payment = await Payment.findByPk(paymentId, {
        include: [
          { model: Declaration, as: 'declaration' },
          { model: User, as: 'user' }
        ]
      });

      if (!payment) return res.status(404).json({ success: false, message: "Paiement non trouvé" });

      await payment.update({
        status: 'COMPLETED',
        metadata: {
          ...payment.metadata,
          manuallyConfirmed: true,
          confirmedBy: req.user?.id || null,
          confirmedAt: new Date().toISOString()
        }
      });

      if (payment.declaration) {
        await payment.declaration.update({ status: 'PAID' });
      }

      res.json({ success: true, message: "Paiement confirmé manuellement", data: { payment } });
    } catch (error) {
      console.error("Erreur confirmation manuelle:", error);
      res.status(500).json({ success: false, message: "Erreur lors de la confirmation du paiement" });
    }
  },

  // 👥 LISTE UTILISATEURS
  async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 20, role, zoneId } = req.query;
      const whereClause = {};

      if (role) whereClause.role = role;
      if (zoneId) whereClause.zoneId = zoneId;
      if (req.user?.role === 'AGENT') {
        whereClause.zoneId = req.user.zoneId;
        whereClause.role = 'VENDEUR';
      }

      const users = await User.findAndCountAll({
        where: whereClause,
        include: [{ model: Zone, as: 'zone', attributes: ['name', 'region'] }],
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
          totalPages: Math.ceil(users.count / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Erreur liste utilisateurs:', error);
      res.status(500).json({ success: false, message: "Erreur lors de la récupération des utilisateurs" });
    }
  },

  // 📤 EXPORT DONNÉES
  async exportData(req, res) {
    try {
      const { type } = req.params;
      const { format = 'csv' } = req.query;
      let data, filename, headers, fields;

      // Sélection du type de données
      switch (type) {
        case 'users':
          data = await User.findAll({
            include: [{ model: Zone, as: 'zone', attributes: ['name', 'region'] }],
            attributes: ['firstName', 'lastName', 'phoneNumber', 'nifNumber', 'nifStatus', 'activityType', 'createdAt', 'isActive'],
            raw: true
          });
          data = data.map(u => ({
            'Prénom': u.firstName,
            'Nom': u.lastName,
            'Téléphone': u.phoneNumber,
            'NIF': u.nifNumber,
            'Statut NIF': u.nifStatus,
            'Activité': u.activityType,
            'Région': u['zone.name'],
            'Date inscription': new Date(u.createdAt).toLocaleDateString('fr-FR'),
            'Statut': u.isActive ? 'Actif' : 'Inactif'
          }));
          filename = `utilisateurs_${new Date().toISOString().split('T')[0]}`;
          headers = fields = Object.keys(data[0] || {});
          break;

        // autres cas (déclarations, paiements) restent identiques...
      }

      if (!data?.length) return res.status(404).json({ success: false, message: "Aucune donnée à exporter" });

      switch (format.toLowerCase()) {
        case 'csv':
          const csv = ExportUtils.generateCSV(data, fields);
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
          return res.send(csv);

        case 'pdf':
          const pdf = await ExportUtils.generatePDFTable(data, headers, `Export ${type}`, headers);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
          return res.send(pdf);

        case 'excel':
          const excel = await ExportUtils.generateExcel(data, headers, `Export ${type}`);
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
          return res.send(excel);

        default:
          return res.status(400).json({ success: false, message: "Format non supporté" });
      }

    } catch (error) {
      console.error("Erreur export:", error);
      res.status(500).json({ success: false, message: "Erreur lors de l'export des données" });
    }
  },

  // 📊 RÉSUMÉ STATISTIQUES
  async getSummary(req, res) {
    try {
      const revenueByRegion = await Declaration.findAll({
        include: [{
          model: User,
          as: 'user',
          attributes: [],
          include: [{ model: Zone, as: 'zone', attributes: ['name'] }]
        }],
        where: { status: 'PAID' },
        attributes: [
          [db.Sequelize.col('user.zone.name'), 'region'],
          [db.Sequelize.fn('SUM', db.Sequelize.col('taxAmount')), 'revenue']
        ],
        group: ['user.zone.name', 'user->zone.name'],
        raw: true
      });

      const topSellers = await User.findAll({
        where: { role: 'VENDEUR' },
        include: [{
          model: Declaration,
          as: 'declarations',
          attributes: []
        }],
        attributes: [
          'id', 'firstName', 'lastName', 'phoneNumber',
          [db.Sequelize.fn('COUNT', db.Sequelize.col('declarations.id')), 'declarationCount'],
          [db.Sequelize.fn('SUM', db.Sequelize.col('declarations.taxAmount')), 'totalRevenue']
        ],
        group: ['User.id'],
        order: [[db.Sequelize.literal('totalRevenue'), 'DESC']],
        limit: 10,
        raw: true
      });

      const monthlyStats = await Declaration.findAll({
        attributes: [
          [db.Sequelize.fn('DATE_TRUNC', 'month', db.Sequelize.col('createdAt')), 'month'],
          [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'declarationCount'],
          [db.Sequelize.fn('SUM', db.Sequelize.col('taxAmount')), 'totalRevenue']
        ],
        group: [db.Sequelize.fn('DATE_TRUNC', 'month', db.Sequelize.col('createdAt'))],
        order: [[db.Sequelize.fn('DATE_TRUNC', 'month', db.Sequelize.col('createdAt')), 'ASC']],
        raw: true
      });

      res.json({
        success: true,
        data: { revenueByRegion, topSellers, monthlyStats }
      });
    } catch (error) {
      console.error("Erreur résumé:", error);
      res.status(500).json({ success: false, message: "Erreur lors de la récupération du résumé" });
    }
  }
};

module.exports = adminController;
