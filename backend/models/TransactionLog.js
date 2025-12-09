'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TransactionLog extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      this.belongsTo(models.Declaration, {
        foreignKey: 'declarationId',
        as: 'declaration'
      });
    }
  }

  TransactionLog.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    transactionId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    provider: {
      type: DataTypes.ENUM('ORANGE_MONEY', 'MVOLA', 'AIRTEL_MONEY'),
      allowNull: false,
      validate: {
        isIn: [['ORANGE_MONEY', 'MVOLA', 'AIRTEL_MONEY']]
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        isUUID: 4
      }
    },
    declarationId: {
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        isUUID: 4
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 1
      }
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: true,
        is: /^[0-9+\s()-]+$/ // Validation basique du numéro
      }
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED', 'EXPIRED'),
      defaultValue: 'PENDING',
      validate: {
        isIn: [['PENDING', 'COMPLETED', 'FAILED', 'EXPIRED']]
      }
    },
    mode: {
      type: DataTypes.ENUM('REAL', 'SIMULATION', 'SANDBOX'),
      defaultValue: 'SIMULATION',
      validate: {
        isIn: [['REAL', 'SIMULATION', 'SANDBOX']]
      }
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'TransactionLog',
    tableName: 'TransactionLogs',
    timestamps: true,
    paranoid: false, // Si vous voulez soft delete, mettez à true
    hooks: {
      beforeCreate: (transaction) => {
        // S'assurer que le metadata est un objet
        if (!transaction.metadata || typeof transaction.metadata !== 'object') {
          transaction.metadata = {};
        }
      }
    },
    indexes: [
      { unique: true, fields: ['transactionId'] },
      { fields: ['userId'] },
      { fields: ['declarationId'] },
      { fields: ['status'] },
      { fields: ['provider'] },
      { fields: ['createdAt'] },
      { fields: ['userId', 'status'] },
      { fields: ['provider', 'status'] }
    ]
  });

  return TransactionLog;
};