const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

class ExportUtils {
  // Génération CSV
  static generateCSV(data, fields) {
    try {
      const parser = new Parser({ fields });
      return parser.parse(data);
    } catch (error) {
      throw new Error('Erreur génération CSV: ' + error.message);
    }
  }

  // Génération PDF
  static generatePDF(data, headers, title) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const buffers = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // En-tête du document
        doc.fontSize(20).text(title, { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
        doc.moveDown();

        // Préparation des données pour le tableau
        const tableData = data.map(item => 
          headers.map(header => this.getNestedValue(item, header) || '')
        );

        // Configuration du tableau
        const table = {
          headers: headers,
          rows: tableData
        };

        // Ajout du tableau (version simplifiée)
        doc.fontSize(12);
        doc.text('Données exportées:', { underline: true });
        doc.moveDown(0.5);
        
        table.headers.forEach((header, i) => {
          doc.text(`${header}:`, { continued: true })
             .text(` ${table.rows.map(row => row[i]).join(', ')}`);
        });

        doc.end();
      } catch (error) {
        reject(new Error('Erreur génération PDF: ' + error.message));
      }
    });
  }

  // Génération PDF avec tableau avancé
  static generatePDFTable(data, headers, title, columns) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // En-tête
        doc.fontSize(18).font('Helvetica-Bold').text(title, { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).font('Helvetica').text(`Export généré le: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
        doc.moveDown();

        // Tableau
        let yPosition = doc.y;
        const rowHeight = 20;
        const pageWidth = doc.page.width - 100;
        const colWidth = pageWidth / headers.length;

        // En-tête du tableau
        doc.font('Helvetica-Bold').fontSize(10);
        headers.forEach((header, i) => {
          doc.text(header, 50 + (i * colWidth), yPosition, {
            width: colWidth,
            align: 'left'
          });
        });

        yPosition += rowHeight;
        doc.moveTo(50, yPosition).lineTo(50 + pageWidth, yPosition).stroke();

        // Données du tableau
        doc.font('Helvetica').fontSize(9);
        data.forEach((item, rowIndex) => {
          if (yPosition > doc.page.height - 50) {
            doc.addPage();
            yPosition = 50;
          }

          headers.forEach((header, colIndex) => {
            const value = this.getNestedValue(item, header) || '';
            doc.text(String(value), 50 + (colIndex * colWidth), yPosition, {
              width: colWidth,
              align: 'left'
            });
          });

          yPosition += rowHeight;
          
          // Ligne séparatrice
          if (rowIndex < data.length - 1) {
            doc.moveTo(50, yPosition).lineTo(50 + pageWidth, yPosition).stroke();
            yPosition += 5;
          }
        });

        doc.end();
      } catch (error) {
        reject(new Error('Erreur génération PDF: ' + error.message));
      }
    });
  }

  // Génération Excel
  static async generateExcel(data, headers, title) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(title);

      // En-têtes
      worksheet.addRow(headers);

      // Styles des en-têtes
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF007AFF' }
      };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      // Données
      data.forEach(item => {
        const row = headers.map(header => this.getNestedValue(item, header) || '');
        worksheet.addRow(row);
      });

      // Ajustement automatique des colonnes
      worksheet.columns = headers.map(() => ({ width: 15 }));

      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;
    } catch (error) {
      throw new Error('Erreur génération Excel: ' + error.message);
    }
  }

  // Helper pour les valeurs imbriquées
  static getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => {
      if (acc && typeof acc === 'object') {
        return acc[part];
      }
      return acc;
    }, obj);
  }
}

module.exports = ExportUtils;