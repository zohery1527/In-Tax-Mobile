// controllers/admin/adminExportController.js - VERSION CORRIGÉE
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { User, Declaration, Payment, Zone, sequelize } = require('../../models');
const { Op } = require('sequelize');

// ==================== CONSTANTES DE STYLE ====================
const PDF_STYLES = {
  COLORS: {
    PRIMARY: '#1a237e',
    SECONDARY: '#283593',
    SUCCESS: '#2e7d32',
    WARNING: '#f57c00',
    DANGER: '#c62828',
    INFO: '#0277bd',
    LIGHT_GRAY: '#f5f5f5',
    MEDIUM_GRAY: '#e0e0e0',
    DARK_GRAY: '#424242',
    WHITE: '#ffffff',
    BLACK: '#000000'
  },
  FONTS: {
    TITLE: 'Helvetica-Bold',
    HEADER: 'Helvetica-Bold',
    BODY: 'Helvetica',
    BODY_BOLD: 'Helvetica-Bold',
    MONO: 'Courier-Bold'
  },
  SIZES: {
    TITLE: 16,
    SUBTITLE: 12,
    HEADER: 10,
    BODY: 9,
    SMALL: 8
  },
  MARGINS: {
    TOP: 50,
    BOTTOM: 50,
    LEFT: 40,
    RIGHT: 40
  }
};

const EXCEL_STYLES = {
  HEADER: {
    FILL: 'FF1a237e',
    FONT_COLOR: 'FFFFFFFF',
    FONT_BOLD: true,
    BORDER: {
      top: { style: 'thin', color: { argb: 'FF283593' } },
      left: { style: 'thin', color: { argb: 'FF283593' } },
      bottom: { style: 'thin', color: { argb: 'FF283593' } },
      right: { style: 'thin', color: { argb: 'FF283593' } }
    }
  },
  CELL: {
    BORDER: {
      top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
    }
  },
  STATUS_COLORS: {
    PAID: 'FF2e7d32',
    PENDING: 'FFF57C00',
    REJECTED: 'FFC62828',
    ACTIVE: 'FF2e7d32',
    INACTIVE: 'FF757575',
    COMPLETED: 'FF2e7d32',
    FAILED: 'FFC62828'
  }
};

// ==================== CONTROLEUR PRINCIPAL ====================
const adminExportController = {

  exportUsers: async (req, res) => {
    try {
      const { format = 'excel', ...filters } = req.query;
      const admin = req.admin;

      const whereClause = buildUserExportWhereClause(filters, admin);
      const users = await fetchUsersWithZone(whereClause);

      if (format === 'pdf') {
        const pdfBuffer = await generateUsersPDF(users, admin, filters);
        return sendPDFResponse(res, pdfBuffer, 'utilisateurs');
      } else {
        const excelBuffer = await generateUsersExcel(users, admin, filters);
        return sendExcelResponse(res, excelBuffer, 'utilisateurs');
      }

    } catch (error) {
      handleExportError(res, error, 'utilisateurs');
    }
  },

  exportDeclarations: async (req, res) => {
    try {
      const { format = 'excel', ...filters } = req.query;
      const admin = req.admin;

      const whereClause = buildDeclarationExportWhereClause(filters, admin);
      const declarations = await fetchDeclarationsWithDetails(whereClause);

      if (format === 'pdf') {
        const pdfBuffer = await generateDeclarationsPDF(declarations, admin, filters);
        return sendPDFResponse(res, pdfBuffer, 'declarations');
      } else {
        const excelBuffer = await generateDeclarationsExcel(declarations, admin, filters);
        return sendExcelResponse(res, excelBuffer, 'declarations');
      }

    } catch (error) {
      handleExportError(res, error, 'declarations');
    }
  },

  exportPayments: async (req, res) => {
    try {
      const { format = 'excel', ...filters } = req.query;
      const admin = req.admin;

      const whereClause = buildPaymentExportWhereClause(filters, admin);
      const payments = await fetchPaymentsWithDetails(whereClause);

      if (format === 'pdf') {
        const pdfBuffer = await generatePaymentsPDF(payments, admin, filters);
        return sendPDFResponse(res, pdfBuffer, 'paiements');
      } else {
        const excelBuffer = await generatePaymentsExcel(payments, admin, filters);
        return sendExcelResponse(res, excelBuffer, 'paiements');
      }

    } catch (error) {
      handleExportError(res, error, 'paiements');
    }
  }
};

// ==================== FONCTIONS DE RÉCUPÉRATION DES DONNÉES ====================
async function fetchUsersWithZone(whereClause) {
  return await User.findAll({
    where: whereClause,
    include: [{
      model: Zone,
      as: 'zone',
      attributes: ['name', 'code', 'region']
    }],
    order: [['createdAt', 'DESC']]
  });
}

async function fetchDeclarationsWithDetails(whereClause) {
  return await Declaration.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName', 'phoneNumber', 'nifNumber'], // RETIRÉ: 'email'
        include: [{
          model: Zone,
          as: 'zone',
          attributes: ['name', 'code', 'region']
        }]
      },
      {
        model: Payment,
        as: 'payments',
        attributes: ['amount', 'status', 'paidAt', 'transactionId'],
        required: false
      }
    ],
    order: [['createdAt', 'DESC']]
  });
}

async function fetchPaymentsWithDetails(whereClause) {
  return await Payment.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName', 'phoneNumber'], // RETIRÉ: 'email'
        include: [{
          model: Zone,
          as: 'zone',
          attributes: ['name', 'code', 'region']
        }]
      },
      {
        model: Declaration,
        as: 'declaration',
        attributes: ['id', 'period', 'activityType', 'amount', 'taxAmount']
      }
    ],
    order: [['createdAt', 'DESC']]
  });
}

// ==================== FONCTIONS UTILITAIRES ====================
function sendPDFResponse(res, buffer, fileName) {
  const date = new Date().toISOString().split('T')[0];
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 
    `attachment; filename="${fileName}-${date}.pdf"`);
  return res.send(buffer);
}

function sendExcelResponse(res, buffer, fileName) {
  const date = new Date().toISOString().split('T')[0];
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition',
    `attachment; filename="${fileName}-${date}.xlsx"`);
  return res.send(buffer);
}

function handleExportError(res, error, type) {
  console.error(`[EXPORT ${type.toUpperCase()}] Erreur:`, error);
  res.status(500).json({
    success: false,
    message: `Erreur lors de l'export des ${type}`,
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}

function formatCurrency(amount) {
  if (!amount && amount !== 0) return '0';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

function formatDate(date, includeTime = false) {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (includeTime) {
    return `${d.getDate().toString().padStart(2, '0')}/${
      (d.getMonth() + 1).toString().padStart(2, '0')}/${
      d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${
      d.getMinutes().toString().padStart(2, '0')}`;
  }
  return `${d.getDate().toString().padStart(2, '0')}/${
    (d.getMonth() + 1).toString().padStart(2, '0')}/${
    d.getFullYear()}`;
}

function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function getStatusColor(status) {
  const colorMap = {
    'PAID': PDF_STYLES.COLORS.SUCCESS,
    'PENDING': PDF_STYLES.COLORS.WARNING,
    'REJECTED': PDF_STYLES.COLORS.DANGER,
    'DRAFT': PDF_STYLES.COLORS.DARK_GRAY,
    'ACTIVE': PDF_STYLES.COLORS.SUCCESS,
    'INACTIVE': PDF_STYLES.COLORS.DANGER,
    'COMPLETED': PDF_STYLES.COLORS.SUCCESS,
    'FAILED': PDF_STYLES.COLORS.DANGER,
    'PROCESSING': PDF_STYLES.COLORS.WARNING
  };
  return colorMap[status] || PDF_STYLES.COLORS.DARK_GRAY;
}

function getStatusText(status) {
  const textMap = {
    'PAID': 'PAYÉ',
    'PENDING': 'EN ATTENTE',
    'REJECTED': 'REJETÉ',
    'DRAFT': 'BROUILLON',
    'ACTIVE': 'ACTIF',
    'INACTIVE': 'INACTIF',
    'COMPLETED': 'COMPLÉTÉ',
    'FAILED': 'ÉCHOUÉ',
    'PROCESSING': 'EN COURS'
  };
  return textMap[status] || status;
}

function buildFilterInfo(filters) {
  const filterEntries = Object.entries(filters)
    .filter(([key, value]) => value && key !== 'format' && key !== 'page' && key !== 'limit')
    .map(([key, value]) => {
      const keyLabel = {
        'status': 'Statut',
        'period': 'Période',
        'zoneId': 'Zone',
        'activityType': 'Type d\'activité',
        'nifStatus': 'Statut NIF',
        'provider': 'Fournisseur',
        'startDate': 'Date début',
        'endDate': 'Date fin'
      }[key] || key;
      
      return `${keyLabel}: ${value}`;
    });
  
  return filterEntries.length > 0 ? filterEntries.join(' | ') : 'Aucun filtre';
}

// ==================== FONCTIONS PDF PROFESSIONNELLES ====================

// Fonction pour créer un PDF avec en-tête et pied de page
function createProfessionalPDF(layout = 'portrait') {
  return new PDFDocument({
    margin: 0,
    size: 'A4',
    layout: layout,
    info: {
      Title: 'Rapport IN-TAX',
      Author: 'Système IN-TAX',
      Subject: 'Export de données',
      Keywords: 'fiscalité, déclaration, paiement, taxe',
      CreationDate: new Date()
    }
  });
}

// Fonction pour dessiner l'en-tête du PDF
function drawPDFHeader(doc, options = {}) {
  const { title, subtitle, adminName, filterInfo, showDate = true } = options;
  
  // Fond de l'en-tête
  doc.rect(0, 0, doc.page.width, 80)
    .fill(PDF_STYLES.COLORS.PRIMARY);
  
  // Titre principal
  doc.fillColor(PDF_STYLES.COLORS.WHITE)
    .fontSize(PDF_STYLES.SIZES.TITLE)
    .font(PDF_STYLES.FONTS.TITLE)
    .text(title, PDF_STYLES.MARGINS.LEFT, 25, {
      align: 'center',
      width: doc.page.width - (PDF_STYLES.MARGINS.LEFT + PDF_STYLES.MARGINS.RIGHT)
    });
  
  // Sous-titre
  if (subtitle) {
    doc.fontSize(PDF_STYLES.SIZES.SUBTITLE)
      .text(subtitle, PDF_STYLES.MARGINS.LEFT, 45, {
        align: 'center',
        width: doc.page.width - (PDF_STYLES.MARGINS.LEFT + PDF_STYLES.MARGINS.RIGHT)
      });
  }
  
  // Informations
  const infoY = 85;
  doc.fillColor(PDF_STYLES.COLORS.DARK_GRAY)
    .fontSize(PDF_STYLES.SIZES.SMALL)
    .font(PDF_STYLES.FONTS.BODY);
  
  if (showDate) {
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}`, 
      PDF_STYLES.MARGINS.LEFT, infoY);
  }
  
  if (adminName) {
    doc.text(`Administrateur: ${adminName}`, 
      doc.page.width / 2 - 100, infoY);
  }
  
  if (filterInfo) {
    doc.text(`Filtres: ${filterInfo}`, 
      doc.page.width - PDF_STYLES.MARGINS.RIGHT - 200, infoY, { width: 200, align: 'right' });
  }
  
  // Ligne de séparation
  doc.moveTo(PDF_STYLES.MARGINS.LEFT, infoY + 15)
    .lineTo(doc.page.width - PDF_STYLES.MARGINS.RIGHT, infoY + 15)
    .strokeColor(PDF_STYLES.COLORS.MEDIUM_GRAY)
    .lineWidth(0.5)
    .stroke();
  
  return infoY + 25;
}

// Fonction pour dessiner les statistiques
function drawStatsBox(doc, stats, startY) {
  const boxWidth = doc.page.width - (PDF_STYLES.MARGINS.LEFT + PDF_STYLES.MARGINS.RIGHT);
  const boxHeight = 45;
  const columnWidth = boxWidth / 6;
  
  // Fond de la boîte
  doc.roundedRect(PDF_STYLES.MARGINS.LEFT, startY, boxWidth, boxHeight, 3)
    .fill(PDF_STYLES.COLORS.LIGHT_GRAY);
  
  // Bordures
  doc.roundedRect(PDF_STYLES.MARGINS.LEFT, startY, boxWidth, boxHeight, 3)
    .strokeColor(PDF_STYLES.COLORS.MEDIUM_GRAY)
    .lineWidth(0.5)
    .stroke();
  
  // Statistiques
  const statItems = [
    { label: 'Total', value: stats.total, color: PDF_STYLES.COLORS.PRIMARY },
    { label: 'Payées', value: stats.paid, color: PDF_STYLES.COLORS.SUCCESS },
    { label: 'En attente', value: stats.pending, color: PDF_STYLES.COLORS.WARNING },
    { label: 'Rejetées', value: stats.rejected, color: PDF_STYLES.COLORS.DANGER },
    { label: 'Montant total', value: `${formatCurrency(stats.totalAmount)} Ar`, color: PDF_STYLES.COLORS.INFO },
    { label: 'Taxe totale', value: `${formatCurrency(stats.totalTax)} Ar`, color: PDF_STYLES.COLORS.INFO }
  ];
  
  statItems.forEach((item, index) => {
    const x = PDF_STYLES.MARGINS.LEFT + (columnWidth * index) + 10;
    
    // Valeur
    doc.fillColor(item.color)
      .fontSize(PDF_STYLES.SIZES.HEADER)
      .font(PDF_STYLES.FONTS.HEADER)
      .text(item.value.toString(), x, startY + 10);
    
    // Label
    doc.fillColor(PDF_STYLES.COLORS.DARK_GRAY)
      .fontSize(PDF_STYLES.SIZES.SMALL)
      .font(PDF_STYLES.FONTS.BODY)
      .text(item.label, x, startY + 28);
  });
  
  return startY + boxHeight + 10;
}

// Fonction pour dessiner un tableau professionnel
function drawProfessionalTable(doc, data, config, startY) {
  const { columns, getRowData } = config;
  let currentY = startY;
  
  // Calcul des largeurs
  const totalWidth = doc.page.width - (PDF_STYLES.MARGINS.LEFT + PDF_STYLES.MARGINS.RIGHT);
  const colWidths = columns.map(col => totalWidth * (col.width || 1) / columns.reduce((sum, c) => sum + (c.width || 1), 0));
  
  // En-tête du tableau
  doc.fillColor(PDF_STYLES.COLORS.SECONDARY)
    .rect(PDF_STYLES.MARGINS.LEFT, currentY, totalWidth, 25)
    .fill();
  
  let currentX = PDF_STYLES.MARGINS.LEFT;
  doc.fillColor(PDF_STYLES.COLORS.WHITE)
    .fontSize(PDF_STYLES.SIZES.HEADER)
    .font(PDF_STYLES.FONTS.HEADER);
  
  columns.forEach((col, index) => {
    doc.text(col.header, currentX + 8, currentY + 8, {
      width: colWidths[index] - 16,
      align: col.align || 'left'
    });
    currentX += colWidths[index];
  });
  
  currentY += 30;
  
  // Données
  doc.fontSize(PDF_STYLES.SIZES.BODY)
    .font(PDF_STYLES.FONTS.BODY);
  
  data.forEach((item, rowIndex) => {
    // Vérifier si besoin d'une nouvelle page
    if (currentY > doc.page.height - PDF_STYLES.MARGINS.BOTTOM - 30) {
      doc.addPage();
      currentY = PDF_STYLES.MARGINS.TOP;
      
      // Redessiner l'en-tête du tableau
      currentX = PDF_STYLES.MARGINS.LEFT;
      doc.fillColor(PDF_STYLES.COLORS.SECONDARY)
        .rect(PDF_STYLES.MARGINS.LEFT, currentY, totalWidth, 25)
        .fill();
      
      doc.fillColor(PDF_STYLES.COLORS.WHITE)
        .fontSize(PDF_STYLES.SIZES.HEADER)
        .font(PDF_STYLES.FONTS.HEADER);
      
      columns.forEach((col, index) => {
        doc.text(col.header, currentX + 8, currentY + 8, {
          width: colWidths[index] - 16,
          align: col.align || 'left'
        });
        currentX += colWidths[index];
      });
      
      currentY += 30;
      doc.fontSize(PDF_STYLES.SIZES.BODY)
        .font(PDF_STYLES.FONTS.BODY);
    }
    
    // Alternance de couleurs de fond
    if (rowIndex % 2 === 0) {
      doc.fillColor(PDF_STYLES.COLORS.LIGHT_GRAY)
        .rect(PDF_STYLES.MARGINS.LEFT, currentY - 5, totalWidth, 20)
        .fill();
    }
    
    const rowData = getRowData(item);
    currentX = PDF_STYLES.MARGINS.LEFT;
    
    rowData.forEach((cell, cellIndex) => {
      const align = columns[cellIndex].align || 'left';
      const isStatusColumn = columns[cellIndex].isStatus;
      
      if (isStatusColumn) {
        const statusColor = getStatusColor(cell);
        doc.fillColor(statusColor);
      } else {
        doc.fillColor(PDF_STYLES.COLORS.BLACK);
      }
      
      doc.text(cell.toString(), currentX + 8, currentY, {
        width: colWidths[cellIndex] - 16,
        align: align
      });
      
      currentX += colWidths[cellIndex];
    });
    
    // Ligne de séparation
    doc.moveTo(PDF_STYLES.MARGINS.LEFT, currentY + 12)
      .lineTo(PDF_STYLES.MARGINS.LEFT + totalWidth, currentY + 12)
      .strokeColor(PDF_STYLES.COLORS.MEDIUM_GRAY)
      .lineWidth(0.3)
      .stroke();
    
    currentY += 15;
  });
  
  return currentY;
}

// Fonction pour dessiner le pied de page
function drawPDFFooter(doc) {
  const footerY = doc.page.height - PDF_STYLES.MARGINS.BOTTOM;
  
  // Ligne de séparation
  doc.moveTo(PDF_STYLES.MARGINS.LEFT, footerY)
    .lineTo(doc.page.width - PDF_STYLES.MARGINS.RIGHT, footerY)
    .strokeColor(PDF_STYLES.COLORS.MEDIUM_GRAY)
    .lineWidth(0.5)
    .stroke();
  
  // Texte du pied de page
  doc.fillColor(PDF_STYLES.COLORS.DARK_GRAY)
    .fontSize(PDF_STYLES.SIZES.SMALL)
    .font(PDF_STYLES.FONTS.BODY)
    .text('Système IN-TAX - Document confidentiel', 
      PDF_STYLES.MARGINS.LEFT, footerY + 5);
  
  // Numéro de page
  const pageNumber = doc.bufferedPageRange().count;
  for (let i = 0; i < pageNumber; i++) {
    doc.switchToPage(i);
    doc.text(
      `Page ${i + 1} sur ${pageNumber}`,
      doc.page.width / 2,
      doc.page.height - 20,
      { align: 'center' }
    );
  }
}

// ==================== FONCTIONS D'EXPORT PDF ====================

async function generateUsersPDF(users, admin, filters = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = createProfessionalPDF('landscape');
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      
      // En-tête
      const startY = drawPDFHeader(doc, {
        title: 'RAPPORT UTILISATEURS - IN-TAX',
        subtitle: 'Liste des contribuables enregistrés',
        adminName: admin.fullName,
        filterInfo: buildFilterInfo(filters)
      });
      
      // Statistiques
      const stats = {
        total: users.length,
        active: users.filter(u => u.isActive).length,
        inactive: users.filter(u => !u.isActive).length,
        withNIF: users.filter(u => u.nifNumber).length,
        withoutNIF: users.filter(u => !u.nifNumber).length
      };
      
      // Configuration du tableau
      const tableConfig = {
        columns: [
          { header: 'Nom & Prénom', width: 2.5, align: 'left' },
          { header: 'Téléphone', width: 1.5, align: 'left' },
          { header: 'NIF', width: 1.5, align: 'left' },
          { header: 'Zone', width: 1.5, align: 'left' },
          { header: 'Activité', width: 1.5, align: 'left' },
          { header: 'Statut NIF', width: 1.5, align: 'center' },
          { header: 'Statut', width: 1, align: 'center', isStatus: true },
          { header: 'Inscription', width: 1.5, align: 'center' }
        ],
        getRowData: (user) => [
          truncateText(`${user.firstName} ${user.lastName}`, 25),
          user.phoneNumber || 'N/A',
          user.nifNumber || 'N/A',
          truncateText(user.zone?.name || 'N/A', 15),
          user.activityType || 'N/A',
          user.nifStatus || 'N/A',
          user.isActive ? 'ACTIVE' : 'INACTIVE',
          formatDate(user.createdAt)
        ]
      };
      
      // Dessiner le tableau
      const tableStartY = startY + 20;
      drawProfessionalTable(doc, users, tableConfig, tableStartY);
      
      // Pied de page
      drawPDFFooter(doc);
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

async function generateDeclarationsPDF(declarations, admin, filters = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = createProfessionalPDF('landscape');
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      
      // En-tête
      const startY = drawPDFHeader(doc, {
        title: 'RAPPORT DÉCLARATIONS - IN-TAX',
        subtitle: 'Export des déclarations fiscales',
        adminName: admin.fullName,
        filterInfo: buildFilterInfo(filters)
      });
      
      // Calcul des statistiques
      const totalAmount = declarations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
      const totalTax = declarations.reduce((sum, d) => sum + (parseFloat(d.taxAmount) || 0), 0);
      
      const stats = {
        total: declarations.length,
        paid: declarations.filter(d => d.status === 'PAID').length,
        pending: declarations.filter(d => d.status === 'PENDING').length,
        rejected: declarations.filter(d => d.status === 'REJECTED').length,
        totalAmount: totalAmount,
        totalTax: totalTax
      };
      
      // Boîte de statistiques
      const statsY = drawStatsBox(doc, stats, startY);
      
      // Configuration du tableau
      const tableConfig = {
        columns: [
          { header: 'ID', width: 1.2, align: 'left' },
          { header: 'Période', width: 1, align: 'center' },
          { header: 'Contribuable', width: 2, align: 'left' },
          { header: 'Zone', width: 1.5, align: 'left' },
          { header: 'Montant (Ar)', width: 1.5, align: 'right' },
          { header: 'Taxe (Ar)', width: 1.5, align: 'right' },
          { header: 'Statut', width: 1.2, align: 'center', isStatus: true },
          { header: 'Date déclaration', width: 1.5, align: 'center' }
        ],
        getRowData: (declaration) => {
          const user = declaration.user || {};
          
          return [
            truncateText(declaration.id, 10),
            declaration.period || 'N/A',
            truncateText(`${user.firstName} ${user.lastName}`, 20),
            truncateText(user.zone?.name || 'N/A', 15),
            formatCurrency(declaration.amount || 0),
            formatCurrency(declaration.taxAmount || 0),
            getStatusText(declaration.status),
            formatDate(declaration.createdAt)
          ];
        }
      };
      
      // Dessiner le tableau
      drawProfessionalTable(doc, declarations, tableConfig, statsY);
      
      // Pied de page
      drawPDFFooter(doc);
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

async function generatePaymentsPDF(payments, admin, filters = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = createProfessionalPDF('landscape');
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
      
      // En-tête
      const startY = drawPDFHeader(doc, {
        title: 'RAPPORT PAIEMENTS - IN-TAX',
        subtitle: 'Historique des transactions',
        adminName: admin.fullName,
        filterInfo: buildFilterInfo(filters)
      });
      
      // Calcul des statistiques
      const totalAmount = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      const completedAmount = payments
        .filter(p => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      
      const stats = {
        total: payments.length,
        completed: payments.filter(p => p.status === 'COMPLETED').length,
        failed: payments.filter(p => p.status === 'FAILED').length,
        pending: payments.filter(p => p.status === 'PENDING').length,
        totalAmount: totalAmount,
        completedAmount: completedAmount
      };
      
      // Boîte de statistiques
      const statsY = drawStatsBox(doc, stats, startY);
      
      // Configuration du tableau
      const tableConfig = {
        columns: [
          { header: 'Transaction', width: 2, align: 'left' },
          { header: 'Contribuable', width: 2, align: 'left' },
          { header: 'Zone', width: 1.5, align: 'left' },
          { header: 'Montant (Ar)', width: 1.5, align: 'right' },
          { header: 'Fournisseur', width: 1.5, align: 'center' },
          { header: 'Statut', width: 1.2, align: 'center', isStatus: true },
          { header: 'Date transaction', width: 1.8, align: 'center' }
        ],
        getRowData: (payment) => {
          const user = payment.user || {};
          const declaration = payment.declaration || {};
          
          return [
            truncateText(payment.id, 15),
            truncateText(`${user.firstName} ${user.lastName}`, 20),
            truncateText(user.zone?.name || 'N/A', 15),
            formatCurrency(payment.amount || 0),
            payment.provider || 'N/A',
            getStatusText(payment.status),
            formatDate(payment.createdAt, true)
          ];
        }
      };
      
      // Dessiner le tableau
      drawProfessionalTable(doc, payments, tableConfig, statsY);
      
      // Pied de page
      drawPDFFooter(doc);
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// ==================== FONCTIONS D'EXPORT EXCEL ====================

async function generateUsersExcel(users, admin, filters = {}) {
  const workbook = new ExcelJS.Workbook();
  
  // Feuille principale
  const worksheet = workbook.addWorksheet('Utilisateurs');
  
  // En-tête
  const titleRow = worksheet.addRow(['RAPPORT UTILISATEURS - IN-TAX']);
  titleRow.font = { bold: true, size: 16, color: { argb: EXCEL_STYLES.HEADER.FILL } };
  titleRow.alignment = { horizontal: 'center' };
  worksheet.mergeCells('A1:H1');
  
  // Informations
  worksheet.addRow([`Généré le: ${new Date().toLocaleDateString('fr-FR')}`]);
  worksheet.addRow([`Administrateur: ${admin.fullName}`]);
  worksheet.addRow([`Filtres: ${buildFilterInfo(filters)}`]);
  worksheet.addRow([]); // Ligne vide
  
  // En-têtes du tableau
  const headers = ['Nom & Prénom', 'Téléphone', 'NIF', 'Zone', 'Région', 'Type Activité', 'Statut NIF', 'Statut', 'Date Inscription'];
  const headerRow = worksheet.addRow(headers);
  
  // Style des en-têtes
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: EXCEL_STYLES.HEADER.FILL }
    };
    cell.font = EXCEL_STYLES.HEADER;
    cell.border = EXCEL_STYLES.HEADER.BORDER;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  
  // Données
  users.forEach(user => {
    const row = worksheet.addRow([
      `${user.firstName} ${user.lastName}`,
      user.phoneNumber || '',
      user.nifNumber || '',
      user.zone?.name || '',
      user.zone?.region || '',
      user.activityType || '',
      user.nifStatus || '',
      user.isActive ? 'ACTIF' : 'INACTIF',
      formatDate(user.createdAt)
    ]);
    
    // Style des cellules
    row.eachCell((cell, colNumber) => {
      cell.border = EXCEL_STYLES.CELL.BORDER;
      
      // Couleur conditionnelle pour le statut
      if (colNumber === 8) { // Colonne Statut
        const status = user.isActive ? 'ACTIVE' : 'INACTIVE';
        cell.font = { 
          color: { argb: EXCEL_STYLES.STATUS_COLORS[status] || 'FF000000' },
          bold: true 
        };
      }
      
      // Alternance de couleurs de fond
      if (row.number % 2 === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' }
        };
      }
    });
  });
  
  // Ajuster les largeurs de colonnes
  worksheet.columns = [
    { width: 25 }, { width: 15 }, { width: 15 }, { width: 20 },
    { width: 15 }, { width: 15 }, { width: 12 }, { width: 10 },
    { width: 15 }
  ];
  
  // Statistiques
  worksheet.addRow([]);
  const statsRow = worksheet.addRow(['STATISTIQUES']);
  statsRow.font = { bold: true, color: { argb: EXCEL_STYLES.HEADER.FILL } };
  worksheet.addRow(['Total utilisateurs', users.length]);
  worksheet.addRow(['Actifs', users.filter(u => u.isActive).length]);
  worksheet.addRow(['Inactifs', users.filter(u => !u.isActive).length]);
  worksheet.addRow(['Avec NIF', users.filter(u => u.nifNumber).length]);
  worksheet.addRow(['Sans NIF', users.filter(u => !u.nifNumber).length]);
  
  return workbook.xlsx.writeBuffer();
}

async function generateDeclarationsExcel(declarations, admin, filters = {}) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Déclarations');
  
  // En-tête
  const titleRow = worksheet.addRow(['RAPPORT DÉCLARATIONS - IN-TAX']);
  titleRow.font = { bold: true, size: 16, color: { argb: EXCEL_STYLES.HEADER.FILL } };
  titleRow.alignment = { horizontal: 'center' };
  worksheet.mergeCells('A1:H1');
  
  // Informations
  worksheet.addRow([`Généré le: ${new Date().toLocaleDateString('fr-FR')}`]);
  worksheet.addRow([`Administrateur: ${admin.fullName}`]);
  worksheet.addRow([`Filtres: ${buildFilterInfo(filters)}`]);
  worksheet.addRow([]);
  
  // En-têtes
  const headers = ['ID', 'Période', 'Contribuable', 'Téléphone', 'Zone', 'Montant (Ar)', 'Taxe (Ar)', 'Statut', 'Date déclaration'];
  const headerRow = worksheet.addRow(headers);
  
  // Style des en-têtes
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: EXCEL_STYLES.HEADER.FILL }
    };
    cell.font = EXCEL_STYLES.HEADER;
    cell.border = EXCEL_STYLES.HEADER.BORDER;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  
  // Données
  declarations.forEach(decl => {
    const user = decl.user || {};
    
    const row = worksheet.addRow([
      decl.id,
      decl.period || '',
      `${user.firstName} ${user.lastName}`,
      user.phoneNumber || '',
      user.zone?.name || '',
      decl.amount || 0,
      decl.taxAmount || 0,
      decl.status,
      formatDate(decl.createdAt)
    ]);
    
    // Style des cellules
    row.eachCell((cell, colNumber) => {
      cell.border = EXCEL_STYLES.CELL.BORDER;
      
      // Format monétaire
      if (colNumber === 6 || colNumber === 7) {
        cell.numFmt = '#,##0';
      }
      
      // Couleur conditionnelle pour le statut
      if (colNumber === 8) {
        const statusColor = EXCEL_STYLES.STATUS_COLORS[decl.status] || 'FF000000';
        cell.font = { 
          color: { argb: statusColor },
          bold: true 
        };
      }
      
      // Alternance de couleurs
      if (row.number % 2 === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' }
        };
      }
    });
  });
  
  // Largeurs de colonnes
  worksheet.columns = [
    { width: 30 }, { width: 12 }, { width: 25 }, { width: 15 },
    { width: 20 }, { width: 15 }, { width: 15 }, { width: 12 },
    { width: 15 }
  ];
  
  // Totaux
  const totalAmount = declarations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
  const totalTax = declarations.reduce((sum, d) => sum + (parseFloat(d.taxAmount) || 0), 0);
  
  worksheet.addRow([]);
  const summaryRow = worksheet.addRow(['TOTAUX', '', '', '', '', totalAmount, totalTax, '', '']);
  summaryRow.getCell(6).numFmt = '#,##0';
  summaryRow.getCell(7).numFmt = '#,##0';
  summaryRow.font = { bold: true, color: { argb: 'FF1a237e' } };
  
  return workbook.xlsx.writeBuffer();
}

async function generatePaymentsExcel(payments, admin, filters = {}) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Paiements');
  
  // En-tête
  const titleRow = worksheet.addRow(['RAPPORT PAIEMENTS - IN-TAX']);
  titleRow.font = { bold: true, size: 16, color: { argb: EXCEL_STYLES.HEADER.FILL } };
  titleRow.alignment = { horizontal: 'center' };
  worksheet.mergeCells('A1:G1');
  
  // Informations
  worksheet.addRow([`Généré le: ${new Date().toLocaleDateString('fr-FR')}`]);
  worksheet.addRow([`Administrateur: ${admin.fullName}`]);
  worksheet.addRow([`Filtres: ${buildFilterInfo(filters)}`]);
  worksheet.addRow([]);
  
  // En-têtes
  const headers = ['ID Transaction', 'Contribuable', 'Zone', 'Montant (Ar)', 'Fournisseur', 'Statut', 'Date transaction'];
  const headerRow = worksheet.addRow(headers);
  
  // Style des en-têtes
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: EXCEL_STYLES.HEADER.FILL }
    };
    cell.font = EXCEL_STYLES.HEADER;
    cell.border = EXCEL_STYLES.HEADER.BORDER;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  
  // Données
  payments.forEach(payment => {
    const user = payment.user || {};
    
    const row = worksheet.addRow([
      payment.id,
      `${user.firstName} ${user.lastName}`,
      user.zone?.name || '',
      payment.amount || 0,
      payment.provider || '',
      payment.status,
      formatDate(payment.createdAt, true)
    ]);
    
    // Style des cellules
    row.eachCell((cell, colNumber) => {
      cell.border = EXCEL_STYLES.CELL.BORDER;
      
      // Format monétaire
      if (colNumber === 4) {
        cell.numFmt = '#,##0';
      }
      
      // Couleur conditionnelle pour le statut
      if (colNumber === 6) {
        const statusColor = EXCEL_STYLES.STATUS_COLORS[payment.status] || 'FF000000';
        cell.font = { 
          color: { argb: statusColor },
          bold: true 
        };
      }
      
      // Alternance de couleurs
      if (row.number % 2 === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' }
        };
      }
    });
  });
  
  // Largeurs de colonnes
  worksheet.columns = [
    { width: 30 }, { width: 25 }, { width: 20 }, { width: 15 },
    { width: 15 }, { width: 12 }, { width: 20 }
  ];
  
  // Résumé financier
  const totalAmount = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const completedAmount = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  
  worksheet.addRow([]);
  worksheet.addRow(['RÉSUMÉ FINANCIER']);
  worksheet.addRow(['Total transactions', payments.length]);
  worksheet.addRow(['Transactions complétées', payments.filter(p => p.status === 'COMPLETED').length]);
  worksheet.addRow(['Montant total', totalAmount]);
  worksheet.addRow(['Montant complété', completedAmount]);
  worksheet.addRow(['Taux de réussite', payments.length > 0 ? `${((payments.filter(p => p.status === 'COMPLETED').length / payments.length) * 100).toFixed(1)}%` : '0%']);
  
  // Style du résumé
  for (let i = worksheet.rowCount - 5; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    if (i === worksheet.rowCount - 5) {
      row.font = { bold: true, color: { argb: EXCEL_STYLES.HEADER.FILL } };
    }
    if (i > worksheet.rowCount - 5 && i < worksheet.rowCount) {
      const cell = row.getCell(2);
      if (i === worksheet.rowCount - 3 || i === worksheet.rowCount - 2) {
        cell.numFmt = '#,##0';
      }
    }
  }
  
  return workbook.xlsx.writeBuffer();
}

// ==================== FONCTIONS DE BUILD ====================
function buildUserExportWhereClause(query, admin) {
  const whereClause = {};

  if (query.status) whereClause.isActive = query.status === 'active';
  if (query.activityType) whereClause.activityType = query.activityType;
  if (query.nifStatus) whereClause.nifStatus = query.nifStatus;

  if (admin.scope !== 'GLOBAL') {
    whereClause.zoneId = { [Op.in]: admin.zoneIds || [] };
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
    whereClause['$user.zoneId$'] = { [Op.in]: admin.zoneIds || [] };
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
    if (query.startDate) whereClause.createdAt[Op.gte] = new Date(query.startDate);
    if (query.endDate) whereClause.createdAt[Op.lte] = new Date(query.endDate);
  }

  if (admin.scope !== 'GLOBAL') {
    whereClause['$user.zoneId$'] = { [Op.in]: admin.zoneIds || [] };
  } else if (query.zoneId) {
    whereClause['$user.zoneId$'] = query.zoneId;
  }

  return whereClause;
}

module.exports = adminExportController;