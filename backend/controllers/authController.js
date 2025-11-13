const authService = require('../services/authService');

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
      res.json({ success: true, data: { user: req.user } });
    } catch (error) {
      console.error('Erreur profil:', error);
      res.status(500).json({ success: false, message: "Erreur lors de la récupération du profil" });
    }
  }
};

module.exports = authController;
