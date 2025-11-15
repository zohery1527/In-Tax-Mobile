const db = require('../models');
const smsService = require('../services/SMSService');

const { Declaration, User, Zone, Payment } = db;

const declarationController = {
  async createDeclaration(req, res) {
    try {
      const { amount, period, activityType, description } = req.body;
      const userId = req.user.id;

      if (req.user.nifStatus !== 'VALIDATED') {
        return res.status(400).json({
          success: false,
          message: 'Votre NIF doit être validé avant de faire des déclarations'
        });
      }

      const requiredFields = ['amount', 'period', 'activityType'];
      const missingFields = requiredFields.filter(field => !req.body[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Champs manquants: ${missingFields.join(', ')}`
        });
      }

      const periodRegex = /^\d{4}-\d{2}$/;
      if (!periodRegex.test(period)) {
        return res.status(400).json({
          success: false,
          message: 'Format de période invalide (YYYY-MM requis)'
        });
      }

      const existingDeclaration = await Declaration.findOne({
        where: { userId, period }
      });

      if (existingDeclaration) {
        return res.status(400).json({
          success: false,
          message: "Une déclaration existe déjà pour cette période"
        });
      }

      const taxAmount = parseFloat((amount * 0.02).toFixed(2));

      const declaration = await Declaration.create({
        userId,
        nifNumber: req.user.nifNumber,
        amount: parseFloat(amount),
        period,
        description,
        taxAmount,
        activityType,
        status: 'PENDING'
      });

      try {
        await smsService.sendDeclarationSubmitted(
          req.user.phoneNumber,
          period,
          taxAmount
        );
        console.log('✅ SMS déclaration soumise envoyé');
      } catch (smsError) {
        console.error('❌ Erreur envoi SMS déclaration:', smsError);
      }

      res.status(201).json({
        success: true,
        message: "Déclaration créée avec succès",
        data: declaration
      });

    } catch (error) {
      console.error("Erreur création déclaration:", error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  async getUserDeclarations(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, status } = req.query;

      const whereClause = { userId };
      if (status) {
        whereClause.status = status;
      }

      const declarations = await Declaration.findAndCountAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'phoneNumber', 'nifNumber']
        }],
        order: [['createdAt', 'DESC']],
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
        message: error.message
      });
    }
  },

  // FONCTION CORRIGÉE ICI
  async getDeclaration(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Correction : Si l'ID est 'stats', nous appelons la fonction de statistiques.
      // Cela évite l'erreur de conversion 'stats' en UUID.
      if (id === 'stats') {
          return declarationController.getDeclarationsStatus(req, res);
      }

      // Recherche normale par ID (qui est censé être un UUID)
      const declaration = await Declaration.findOne({
        where: { id, userId },
        include: [{
          model: User,
          as: 'user',
          include: [{ model: Zone, as: 'zone' }]
        }]
      });

      if (!declaration) {
        return res.status(404).json({
          success: false,
          message: "Déclaration non trouvée"
        });
      }

      res.json({
        success: true,
        data: { declaration }
      });
    } catch (error) {
      console.error("Erreur déclaration:", error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },


async updateDeclaration(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { amount, description } = req.body;

        const declaration = await Declaration.findOne({
            where: { id, userId },
            include: [{
                model: Payment,
                as: 'payment',
                attributes: ['id', 'status']
            }]
        });

        if (!declaration) {
            return res.status(404).json({
                success: false,
                message: "Déclaration non trouvée"
            });
        }

        // BLOQUER si déclaration payée
        if (declaration.status === 'PAID') {
            return res.status(400).json({
                success: false,
                message: "Impossible de modifier une déclaration déjà payée"
            });
        }

        // BLOQUER si paiement en cours
        if (declaration.payment && declaration.payment.status === 'COMPLETED') {
            return res.status(400).json({
                success: false,
                message: "Impossible de modifier une déclaration avec un paiement complété"
            });
        }

        if (amount) {
            declaration.amount = parseFloat(amount);
            declaration.taxAmount = parseFloat((amount * 0.02).toFixed(2));
        }

        if (description !== undefined) {
            declaration.description = description;
        }

        await declaration.save();

        res.json({
            success: true,
            message: "Déclaration mise à jour",
            data: { declaration }
        });

    } catch (error) {
        console.error("Erreur mise à jour déclaration:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
},
async deleteDeclaration(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const declaration = await Declaration.findOne({
            where: { id, userId },
            include: [{
                model: Payment,
                as: 'payment',
                attributes: ['id', 'status']
            }]
        });

        if (!declaration) {
            return res.status(404).json({
                success: false,
                message: "Déclaration non trouvée"
            });
        }

        // BLOQUER si déclaration payée
        if (declaration.status === 'PAID') {
            return res.status(400).json({
                success: false,
                message: "Impossible de supprimer une déclaration déjà payée"
            });
        }

        // BLOQUER si paiement en cours ou complété
        if (declaration.payment && declaration.payment.status !== 'FAILED') {
            return res.status(400).json({
                success: false,
                message: "Impossible de supprimer une déclaration avec un paiement en cours ou complété"
            });
        }

        const period = declaration.period;
        await declaration.destroy();

        // SMS de confirmation de suppression
        try {
            await smsService.sendDeclarationDeleted(
                req.user.phoneNumber,
                period
            );
            console.log(`SMS suppression déclaration envoyé à ${req.user.phoneNumber}`);
        } catch (error) {
            console.error('Erreur envoi SMS suppression:', error);
        }

        res.json({
            success: true,
            message: "Déclaration supprimée avec succès",
            data: {
                id,
                period,
                deletedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error("Erreur suppression déclaration:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}, 

  async getDeclarationsStatus(req, res) {
    try {
      const userId = req.user.id;

      const stats = await Declaration.findAll({
        where: { userId },
        attributes: [
          'status',
          [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count'],
          [db.Sequelize.fn('SUM', db.Sequelize.col('amount')), 'totalAmount'],
          [db.Sequelize.fn('SUM', db.Sequelize.col('taxAmount')), 'totalTaxAmount']
        ],
        group: ['status'],
        raw: true
      });

      const totalDeclarations = await Declaration.count({ where: { userId } });
      const paidDeclarations = await Declaration.count({
        where: { userId, status: 'PAID' }
      });

      res.json({
        success: true,
        data: {
          stats,
          totalDeclarations,
          paidDeclarations,
          paymentRate: totalDeclarations > 0 ?
            (paidDeclarations / totalDeclarations * 100).toFixed(2) : 0
        }
      });
    } catch (error) {
      console.error('Erreur statistiques déclarations', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = declarationController;