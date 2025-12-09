// services/exportService.js
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const exportService = {

  generateUsersPDF: async (users, admin) => {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // En-tête
        doc.fontSize(20).text('RAPPORT DES UTILISATEURS - IN-TAX', 100, 100);
        doc.fontSize(12).text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 100, 130);
        doc.text(`Administrateur: ${admin.fullName}`, 100, 150);
        doc.text(`Scope: ${admin.scope}`, 100, 165);

        // Tableau
        let yPosition = 200;
        
        // En-tête du tableau
        doc.fontSize(10).text('Nom', 100, yPosition);
        doc.text('Téléphone', 200, yPosition);
        doc.text('NIF', 300, yPosition);
        doc.text('Zone', 400, yPosition);
        doc.text('Statut', 500, yPosition);
        
        yPosition += 20;
        doc.moveTo(100, yPosition).lineTo(550, yPosition).stroke();
        yPosition += 10;

        // Données
        users.forEach(user => {
          doc.text(`${user.firstName} ${user.lastName}`, 100, yPosition);
          doc.text(user.phoneNumber, 200, yPosition);
          doc.text(user.nifNumber || 'N/A', 300, yPosition);
          doc.text(user.zone?.name || 'N/A', 400, yPosition);
          doc.text(user.isActive ? 'Actif' : 'Inactif', 500, yPosition);
          yPosition += 15;
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  },

  generateDeclarationsExcel: async (declarations, admin) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Déclarations');

    // En-têtes
    worksheet.columns = [
      { header: 'Période', key: 'period', width: 15 },
      { header: 'Utilisateur', key: 'user', width: 25 },
      { header: 'Zone', key: 'zone', width: 20 },
      { header: 'Montant', key: 'amount', width: 15 },
      { header: 'Taxe', key: 'taxAmount', width: 15 },
      { header: 'Statut', key: 'status', width: 15 },
      { header: 'Date', key: 'createdAt', width: 20 }
    ];

    // Données
    declarations.forEach(declaration => {
      worksheet.addRow({
        period: declaration.period,
        user: `${declaration.user?.firstName} ${declaration.user?.lastName}`,
        zone: declaration.user?.zone?.name,
        amount: declaration.amount,
        taxAmount: declaration.taxAmount,
        status: declaration.status,
        createdAt: declaration.createdAt.toLocaleDateString('fr-FR')
      });
    });

    // Style
    worksheet.getRow(1).font = { bold: true };
    
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  },

  generateNIFPDFReport: async (nifHistory, admin) => {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        doc.fontSize(16).text('RAPPORT DES VALIDATIONS NIF', 100, 100);
        doc.fontSize(10).text(`Période: ${new Date().toLocaleDateString('fr-FR')}`, 100, 130);
        doc.text(`Total validations: ${nifHistory.length}`, 100, 145);

        let yPosition = 180;
        
        nifHistory.forEach(history => {
          doc.text(`Utilisateur: ${history.user?.firstName} ${history.user?.lastName}`, 100, yPosition);
          doc.text(`NIF: ${history.nifNumber}`, 100, yPosition + 15);
          doc.text(`Action: ${history.action}`, 100, yPosition + 30);
          doc.text(`Date: ${history.createdAt.toLocaleDateString('fr-FR')}`, 100, yPosition + 45);
          doc.text(`Admin: ${history.admin?.fullName || 'Système'}`, 100, yPosition + 60);
          
          yPosition += 80;
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 100;
          }
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
};

module.exports = exportService;