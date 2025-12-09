// controllers/admin/adminAuthController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Admin, AuditLog } = require('../../models');

const adminAuthController = {

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email et mot de passe requis'
        });
      }

      const admin = await Admin.findOne({ where: { email } });
      
      if (!admin || !admin.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Identifiants invalides ou compte désactivé'
        });
      }

      // Vérifier le mot de passe
      const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
      
      if (!isValidPassword) {
        await AuditLog.create({
          adminId: admin.id,
          action: 'LOGIN_FAILED',
          resource: 'AUTH',
          ipAddress: req.ip,
          status: 'FAILED',
          details: { email }
        });

        return res.status(401).json({
          success: false,
          message: 'Identifiants invalides'
        });
      }

      // Générer token
      const token = jwt.sign(
        { 
          adminId: admin.id,
          role: admin.role,
          permissions: admin.permissions,
          scope: admin.scope
        },
        process.env.ADMIN_JWT_SECRET,
        { expiresIn: '8h' }
      );

      // Mettre à jour dernière connexion
      await admin.update({ lastLogin: new Date() });

      // Log de connexion
      await AuditLog.create({
        adminId: admin.id,
        action: 'LOGIN_SUCCESS',
        resource: 'AUTH',
        ipAddress: req.ip,
        status: 'SUCCESS'
      });

      res.json({
        success: true,
        message: 'Connexion administrateur réussie',
        data: {
          token,
          admin: {
            id: admin.id,
            email: admin.email,
            username: admin.username,
            fullName: admin.fullName,
            role: admin.role,
            scope: admin.scope,
            permissions: admin.permissions
          }
        }
      });

    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la connexion'
      });
    }
  },

  getProfile: async (req, res) => {
    try {
      const admin = await Admin.findByPk(req.admin.id, {
        attributes: { exclude: ['passwordHash'] },
        include: [{
          association: 'zones',
          attributes: ['id', 'name', 'code', 'region']
        }]
      });

      res.json({
        success: true,
        data: { admin }
      });

    } catch (error) {
      console.error('Get admin profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du profil'
      });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { fullName, email } = req.body;
      const admin = req.admin;

      await admin.update({ fullName, email });

      await AuditLog.create({
        adminId: admin.id,
        action: 'UPDATE_PROFILE',
        resource: 'ADMIN',
        status: 'SUCCESS'
      });

      res.json({
        success: true,
        message: 'Profil mis à jour avec succès',
        data: { admin }
      });

    } catch (error) {
      console.error('Update admin profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du profil'
      });
    }
  }
};

module.exports = adminAuthController;