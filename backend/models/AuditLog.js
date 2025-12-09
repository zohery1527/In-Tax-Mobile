'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AuditLog extends Model {
    static associate(models) {
      this.belongsTo(models.Admin, {
        foreignKey: 'adminId',
        as: 'admin'
      });
    }
  }

  AuditLog.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    adminId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Admins',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    resource: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    resourceId: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('SUCCESS', 'FAILED'),
      defaultValue: 'SUCCESS'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'AuditLogs',
    timestamps: true,
    indexes: [
      {
        fields: ['adminId']
      },
      {
        fields: ['action']
      },
      {
        fields: ['resource']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['status']
      }
    ]
  });

  return AuditLog;
};