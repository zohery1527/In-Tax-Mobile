// controllers/admin/adminExportController.js
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { User, Declaration, Payment, Zone, NIFHistory, sequelize } = require('../../models');

const adminExportController = {

  exportUsers: async (req, res) => {
    try {
      const { format = 'excel', zoneId, status, activityType } = req.query;
      const admin = req.admin;

      const whereClause = buildUserExportWhereClause(req.query, admin);

      const users = await User.findAll({
        where: whereClause,
        include: [{
          model: Zone,
          as: 'zone',
          attributes: ['name', 'code', 'region']
        }],
        order: [['createdAt', 'DESC']]
      });

      if (format === 'pdf') {
        const pdfBuffer = await generateUsersPDF(users, admin);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 
          `attachment; filename="utilisateurs-${new Date().toISOString().split('T')[0]}.pdf"`);
        
        return res.send(pdfBuffer);
      } else {
        const excelBuffer = await generateUsersExcel(users, admin);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition',
          `attachment; filename="utilisateurs-${new Date().toISOString().split('T')[0]}.xlsx"`);
        
        return res.send(excelBuffer);
      }

    } catch (error) {
      console.error('Export users error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'export des utilisateurs'
      });
    }
  },

  exportDeclarations: async (req, res) => {
    try {
      const { format = 'excel', status, period, zoneId } = req.query;
      const admin = req.admin;

      const whereClause = buildDeclarationExportWhereClause(req.query, admin);

      const declarations = await Declaration.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName', 'phoneNumber', 'nifNumber'],
            include: [{
              model: Zone,
              as: 'zone',
              attributes: ['name', 'code']
            }]
          },
          {
            model: Payment,
            as: 'payments',
            attributes: ['amount', 'status', 'paidAt'],
            required: false
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      if (format === 'pdf') {
        const pdfBuffer = await generateDeclarationsPDF(declarations, admin);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 
          `attachment; filename="declarations-${new Date().toISOString().split('T')[0]}.pdf"`);
        return res.send(pdfBuffer);
      } else {
        const excelBuffer = await generateDeclarationsExcel(declarations, admin);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition',
          `attachment; filename="declarations-${new Date().toISOString().split('T')[0]}.xlsx"`);
        return res.send(excelBuffer);
      }

    } catch (error) {
      console.error('Export declarations error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'export des déclarations'
      });
    }
  },

  exportPayments: async (req, res) => {
    try {
      const { format = 'excel', status, provider, startDate, endDate } = req.query;
      const admin = req.admin;

      const whereClause = buildPaymentExportWhereClause(req.query, admin);

      const payments = await Payment.findAll({
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
            model: Declaration,
            as: 'declaration',
            attributes: ['period', 'activityType']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      if (format === 'pdf') {
        const pdfBuffer = await generatePaymentsPDF(payments, admin);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 
          `attachment; filename="paiements-${new Date().toISOString().split('T')[0]}.pdf"`);
        return res.send(pdfBuffer);
      } else {
        const excelBuffer = await generatePaymentsExcel(payments, admin);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition',
          `attachment; filename="paiements-${new Date().toISOString().split('T')[0]}.xlsx"`);
        return res.send(excelBuffer);
      }

    } catch (error) {
      console.error('Export payments error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'export des paiements'
      });
    }
  }
};

// Helper functions pour les exports
function buildUserExportWhereClause(query, admin) {
  const whereClause = {};

  if (query.status) whereClause.isActive = query.status === 'active';
  if (query.activityType) whereClause.activityType = query.activityType;
  if (query.nifStatus) whereClause.nifStatus = query.nifStatus;

  if (admin.scope !== 'GLOBAL') {
    whereClause.zoneId = { [sequelize.Op.in]: admin.zoneIds || [] };
  } else if (query.zoneId) {
    whereClause.zoneId = query.zoneId;
  }

  return whereClause;
}

function buildDeclarationExportWhereClause(query, admin) {
  const whereClause = {};

  if (query.status) whereClause.status = query.status;
  if (query.period) whereClause.period = query.period;

  if (admin.scope !== 'GLOBAL') {
    whereClause['$user.zoneId$'] = { [sequelize.Op.in]: admin.zoneIds || [] };
  } else if (query.zoneId) {
    whereClause['$user.zoneId$'] = query.zoneId;
  }

  return whereClause;
}

function buildPaymentExportWhereClause(query, admin) {
  const whereClause = {};

  if (query.status) whereClause.status = query.status;
  if (query.provider) whereClause.provider = query.provider;

  if (query.startDate || query.endDate) {
    whereClause.createdAt = {};
    if (query.startDate) whereClause.createdAt[sequelize.Op.gte] = new Date(query.startDate);
    if (query.endDate) whereClause.createdAt[sequelize.Op.lte] = new Date(query.endDate);
  }

  if (admin.scope !== 'GLOBAL') {
    whereClause['$user.zoneId$'] = { [sequelize.Op.in]: admin.zoneIds || [] };
  } else if (query.zoneId) {
    whereClause['$user.zoneId$'] = query.zoneId;
  }

  return whereClause;
}

// Génération PDF/Excel (implémentations simplifiées)
async function generateUsersExcel(users, admin) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Utilisateurs');

  worksheet.columns = [
    { header: 'Nom', key: 'name', width: 25 },
    { header: 'Téléphone', key: 'phone', width: 20 },
    { header: 'NIF', key: 'nif', width: 15 },
    { header: 'Zone', key: 'zone', width: 20 },
    { header: 'Type Activité', key: 'activity', width: 15 },
    { header: 'Statut', key: 'status', width: 10 },
    { header: 'Date Création', key: 'createdAt', width: 15 }
  ];

  users.forEach(user => {
    worksheet.addRow({
      name: `${user.firstName} ${user.lastName}`,
      phone: user.phoneNumber,
      nif: user.nifNumber || 'N/A',
      zone: user.zone?.name || 'N/A',
      activity: user.activityType,
      status: user.isActive ? 'Actif' : 'Inactif',
      createdAt: user.createdAt.toLocaleDateString('fr-FR')
    });
  });

  worksheet.getRow(1).font = { bold: true };
  return workbook.xlsx.writeBuffer();
}

async function generateUsersPDF(users, admin) {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    doc.fontSize(16).text('RAPPORT UTILISATEURS - IN-TAX', 100, 100);
    doc.fontSize(10).text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 100, 130);
    doc.text(`Administrateur: ${admin.fullName}`, 100, 145);
    doc.text(`Total: ${users.length} utilisateurs`, 100, 160);

    let y = 200;
    users.forEach(user => {
      doc.text(`${user.firstName} ${user.lastName} - ${user.phoneNumber} - ${user.zone?.name || 'N/A'}`, 100, y);
      y += 15;
    });

    doc.end();
  });
}

// Implémentations similaires pour les autres exports...
async function generateDeclarationsExcel(declarations, admin) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Déclarations');

  worksheet.columns = [
    { header: 'Période', key: 'period', width: 15 },
    { header: 'Utilisateur', key: 'user', width: 25 },
    { header: 'Zone', key: 'zone', width: 20 },
    { header: 'Montant', key: 'amount', width: 15 },
    { header: 'Taxe', key: 'tax', width: 15 },
    { header: 'Statut', key: 'status', width: 15 }
  ];

  declarations.forEach(decl => {
    worksheet.addRow({
      period: decl.period,
      user: `${decl.user?.firstName} ${decl.user?.lastName}`,
      zone: decl.user?.zone?.name,
      amount: decl.amount,
      tax: decl.taxAmount,
      status: decl.status
    });
  });

  worksheet.getRow(1).font = { bold: true };
  return workbook.xlsx.writeBuffer();
}

module.exports = adminExportController;