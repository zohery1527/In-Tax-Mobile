const jwt = require('jsonwebtoken');
const db = require('../models');
const smsService = require('./SMSService');
const NIFService = require('./NIFService');

const { User, Zone, PendingOTP } = db;

const authService = {
  async register(userData) {
    const { phoneNumber, firstName, lastName, activityType, zoneId } = userData;

    const zone = await Zone.findByPk(zoneId);
    if (!zone) {
      throw new Error('Zone non trouvée');
    }

    const existingUser = await User.findOne({ where: { phoneNumber } });
    if (existingUser) {
      throw new Error("Ce numéro de téléphone est déjà enregistré");
    }

    const nifNumber = NIFService.generateNIF(zone.code);

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

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await PendingOTP.create({
      userId: user.id,
      phoneNumber,
      code: otpCode,
      purpose: 'LOGIN',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      used: false
    });

    await NIFService.createNIFHistory(
      user.id,
      nifNumber,
      'CREATED',
      'Attribution automatique lors de l\'inscription'
    );

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

  async login(phoneNumber) {
    const user = await User.findOne({
      where: { phoneNumber, isActive: true },
      include: [{ model: Zone, as: 'zone' }]
    });

    if (!user) {
      throw new Error('Aucun compte trouvé avec ce numéro');
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await PendingOTP.create({
      userId: user.id,
      phoneNumber,
      code: otpCode,
      purpose: 'LOGIN',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      used: false
    });

    try {
      await smsService.sendOTP(phoneNumber, otpCode, 'connexion');
    } catch (error) {
      console.error("Erreur envoi SMS OTP:", error);
      throw new Error('Erreur envoi SMS. Veuillez réessayer.');
    }

    return {
      userId: user.id,
      otpCode:otpCode,
      message: "Code de connexion envoyé"
    };
  },

  async verifyOTP(userId, otpCode) {
    const pendingOTP = await PendingOTP.findOne({
      where: {
        userId,
        code: otpCode,
        used: false,
        expiresAt: { [db.Sequelize.Op.gt]: new Date() }
      },
      include: [
        { model: User, as: 'user',
           include: [{ model: Zone, as: 'zone' }]
         },
        
      ]
    });

    if (!pendingOTP) {
      throw new Error('Code OTP invalide ou expiré');
    }

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
