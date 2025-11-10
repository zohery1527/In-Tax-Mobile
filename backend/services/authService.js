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

  // async login(phoneNumber) {
  //   const user = await User.findOne({
  //     where: { phoneNumber, isActive: true },
  //     include: [{ model: Zone, as: 'zone' }]
  //   });

  //   if (!user) {

  //     const inactiveUser= await User.findOne({
  //       where:{phoneNumber,isActive:false},
  //     });
  //     if (inactiveUser) {
  //       throw new Error("Votre compte est inactif.Veuillez contacter le support.");
  //     }
  //     throw new Error('Aucun compte trouvé avec ce numéro');
  //   }

  //   const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  //   await PendingOTP.create({
  //     userId: user.id,
  //     phoneNumber,
  //     code: otpCode,
  //     purpose: 'LOGIN',
  //     expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  //     used: false
  //   });

  //   try {
  //     await smsService.sendOTP(phoneNumber, otpCode, 'connexion');
  //   } catch (error) {
  //     console.error("Erreur envoi SMS OTP:", error);
  //   }

  //   const response={
  //     userId:user.id,
  //     message:'Code OTP de connexionenvoyé'
  //   };


  //   if(process.env.DEMO_MODE_ENABLED==='true'){
  //     response.devOtpCode=otpCode;
  //     console.log(`[RENDER DEMO MODE] OTP inclus dans la réponse API:${otpCode}`);
  //   }

  //   return response;
  // },

//   async login(phoneNumber) {
//   const user = await User.findOne({
//     where: { phoneNumber, isActive: true },
//     include: [{ model: Zone, as: 'zone' }]
//   });
  
//   if (!user) {
//     const inactiveUser = await User.findOne({
//       where: { phoneNumber, isActive: false },
//     });
//     if (inactiveUser) {
//       throw new Error("Votre compte est inactif. Veuillez contacter le support.");
//     }
//     throw new Error('Aucun compte trouvé avec ce numéro');
//   }

//   const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

//   await PendingOTP.create({
//     userId: user.id,
//     phoneNumber,
//     code: otpCode,
//     purpose: 'LOGIN',
//     expiresAt: new Date(Date.now() + 10 * 60 * 1000),
//     used: false
//   });

//   try {
//     await smsService.sendOTP(phoneNumber, otpCode, 'connexion');
//     console.log(`✅ SMS OTP envoyé à ${phoneNumber}`);
//   } catch (error) {
//     console.error("❌ Erreur envoi SMS OTP:", error);
//   }

//   // 🔥 TOUJOURS retourner l'OTP dans la réponse
//   const response = {
//     userId: user.id,
//     message: 'Code OTP de connexion envoyé',
//     otpCode: otpCode, // L'OTP est toujours retourné
//     debugInfo: {
//       phoneNumber: phoneNumber,
//       timestamp: new Date().toISOString(),
//       expiresIn: '10 minutes'
//     }
//   };

//   console.log(`🎯 [IN-TAX OTP] ${phoneNumber} → Code: ${otpCode}`);
//   console.log(`⏰ Valide jusqu'à: ${new Date(Date.now() + 10 * 60 * 1000).toLocaleTimeString()}`);
  
//   return response;
// },


async login(phoneNumber) {
  // Chercher d'abord tout utilisateur avec ce numéro (actif ou non)
  const user = await User.findOne({
    where: { phoneNumber },
    include: [{ model: Zone, as: 'zone' }]
  });

  if (!user) {
    // Aucun utilisateur avec ce numéro
    throw new Error('Aucun compte trouvé avec ce numéro');
  }

  // Vérifier si le compte est actif
  if (!user.isActive) {
    throw new Error("Votre compte est inactif. Veuillez contacter le support.");
  }

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

  try {
    await smsService.sendOTP(phoneNumber, otpCode, 'connexion');
    console.log(`✅ SMS OTP envoyé à ${phoneNumber}`);
  } catch (error) {
    console.error("❌ Erreur envoi SMS OTP:", error);
  }

  // Retourner la réponse avec l'OTP
  const response = {
    userId: user.id,
    message: 'Code OTP de connexion envoyé',
    otpCode: otpCode, // Toujours retourner l'OTP
    debugInfo: {
      phoneNumber: phoneNumber,
      role: user.role,
      timestamp: new Date().toISOString(),
      expiresIn: '10 minutes'
    }
  };

  console.log(`🎯 [IN-TAX OTP] ${phoneNumber} → Code: ${otpCode}`);
  console.log(`⏰ Valide jusqu'à: ${new Date(Date.now() + 10 * 60 * 1000).toLocaleTimeString()}`);
  
  return response;
}

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
