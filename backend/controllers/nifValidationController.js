// controllers/nifValidationController.js
const nifValidationController = {

  // Liste des demandes NIF en attente
  getPendingNIFRequests: async (req, res) => {
    try {
      const { page = 1, limit = 20, zoneId } = req.query;
      const admin = req.admin;

      const whereClause = { nifStatus: 'PENDING' };
      
      // Appliquer le filtre de zone si nécessaire
      if (admin.scope !== 'GLOBAL') {
        const adminZones = await admin.getZones();
        const zoneIds = adminZones.map(z => z.id);
        
        if (zoneId && zoneIds.includes(parseInt(zoneId))) {
          whereClause.zoneId = zoneId;
        } else if (zoneIds.length > 0) {
          whereClause.zoneId = { [sequelize.Op.in]: zoneIds };
        }
      } else if (zoneId) {
        whereClause.zoneId = zoneId;
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

  // Valider ou rejeter un NIF
  validateNIF: async (req, res) => {
    try {
      const { userId } = req.params;
      const { action, nifNumber, rejectionReason } = req.body; // 'APPROVE' or 'REJECT'

      const user = await User.findByPk(userId, {
        include: [{
          model: Zone,
          as: 'zone'
        }]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Vérifier que l'admin a accès à la zone de l'utilisateur
      if (req.admin.scope !== 'GLOBAL') {
        const adminZones = await req.admin.getZones();
        const adminZoneIds = adminZones.map(z => z.id);
        
        if (!adminZoneIds.includes(user.zoneId)) {
          return res.status(403).json({
            success: false,
            message: 'Vous n\'avez pas accès à cette zone'
          });
        }
      }

      if (action === 'APPROVE') {
        if (!nifNumber) {
          return res.status(400).json({
            success: false,
            message: 'Le numéro NIF est requis pour l\'approbation'
          });
        }

        // Vérifier si le NIF existe déjà
        const existingUser = await User.findOne({ 
          where: { nifNumber, id: { [sequelize.Op.ne]: userId } }
        });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Ce numéro NIF est déjà attribué à un autre utilisateur'
          });
        }

        await user.update({
          nifNumber,
          nifStatus: 'VALIDATED',
          nifAttributionDate: new Date()
        });

        // Historique
        await NIFHistory.create({
          userId,
          nifNumber,
          action: 'VALIDATED',
          reason: 'Approuvé par administrateur',
          performedBy: req.admin.id,
          metadata: {
            adminName: req.admin.fullName,
            adminRole: req.admin.role
          }
        });

        // Notification
        await Notification.create({
          userId,
          type: 'NIF_STATUS',
          title: 'NIF voamarina',
          message: `Ny NIF anao ${nifNumber} dia voamarina soamantsara. Azonao atao ny manao famaranana.`,
          actionUrl: '/profile'
        });

      } else if (action === 'REJECT') {
        if (!rejectionReason) {
          return res.status(400).json({
            success: false,
            message: 'La raison du rejet est requise'
          });
        }

        await user.update({
          nifStatus: 'REJECTED',
          nifAttributionDate: null
        });

        // Historique
        await NIFHistory.create({
          userId,
          nifNumber: user.nifNumber,
          action: 'REJECTED',
          reason: rejectionReason,
          performedBy: req.admin.id,
          metadata: {
            adminName: req.admin.fullName,
            rejectionReason
          }
        });

        // Notification
        await Notification.create({
          userId,
          type: 'NIF_STATUS',
          title: 'NIF tsy voamarina',
          message: `Ny fangatahana NIF dia tsy voamarina: ${rejectionReason}. Miantsoa ny fanampiana.`,
          actionUrl: '/profile'
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
  },

  // Export des validations NIF
  exportNIFValidations: async (req, res) => {
    try {
      const { startDate, endDate, format = 'pdf' } = req.query;
      const admin = req.admin;

      const whereClause = {};
      
      // Filtre date
      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt[sequelize.Op.gte] = new Date(startDate);
        if (endDate) whereClause.createdAt[sequelize.Op.lte] = new Date(endDate);
      }

      // Filtre zone
      if (admin.scope !== 'GLOBAL') {
        const adminZones = await admin.getZones();
        const zoneIds = adminZones.map(z => z.id);
        whereClause['$user.zoneId$'] = { [sequelize.Op.in]: zoneIds };
      }

      const nifHistory = await NIFHistory.findAll({
        where: whereClause,
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
            model: Admin,
            as: 'admin',
            attributes: ['fullName', 'role'],
            required: false
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      if (format === 'pdf') {
        // Générer PDF
        const pdfBuffer = await generateNIFPDFReport(nifHistory, admin);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 
          `attachment; filename="rapport-nif-${new Date().toISOString().split('T')[0]}.pdf"`);
        
        return res.send(pdfBuffer);
      } else {
        // Export Excel
        const excelBuffer = await generateNIFExcelReport(nifHistory, admin);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition',
          `attachment; filename="rapport-nif-${new Date().toISOString().split('T')[0]}.xlsx"`);
        
        return res.send(excelBuffer);
      }

    } catch (error) {
      console.error('Export NIF validations error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'export des validations NIF'
      });
    }
  }
};