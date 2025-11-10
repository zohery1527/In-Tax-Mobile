const jwt = require('jsonwebtoken');
const db = require('../models');
const smsService = require('./SMSService');
const NIFService = require('./NIFService');

const { User, Zone, PendingOTP } = db;

const authService = {
  // Inscription
  async register(userData) {
    const { phoneNumber, firstName, lastName, activityType, zoneId } = userData;

    // Vérifier la zone
    const zone = await Zone.findByPk(zoneId);
    if (!zone) throw new Error('Zone non trouvée');

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ where: { phoneNumber } });
    if (existingUser) throw new Error("Ce numéro de téléphone est déjà enregistré");

    // Générer un NIF
    const nifNumber = NIFService.generateNIF(zone.code);

    // Créer l'utilisateur
    const user = await User.create({
      phoneNumber,
      firstName,
      lastName,
      activityType,
      zoneId,
      nifNumber,
      nifAttributionDate: new Date(),
      role: 'VENDEUR',
      isActive: true
    });
// 0342015272
    // Générer l'OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await PendingOTP.create({
      userId: user.id,
      phoneNumber,
      code: otpCode,
      purpose: 'LOGIN',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      used: false
    });

    // Historique NIF
    await NIFService.createNIFHistory(
      user.id,
      nifNumber,
      'CREATED',
      'Attribution automatique lors de l\'inscription'
    );

    // Envoyer SMS OTP
    try {
      await smsService.sendOTP(phoneNumber, otpCode, 'inscription');
    } catch (error) {
      console.error("Erreur envoi SMS OTP:", error);
    }

    return {
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        activityType: user.activityType,
        zone: zone.name,
        nifNumber,
        nifStatus: 'PENDING'
      },
      otpCode: process.env.NODE_ENV === 'development' ? otpCode : undefined,
      message: 'Code de vérification envoyé'
    };
  },

  // Connexion
async login(phoneNumber) {
  console.log('🔐 TENTATIVE CONNEXION avec:', phoneNumber);

  // 🎯 CONVERSION MULTI-DIRECTIONNELLE
  let searchNumbers = [phoneNumber.trim().replace(/[^\d+]/g, '')];
  
  const originalNumber = searchNumbers[0];
  
  // Conversion: 0386573293 → +261386573293 (pour les admins)
  if (originalNumber.startsWith('0') && originalNumber.length === 10) {
    searchNumbers.push('+261' + originalNumber.substring(1));
    searchNumbers.push('261' + originalNumber.substring(1));
  }
  // Conversion: +261386573293 → 0386573293 (pour les vendeurs)  
  else if (originalNumber.startsWith('+261') && originalNumber.length === 13) {
    searchNumbers.push('0' + originalNumber.substring(4));
    searchNumbers.push('261' + originalNumber.substring(1));
  }
  // Conversion: 261386573293 → 0386573293
  else if (originalNumber.startsWith('261') && originalNumber.length === 12) {
    searchNumbers.push('0' + originalNumber.substring(3));
    searchNumbers.push('+' + originalNumber);
  }

  // Supprimer les doublons
  searchNumbers = [...new Set(searchNumbers)];
  
  console.log('🔍 FORMATS DE RECHERCHE:', searchNumbers);

  let user = null;
  
  // Essayer chaque format
  for (const searchNumber of searchNumbers) {
    user = await User.findOne({
      where: { 
        phoneNumber: searchNumber,
        isActive: true 
      },
      include: [{ model: Zone, as: 'zone' }]
    });
    
    if (user) {
      console.log(`✅ UTILISATEUR TROUVÉ avec format: "${searchNumber}"`);
      console.log(`   Détails: ${user.firstName} ${user.lastName} (${user.phoneNumber})`);
      break;
    }
  }

  if (!user) {
    console.log('❌ AUCUN UTILISATEUR TROUVÉ avec formats:', searchNumbers);
    
    // Debug: afficher tous les users
    const allUsers = await User.findAll({
      attributes: ['phoneNumber', 'firstName', 'lastName', 'isActive'],
      limit: 10
    });
    console.log('📋 TOUS LES UTILISATEURS:', allUsers.map(u => ({
      phone: u.phoneNumber,
      name: `${u.firstName} ${u.lastName}`,
      active: u.isActive
    })));
    
    throw new Error('Aucun compte trouvé avec ce numéro');
  }

  console.log('🎯 CONNEXION RÉUSSIE:', {
    reçu: phoneNumber,
    trouvé: user.phoneNumber,
    nom: `${user.firstName} ${user.lastName}`
  });

  // Générer l'OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  await PendingOTP.create({
    userId: user.id,
    phoneNumber: user.phoneNumber,
    code: otpCode,
    purpose: 'LOGIN',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    used: false
  });

  // Envoyer SMS OTP
  try {
    await smsService.sendOTP(user.phoneNumber, otpCode, 'connexion');
    console.log(`✅ SMS OTP envoyé à ${user.phoneNumber}`);
  } catch (error) {
    console.error("❌ Erreur envoi SMS OTP:", error);
  }

  return {
    userId: user.id,
    message: 'Code OTP de connexion envoyé',
    otpCode,
    debugInfo: {
      phoneNumber: user.phoneNumber,
      role: user.role,
      timestamp: new Date().toISOString()
    }
  };
},

  // Vérification OTP
  async verifyOTP(userId, otpCode) {
    const pendingOTP = await PendingOTP.findOne({
      where: {
        userId,
        code: otpCode,
        used: false,
        expiresAt: { [db.Sequelize.Op.gt]: new Date() }
      },
      include: [{ model: User, as: 'user', include: [{ model: Zone, as: 'zone' }] }]
    });

    if (!pendingOTP) throw new Error('Code OTP invalide ou expiré');

    await pendingOTP.update({ used: true });

    const token = jwt.sign(
      {
        id: pendingOTP.user.id,
        phoneNumber: pendingOTP.user.phoneNumber,
        role: pendingOTP.user.role
      },
      process.env.JWT_SECRET || 'in_tax_secret',
      { expiresIn: '7d' }
    );

    await pendingOTP.user.update({ lastLogin: new Date() });

    return {
      token,
      user: {
        id: pendingOTP.user.id,
        phoneNumber: pendingOTP.user.phoneNumber,
        firstName: pendingOTP.user.firstName,
        lastName: pendingOTP.user.lastName,
        role: pendingOTP.user.role,
        activityType: pendingOTP.user.activityType,
        zone: pendingOTP.user.zone.name,
        nifNumber: pendingOTP.user.nifNumber,
        nifStatus: pendingOTP.user.nifStatus
      }
    };
  }
};

module.exports = authService;
