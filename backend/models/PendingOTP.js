'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PendingOTP extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  PendingOTP.init({
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
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    otpCode: {
      type: DataTypes.STRING(6),
      allowNull: false
    },
    otpHash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    purpose: {
      type: DataTypes.ENUM('LOGIN', 'REGISTRATION', 'PASSWORD_RESET', 'PHONE_VERIFICATION'),
      defaultValue: 'LOGIN'
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'PendingOTP',
    tableName: 'PendingOTPs',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['phoneNumber']
      },
      {
        fields: ['expiresAt']
      },
      {
        fields: ['isUsed']
      },
      {
        fields: ['purpose']
      }
    ]
  });

  return PendingOTP;
};