'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      this.belongsTo(models.Declaration, {
        foreignKey: 'declarationId',
        as: 'declaration'
      });
      this.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  Payment.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    declarationId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      get() {
        return Number(this.getDataValue('amount') || 0);
      }
    },
    paymentType: {
      type: DataTypes.ENUM('FULL', 'PARTIAL'),
      defaultValue: 'FULL'
    },
    remainingAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      get() {
        return Number(this.getDataValue('remainingAmount') || 0);
      }
    },
    provider: {
      type: DataTypes.ENUM('ORANGE_MONEY', 'MVOLA', 'AIRTEL_MONEY'),
      allowNull: false
    },
    nifNumber: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    transactionId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'),
      defaultValue: 'PENDING'
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    paidAt: DataTypes.DATE,
    processedBy: DataTypes.UUID,
    refundedAt: DataTypes.DATE,
    refundedBy: DataTypes.UUID,
    refundReason: DataTypes.TEXT,
    adminNotes: DataTypes.TEXT,
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Payment',
    tableName: 'Payments',
    timestamps: true,
    hooks: {
      beforeCreate: async (payment) => {
        // Détection automatique du type
        if (payment.remainingAmount === 0) {
          payment.paymentType = 'FULL';
        } else {
          payment.paymentType = 'PARTIAL';
        }
      },
      beforeUpdate: (payment) => {
        if (payment.changed('status') && payment.status === 'COMPLETED' && !payment.paidAt) {
          payment.paidAt = new Date();
        }
      }
    },
    indexes: [
      { unique: true, fields: ['transactionId'] },
      { fields: ['declarationId'] },
      { fields: ['nifNumber'] },
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['provider'] }
    ]
  });

  return Payment;
};
