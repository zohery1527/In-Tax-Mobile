'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Admin extends Model {
    static associate(models) {
      this.hasMany(models.AuditLog, {
        foreignKey: 'adminId',
        as: 'auditLogs'
      });
      this.hasMany(models.NIFHistory, {
        foreignKey: 'performedBy',
        as: 'nifActions'
      });
      this.belongsToMany(models.Zone, {
        through: 'AdminZones',
        foreignKey: 'adminId',
        otherKey: 'zoneId',
        as: 'zones'
      });
      this.hasMany(models.AdminZone, {
        foreignKey: 'adminId',
        as: 'adminZones'
      });
    }
  }

  Admin.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 100]
      }
    },
    fullName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('SUPER_ADMIN', 'ADMIN_REGIONAL', 'ADMIN_ZONE', 'AGENT_FINANCE', 'AGENT_SUPPORT'),
      defaultValue: 'AGENT_SUPPORT',
      allowNull: false
    },
    scope: {
      type: DataTypes.ENUM('GLOBAL', 'REGIONAL', 'ZONAL'),
      defaultValue: 'ZONAL',
      allowNull: false
    },
    region: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    permissions: {
      type: DataTypes.JSONB,
      defaultValue: [],
      allowNull: false
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    loginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lockedUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    twoFactorSecret: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Admin',
    tableName: 'Admins',
    timestamps: true,
    hooks: {
      beforeCreate: (admin) => {
        // Définir les permissions par défaut selon le rôle
        admin.permissions = getDefaultPermissions(admin.role);
      }
    },
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        unique: true,
        fields: ['username']
      },
      {
        fields: ['role']
      },
      {
        fields: ['scope']
      },
      {
        fields: ['isActive']
      }
    ]
  });

  return Admin;
};

// Permissions par défaut selon les rôles
function getDefaultPermissions(role) {
  const permissions = {
    SUPER_ADMIN: [
      'user:*',
      'declaration:*',
      'payment:*',
      'admin:*',
      'system:*',
      'audit:*',
      'report:*'
    ],
    ADMIN_REGIONAL: [
      'user:view',
      'user:update',
      'declaration:view',
      'declaration:validate',
      'payment:view',
      'payment:refund',
      'report:view',
      'report:export',
      'notification:send'
    ],
    ADMIN_ZONE: [
      'user:view',
      'declaration:view',
      'declaration:validate',
      'payment:view',
      'report:view'
    ],
    AGENT_FINANCE: [
      'declaration:view',
      'declaration:validate',
      'payment:view',
      'payment:refund',
      'report:view'
    ],
    AGENT_SUPPORT: [
      'user:view',
      'user:update',
      'declaration:view',
      'payment:view',
      'notification:send'
    ]
  };
  
  return permissions[role] || [];
}