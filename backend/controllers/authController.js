const authService = require('../services/authService');
const {Zone}=require('../models');
const authController = {
  // INSCRIPTION
  async register(req, res) {
    try {
      const { phoneNumber, firstName, lastName, activityType, zoneId } = req.body;

      const requiredFields = ['phoneNumber', 'firstName', 'lastName', 'activityType', 'zoneId'];
      const missingFields = requiredFields.filter(field => !req.body[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Champs manquants: ${missingFields.join(', ')}`
        });
      }

      const result = await authService.register({ phoneNumber, firstName, lastName, activityType, zoneId });

      res.status(201).json({
        success: true,
        message: result.message,
        data: {
          user: result.user,
          debug: process.env.NODE_ENV === 'development' ? { otpCode: result.otpCode } : undefined
        }
      });
    } catch (error) {
      console.error("Erreur inscription:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  },



  //recuperation zone
async getAllzone(req, res) {
  try {
    const zones = await Zone.findAll();

    return res.json({
      success: true,
      data: zones
    });

  } catch (error) {
    console.error("Erreur récupération zones:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
},

  // CONNEXION
  // Fichier : authController.js (fonction login)
 async login(req, res) {

    try {

      const { phoneNumber } = req.body;



      if (!phoneNumber) {

        return res.status(400).json({ success: false, message: 'Le numéro de téléphone est requis' });

      }



      const result = await authService.login(phoneNumber);



      res.json({
        success: true,
        message: result.message,
        data: {
          userId: result.userId,
          role: result.debugInfo.role,
          otpCode: result.otpCode,
          debug: result.debugInfo
        }

      });

    } catch (error) {

      console.error('Erreur Connexion:', error);

      res.status(400).json({ success: false, message: error.message });

    }

  },
  // VERIFICATION OTP
  async verifyOTP(req, res) {
    try {
      const { userId, otpCode } = req.body;

      if (!userId || !otpCode) {
        return res.status(400).json({ success: false, message: "User ID et code OTP sont requis" });
      }

      const result = await authService.verifyOTP(userId, otpCode);

      res.json({
        success: true,
        message: "Connexion réussie",
        data: { token: result.token, user: result.user }
      });
    } catch (error) {
      console.error('Erreur vérification OTP:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // PROFIL
async getProfile(req, res) {
  try {
    // ✅ CORRIGÉ : Retourne directement l'utilisateur dans data
    res.json({ 
      success: true, 
      data: req.user  // ← Plus de nesting "user"
    });
  } catch (error) {
    console.error('Erreur profil:', error);
    res.status(500).json({ success: false, message: "Erreur lors de la récupération du profil" });
  }
},
  
  // RENVOYER OTP
async resendOtp(req, res) {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID requis"
      });
    }

    const result = await authService.resendOtp(userId);

    res.json({
      success: true,
      message: "Nouveau OTP envoyé",
      data: result
    });

  } catch (error) {
    console.error("Erreur resend OTP:", error);
    res.status(400).json({ success: false, message: error.message });
  }
},
// controllers/authController.js - AJOUTER
async updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const updateData = req.body;
    
    // Champs autorisés à la modification
    const allowedFields = ['firstName', 'lastName', 'activityType'];
    const filteredData = {};
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });
    
    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune donnée valide à mettre à jour'
      });
    }
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    await user.update(filteredData);
    
    // Recharger avec les relations
    const updatedUser = await User.findByPk(userId, {
      include: [{ model: Zone, as: 'zone' }]
    });
    
    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: updatedUser
    });
    
  } catch (error) {
    console.error('❌ Erreur mise à jour profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil'
    });
  }
},
// controllers/authController.js - AJOUTER
async logout(req, res) {
  try {
    // Dans une implémentation réelle, vous pourriez:
    // 1. Invalider le token côté serveur (blacklist)
    // 2. Supprimer le refresh token de la base
    // 3. Journaliser la déconnexion
    
    console.log(`✅ Déconnexion utilisateur: ${req.user?.id}`);
    
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    console.error('❌ Erreur déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion'
    });
  }
},
// controllers/authController.js - AJOUTER
async refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token requis'
      });
    }

    // Vérifier le refresh token (exemple simplifié)
    // En production, utiliser une stratégie sécurisée
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'in_tax_refresh_secret');
    
    // Vérifier si l'utilisateur existe toujours
    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Utilisateur non trouvé ou inactif'
      });
    }

    // Générer un nouveau token
    const newToken = jwt.sign(
      {
        id: user.id,
        phoneNumber: user.phoneNumber,
        role: user.role
      },
      process.env.JWT_SECRET || 'in_tax_secret',
      { expiresIn: '7d' }
    );

    // Optionnel: générer un nouveau refresh token
    const newRefreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || 'in_tax_refresh_secret',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    console.error('❌ Erreur refresh token:', error);
    res.status(403).json({
      success: false,
      message: 'Refresh token invalide ou expiré'
    });
  }
}

};

module.exports = authController;
