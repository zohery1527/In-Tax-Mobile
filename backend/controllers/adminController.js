const db = require('../models');
const { User, Declaration, Payment, Zone, NIFHistory } = db;
const ExportUtils = require('../utils/exportUtils');

const adminController = {

  // Dashboard général (Optimisé avec Promise.all)
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
            include: [{
              model: Zone,
              as: 'zone',
              attributes: ['name']
            }]
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
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération du dashboard"
      });
    }
  },

  // Validation NIF (inchangé)
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
      if (!user) return res.status(404).json({ success:false, message:"Utilisateur non trouvé" });

      await user.update({ nifStatus: action });

      await NIFHistory.create({
        userId,
        nifNumber: user.nifNumber,
        action,
        reason,
        performedBy: req.user.id,
        metadata: {
          validatedAt: new Date().toISOString(),
          validatorRole: req.user.role
        }
      });

      res.json({
        success: true,
        message: `NIF ${action === 'VALIDATED' ? 'validé' : 'rejeté'}`,
        data: { user: { id: user.id, nifNumber: user.nifNumber, nifStatus: action } }
      });
    } catch (error) {
      console.error("Erreur validation NIF:", error);
      res.status(500).json({ success:false, message:"Erreur lors de la validation du NIF" });
    }
  },

  // Liste des déclarations en attente (inchangé)
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
      res.status(500).json({ success:false, message:"Erreur lors de la récupération des déclarations" });
    }
  },

  // Validation déclaration (inchangé)
  async validateDeclaration(req, res) {
    try {
      const { declarationId } = req.params;

      const declaration = await Declaration.findByPk(declarationId, { include: [{ model: User, as: 'user' }] });
      if(!declaration) return res.status(404).json({ success:false, message:"Déclaration non trouvée" });

      if(declaration.status !== 'PENDING') {
        return res.status(400).json({ success:false, message:"Cette déclaration a déjà été traitée" });
      }
      await declaration.update({ status: "VALIDATED" });
      res.json({ success:true, message:"Déclaration validée avec succès" });
    } catch(error) {
      console.error("Erreur validation déclaration:", error);
      res.status(500).json({ success:false, message:"Erreur lors de la validation de la déclaration" });
    }
  },

  // Confirmation paiement manuel (inchangé)
  async confirmPaymentManual(req, res) {
    try {
      const { paymentId } = req.params;
      const payment = await Payment.findByPk(paymentId, {
        include: [{ model: Declaration, as: 'declaration' }, { model: User, as: 'user' }]
      });

      if(!payment) return res.status(404).json({ success:false, message:"Paiement non trouvé" });
      
      if(payment.status === 'COMPLETED') {
        return res.status(400).json({ success:false, message:"Ce paiement est déjà complété" });
      }

      payment.status = 'COMPLETED';
      payment.metadata = { ...payment.metadata, manuallyConfirmed:true, confirmedBy:req.user.id, confirmedAt:new Date().toISOString() };
      await payment.save();
      await payment.declaration.update({ status:'PAID' });

      res.json({ success:true, message:"Paiement confirmé manuellement", data:{ payment } });
    } catch(error){
      console.error("Erreur confirmation manuelle:", error);
      res.status(500).json({ success:false, message:"Erreur lors de la confirmation du paiement" });
    }
  },

  // Liste utilisateurs (inchangé)
  async getAllUsers(req, res) {
    try {
      const { page=1, limit=20, role, zoneId } = req.query;
      const whereClause = {};
      if(role) whereClause.role = role;
      if(zoneId) whereClause.zoneId = zoneId;
      if(req.user.role === 'AGENT') { whereClause.zoneId=req.user.zoneId; whereClause.role='VENDEUR'; }

      const users = await User.findAndCountAll({
        where: whereClause,
        include:[{ model: Zone, as:'zone', attributes:['name','region'] }],
        attributes:{ exclude:['password'] },
        limit: parseInt(limit),
        offset:(parseInt(page)-1)*parseInt(limit),
        order:[['createdAt','DESC']]
      });

      res.json({
        success:true,
        data:{
          users: users.rows,
          total: users.count,
          page: parseInt(page),
          totalPages: Math.ceil(users.count/parseInt(limit))
        }
      });
    } catch(error){
      console.error('Erreur liste utilisateurs:', error);
      res.status(500).json({ success:false, message:"Erreur lors de la récupération des utilisateurs" });
    }
  },

  // Export des données (inchangé)
  async exportData(req, res) {
    try {
      const { type } = req.params;
      const { format='csv' } = req.query;

      let data, filename, headers, fields;

      switch(type){
        case 'users':
          data = await User.findAll({
            include:[{ model:Zone, as:'zone', attributes:['name','region']}],
            attributes:['firstName','lastName','phoneNumber','nifNumber','nifStatus','activityType','createdAt','isActive'],
            raw:true
          });
          data = data.map(u=>({
            'Prénom':u.firstName,'Nom':u.lastName,'Téléphone':u.phoneNumber,
            'NIF':u.nifNumber,'Statut NIF':u.nifStatus,'Activité':u.activityType,
            'Région':u['zone.name'],'Date inscription':new Date(u.createdAt).toLocaleDateString('fr-FR'),
            'Statut':u.isActive?'Actif':'Inactif'
          }));
          filename = `utilisateurs_${new Date().toISOString().split('T')[0]}`;
          headers = fields = ['Prénom','Nom','Téléphone','NIF','Statut NIF','Activité','Région','Date inscription','Statut'];
          break;

        case 'declarations':
          data = await Declaration.findAll({
            include:[{
              model:User, as:'user', attributes:['firstName','lastName','phoneNumber'],
              include:[{ model:Zone, as:'zone', attributes:['name'] }]
            }],
            attributes:['period','amount','taxAmount','status','activityType','createdAt'],
            raw:true
          });
          data = data.map(d=>({
            'Période':d.period,'Montant':d.amount,'Taxe':d.taxAmount,'Statut':d.status,
            'Activité':d.activityType,'Date':new Date(d.createdAt).toLocaleDateString('fr-FR'),
            'Vendeur':`${d['user.firstName']} ${d['user.lastName']}`,'Téléphone':d['user.phoneNumber'],
            'Région':d['user.zone.name']
          }));
          filename = `declarations_${new Date().toISOString().split('T')[0]}`;
          headers = fields = ['Période','Montant','Taxe','Statut','Activité','Date','Vendeur','Téléphone','Région'];
          break;

        case 'payments':
          data = await Payment.findAll({
            include:[
              { model:User, as:'user', attributes:['firstName','lastName','phoneNumber'] },
              { model:Declaration, as:'declaration', attributes:['period'] }
            ],
            attributes:['amount','provider','status','createdAt','transactionId'],
            raw:true
          });
          data = data.map(p=>({
            'Montant':p.amount,'Moyen de paiement':p.provider,'Statut':p.status,
            'Date':new Date(p.createdAt).toLocaleDateString('fr-FR'),'Transaction':p.transactionId,
            'Vendeur':`${p['user.firstName']} ${p['user.lastName']}`,'Téléphone':p['user.phoneNumber'],
            'Période':p['declaration.period']
          }));
          filename = `paiements_${new Date().toISOString().split('T')[0]}`;
          headers = fields = ['Montant','Moyen de paiement','Statut','Date','Transaction','Vendeur','Téléphone','Période'];
          break;

        default:
          return res.status(400).json({ success:false, message:"Type d'export non supporté" });
      }

      switch(format.toLowerCase()){
        case 'csv':
          const csvContent = ExportUtils.generateCSV(data, fields);
          res.setHeader('Content-Type','text/csv; charset=utf-8');
          res.setHeader('Content-Disposition',`attachment; filename="${filename}.csv"`);
          return res.send(csvContent);

        case 'pdf':
          const pdfContent = await ExportUtils.generatePDFTable(data, headers, `Export ${type}`, headers);
          res.setHeader('Content-Type','application/pdf');
          res.setHeader('Content-Disposition',`attachment; filename="${filename}.pdf"`);
          return res.send(pdfContent);

        case 'excel':
          const excelContent = await ExportUtils.generateExcel(data, headers, `Export ${type}`);
          res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition',`attachment; filename="${filename}.xlsx"`);
          return res.send(excelContent);

        default:
          return res.status(400).json({ success:false, message:"Format d'export non supporté" });
      }

    } catch(error){
      console.error("Erreur export:", error);
      res.status(500).json({ success:false, message:"Erreur lors de l'export des données: "+error.message });
    }
  },

  // Résumé statistiques (CORRIGÉ ET FINALISÉ)
  async getSummary(req,res){
    try{
      // CORRECTION FINALE: Exclure explicitement tous les attributs par défaut de User et Zone 
      // pour ne sélectionner que les colonnes nécessaires à l'agrégation et au groupement.
      const revenueByRegion = await Declaration.findAll({
        include:[{ 
          model:User, 
          as:'user', 
          attributes:[], // Exclut les colonnes de User (y compris 'user.id')
          include:[{
            model:Zone,
            as:'zone',
            attributes:[], // <--- FIX DU DERNIER PROBLÈME : Exclut l'ID de la Zone ('user->zone.id')
          }] 
        }],
        where:{ status:'PAID' },
        attributes:[
          [db.Sequelize.col('user.zone.name'),'region'], 
          [db.Sequelize.fn('SUM',db.Sequelize.col('taxAmount')),'revenue']
        ],
        // Le groupement doit inclure tous les champs non agrégés (ici, seul le nom de la zone est sélectionné)
        group:['user.zone.name', 'user->zone.name'], 
        raw:true
      });
      
      // Top Sellers (Group By explicite maintenu pour la robustesse)
      const topSellers = await User.findAll({
        where:{ role:'VENDEUR' },
        include:[{ model:Declaration, as:'declarations', attributes:[
          [db.Sequelize.fn('COUNT',db.Sequelize.col('declarations.id')),'declarationCount'],
          [db.Sequelize.fn('SUM',db.Sequelize.col('declarations.taxAmount')),'totalRevenue']
        ]}],
        attributes:['id','firstName','lastName','phoneNumber'],
        group: ['User.id', 'User.firstName', 'User.lastName', 'User.phoneNumber'],
        order:[[db.Sequelize.literal('totalRevenue'),'DESC']],
        limit:10,
        subQuery:false
      });

      // Statistiques mensuelles (inchangé)
      const monthlyStats = await Declaration.findAll({
        attributes:[
          [db.Sequelize.fn('DATE_TRUNC','month',db.Sequelize.col('createdAt')),'month'],
          [db.Sequelize.fn('COUNT',db.Sequelize.col('id')),'declarationCount'],
          [db.Sequelize.fn('SUM',db.Sequelize.col('taxAmount')),'totalRevenue']
        ],
        group:[db.Sequelize.fn('DATE_TRUNC','month',db.Sequelize.col('createdAt'))],
        order:[[db.Sequelize.fn('DATE_TRUNC','month',db.Sequelize.col('createdAt')),'ASC']],
        raw:true
      });

      res.json({
        success:true,
        data:{
          revenueByRegion,
          topSellers:topSellers.map(s=>({
            id:s.id,
            name:`${s.firstName} ${s.lastName}`,
            phone:s.phoneNumber,
            declarationCount:s.declarations?.[0]?.dataValues?.declarationCount||0,
            totalRevenue:s.declarations?.[0]?.dataValues?.totalRevenue||0
          })),
          monthlyStats:monthlyStats.map(m=>({
            month:m.month,
            declarationCount:parseInt(m.declarationCount),
            totalRevenue:parseFloat(m.totalRevenue)||0
          }))
        }
      });

    } catch(error){
      console.error("Erreur résumé:",error);
      res.status(500).json({ success:false, message:"Erreur lors de la récupération du résumé" });
    }
  }
};

module.exports = adminController;