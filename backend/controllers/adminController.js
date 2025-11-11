const db = require('../models');
const { User, Declaration, Payment, Zone, NIFHistory } = db;
const ExportUtils = require('../utils/exportUtils');

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
  },

  async exportData(req, res) {
  try {
    const { type } = req.params;
    const { format = 'csv' } = req.query;

    let data, filename, headers, fields;

    switch (type) {
      case 'users':
        data = await User.findAll({
          include: [{ 
            model: Zone, 
            as: 'zone',
            attributes: ['name', 'region']
          }],
          attributes: [
            'firstName', 'lastName', 'phoneNumber', 
            'nifNumber', 'nifStatus', 'activityType', 
            'createdAt', 'isActive'
          ],
          raw: true
        });
        
        // Mapping pour l'export
        data = data.map(user => ({
          'Prénom': user.firstName,
          'Nom': user.lastName,
          'Téléphone': user.phoneNumber,
          'NIF': user.nifNumber,
          'Statut NIF': user.nifStatus,
          'Activité': user.activityType,
          'Région': user['zone.name'],
          'Date inscription': new Date(user.createdAt).toLocaleDateString('fr-FR'),
          'Statut': user.isActive ? 'Actif' : 'Inactif'
        }));

        filename = `utilisateurs_in-tax_${new Date().toISOString().split('T')[0]}`;
        headers = ['Prénom', 'Nom', 'Téléphone', 'NIF', 'Statut NIF', 'Activité', 'Région', 'Date inscription', 'Statut'];
        fields = headers;
        break;

      case 'declarations':
        data = await Declaration.findAll({
          include: [{
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName', 'phoneNumber'],
            include: [{ 
              model: Zone, 
              as: 'zone', 
              attributes: ['name'] 
            }]
          }],
          attributes: ['period', 'amount', 'taxAmount', 'status', 'activityType', 'createdAt'],
          raw: true
        });

        data = data.map(declaration => ({
          'Période': declaration.period,
          'Montant': declaration.amount,
          'Taxe': declaration.taxAmount,
          'Statut': declaration.status,
          'Activité': declaration.activityType,
          'Date': new Date(declaration.createdAt).toLocaleDateString('fr-FR'),
          'Vendeur': `${declaration['user.firstName']} ${declaration['user.lastName']}`,
          'Téléphone': declaration['user.phoneNumber'],
          'Région': declaration['user.zone.name']
        }));

        filename = `declarations_in-tax_${new Date().toISOString().split('T')[0]}`;
        headers = ['Période', 'Montant', 'Taxe', 'Statut', 'Activité', 'Date', 'Vendeur', 'Téléphone', 'Région'];
        fields = headers;
        break;

      case 'payments':
        data = await Payment.findAll({
          include: [
            { 
              model: User, 
              as: 'user', 
              attributes: ['firstName', 'lastName', 'phoneNumber'] 
            },
            { 
              model: Declaration, 
              as: 'declaration', 
              attributes: ['period'] 
            }
          ],
          attributes: ['amount', 'provider', 'status', 'createdAt', 'transactionId'],
          raw: true
        });

        data = data.map(payment => ({
          'Montant': payment.amount,
          'Moyen de paiement': payment.provider,
          'Statut': payment.status,
          'Date': new Date(payment.createdAt).toLocaleDateString('fr-FR'),
          'Transaction': payment.transactionId,
          'Vendeur': `${payment['user.firstName']} ${payment['user.lastName']}`,
          'Téléphone': payment['user.phoneNumber'],
          'Période': payment['declaration.period']
        }));

        filename = `paiements_in-tax_${new Date().toISOString().split('T')[0]}`;
        headers = ['Montant', 'Moyen de paiement', 'Statut', 'Date', 'Transaction', 'Vendeur', 'Téléphone', 'Période'];
        fields = headers;
        break;

      case 'dashboard':
        // Données agrégées pour le dashboard
        const dashboardData = await getDashboardData();
        data = [dashboardData];
        filename = `dashboard_in-tax_${new Date().toISOString().split('T')[0]}`;
        headers = ['Métrique', 'Valeur'];
        fields = headers;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Type d'export non supporté"
        });
    }

    // Génération selon le format
    switch (format.toLowerCase()) {
      case 'csv':
        const csvContent = ExportUtils.generateCSV(data, fields);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        return res.send(csvContent);

      case 'pdf':
        const pdfContent = await ExportUtils.generatePDFTable(data, headers, `Export ${type} - In-Tax`, headers);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
        return res.send(pdfContent);

      case 'excel':
        const excelContent = await ExportUtils.generateExcel(data, headers, `Export ${type}`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
        return res.send(excelContent);

      default:
        return res.status(400).json({
          success: false,
          message: "Format d'export non supporté"
        });
    }

  } catch (error) {
    console.error("Erreur export:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'export des données: " + error.message
    });
  }
},

// Helper pour les données dashboard

async  getDashboardData() {
  const totalUsers = await User.count();
  const totalDeclarations = await Declaration.count();
  const totalPayments = await Payment.count({ where: { status: 'COMPLETED' } });
  const totalRevenue = await Payment.sum('amount', { where: { status: 'COMPLETED' } }) || 0;
  const pendingDeclarations = await Declaration.count({ where: { status: 'PENDING' } });

  return {
    'Métrique': 'Statistiques Dashboard',
    'Valeur': `Utilisateurs: ${totalUsers} | Déclarations: ${totalDeclarations} | Paiements: ${totalPayments} | Revenus: ${totalRevenue} MGA | En attente: ${pendingDeclarations}`
  };
}

};

module.exports = adminController;