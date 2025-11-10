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

  // 🎯 CONVERSION OBLIGATOIRE VERS FORMAT 0...
  let searchNumber = phoneNumber.trim();
  
  // Supprimer tous les caractères non numériques sauf le +
  searchNumber = searchNumber.replace(/[^\d+]/g, '');
  
  console.log('🔄 Numéro nettoyé:', searchNumber);

  // Conversion: +261342015572 → 0342015572
  if (searchNumber.startsWith('+261')) {
    searchNumber = '0' + searchNumber.substring(4);
  } 
  // Conversion: 261342015572 → 0342015572  
  else if (searchNumber.startsWith('261')) {
    searchNumber = '0' + searchNumber.substring(3);
  }
  // Si le numéro a 9 chiffres sans préfixe, ajouter 0
  else if (searchNumber.length === 9 && !isNaN(searchNumber)) {
    searchNumber = '0' + searchNumber;
  }

  console.log('🔍 RECHERCHE avec numéro converti:', searchNumber);

  // 🎯 RECHERCHE AVEC LE NUMÉRO CONVERTI
  const user = await User.findOne({
    where: { 
      phoneNumber: searchNumber, 
      isActive: true 
    },
    include: [{ model: Zone, as: 'zone' }]
  });

  if (!user) {
    console.log('❌ AUCUN UTILISATEUR TROUVÉ:', {
      reçu: phoneNumber,
      converti: searchNumber
    });
    
    const inactiveUser = await User.findOne({ 
      where: { 
        phoneNumber: searchNumber, 
        isActive: false 
      } 
    });
    
    if (inactiveUser) {
      console.log('❌ UTILISATEUR INACTIF:', inactiveUser.phoneNumber);
      throw new Error("Votre compte est inactif. Veuillez contacter le support.");
    }
    
    // 🎯 DEBUG: Afficher tous les numéros en base
    const allUsers = await User.findAll({
      attributes: ['phoneNumber', 'firstName', 'lastName', 'isActive'],
      limit: 10
    });
    console.log('📋 NUMÉROS EN BASE:', allUsers.map(u => ({
      phone: u.phoneNumber,
      name: `${u.firstName} ${u.lastName}`,
      active: u.isActive
    })));
    
    throw new Error('Aucun compte trouvé avec ce numéro');
  }

  console.log('✅ UTILISATEUR TROUVÉ:', {
    recherché: phoneNumber,
    enBase: user.phoneNumber, 
    nom: `${user.firstName} ${user.lastName}`
  });

  // Générer l'OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  await PendingOTP.create({
    userId: user.id,
    phoneNumber: user.phoneNumber, // Utiliser le numéro de la base
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

  const response = {
    userId: user.id,
    message: 'Code OTP de connexion envoyé',
    otpCode, // Toujours retourner l'OTP pour tests
    debugInfo: {
      phoneNumber: user.phoneNumber, // Retourner le numéro de la base
      role: user.role,
      timestamp: new Date().toISOString(),
      expiresIn: '10 minutes'
    }
  };

  if (process.env.DEMO_MODE_ENABLED === 'true') {
    console.log(`[RENDER DEMO MODE] OTP inclus dans la réponse API: ${otpCode}`);
  }

  return response;
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
