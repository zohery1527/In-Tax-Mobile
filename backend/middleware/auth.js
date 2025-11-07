const jwt = require('jsonwebtoken');
const db = require('../models');
const { User } = db;

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'accès manquant'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'in_tax_secret');
    const user = await User.findByPk(decoded.id, {
      include: [{ model: db.Zone, as: 'zone' }]
    });

    if (!user || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Utilisateur non trouvé ou inactif'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token invalide ou expiré'
    });
  }
};

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise"
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé. Rôle ${req.user.role} non autorisé`
      });
    }
    
    next();
  };
};

const requireAdmin = requireRole(['ADMIN', 'SUPER_ADMIN']);
const requireAgentOrAbove = requireRole(['AGENT', 'ADMIN', 'SUPER_ADMIN']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireAgentOrAbove
};