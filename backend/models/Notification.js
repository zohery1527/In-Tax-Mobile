'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  Notification.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM(
        'DEADLINE_REMINDER',
        'PAYMENT_PENDING', 
        'NIF_STATUS',
        'PAYMENT_SUCCESS',
        'DECLARATION_SUBMITTED',
        'SYSTEM_ALERT',
        'TAX_REMINDER',
        'NEW_FEATURE'
      ),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    actionUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'Notifications',
    timestamps: true,
    indexes: [
      {
        fields: ['userId', 'isRead']
      },
      {
        fields: ['userId', 'isActive']
      },
      {
        fields: ['type']
      },
      {
        fields: ['expiresAt']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  return Notification;
};