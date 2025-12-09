// middleware/adminAuth.js
const jwt = require('jsonwebtoken');
const { Admin, AuditLog } = require('../models');

const adminAuth = {
  // Authentification de base
  authenticate: async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token d\'administration requis'
        });
      }

      const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || 'admin_secret_fallback');
      const admin = await Admin.findByPk(decoded.adminId, {
        attributes: { exclude: ['passwordHash'] }
      });

      if (!admin || !admin.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Compte administrateur invalide ou désactivé'
        });
      }

      req.admin = admin;
      next();
    } catch (error) {
      console.error('Admin auth error:', error);
      return res.status(401).json({
        success: false,
        message: 'Token d\'administration invalide'
      });
    }
  },

  // Vérification de rôle
  requireRole: (roles) => {
    return (req, res, next) => {
      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: 'Authentification administrateur requise'
        });
      }

      if (!Array.isArray(roles)) {
        roles = [roles];
      }

      if (!roles.includes(req.admin.role)) {
        return res.status(403).json({
          success: false,
          message: `Rôle ${req.admin.role} non autorisé pour cette action`
        });
      }

      next();
    };
  },

  // Vérification de permission
  requirePermission: (permission) => {
    return (req, res, next) => {
      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: 'Authentification administrateur requise'
        });
      }

      const hasPermission = checkPermission(req.admin, permission);
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Permission "${permission}" requise`
        });
      }

      next();
    };
  },

  // Middleware d'audit
  audit: (action, resource) => {
    return async (req, res, next) => {
      const originalSend = res.send;
      
      res.send = function(data) {
        // Log après l'envoi de la réponse
        setTimeout(async () => {
          try {
            await AuditLog.create({
              adminId: req.admin?.id,
              action,
              resource,
              resourceId: req.params.id,
              details: {
                method: req.method,
                url: req.url,
                params: req.params,
                body: sanitizeBody(req.body),
                statusCode: res.statusCode
              },
              ipAddress: req.ip,
              userAgent: req.get('User-Agent'),
              status: res.statusCode < 400 ? 'SUCCESS' : 'FAILED'
            });
          } catch (error) {
            console.error('Audit log error:', error);
          }
        }, 0);

        originalSend.call(this, data);
      };

      next();
    };
  }
};

// Vérifier les permissions
function checkPermission(admin, requiredPermission) {
  if (admin.role === 'SUPER_ADMIN') {
    return true;
  }

  const permissions = admin.permissions || [];
  
  // Gestion des wildcards (user:*)
  if (requiredPermission.includes('*')) {
    const [resource] = requiredPermission.split(':');
    return permissions.some(perm => perm.startsWith(`${resource}:`));
  }

  return permissions.includes(requiredPermission);
}

// Nettoyer le body pour l'audit (exclure les mots de passe)
function sanitizeBody(body) {
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'passwordHash', 'otp', 'token'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  });
  
  return sanitized;
}

module.exports = adminAuth;