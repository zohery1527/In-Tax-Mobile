'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Declaration extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });

      this.hasMany(models.Payment, {
        foreignKey: 'declarationId',
        as: 'payments'
      });
    }
  }

  Declaration.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      get() {
        const value = this.getDataValue('amount');
        return value ? Number(value) : 0;
      }
    },
    nifNumber: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    period: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        is: /^[0-9]{4}-[0-9]{2}$/
      }
    },
    activityType: {
      type: DataTypes.ENUM('ALIMENTATION', 'ARTISANAT', 'COMMERCE', 'SERVICES', 'AUTRE'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'VALIDATED', 'REJECTED', 'PARTIALLY_PAID', 'PAID'),
      defaultValue: 'PENDING'
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      get() {
        return Number(this.getDataValue('taxAmount') || 0);
      }
    },
    paidAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      get() {
        return Number(this.getDataValue('paidAmount') || 0);
      }
    },
    remainingAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      get() {
        return Number(this.getDataValue('remainingAmount') || 0);
      }
    },
    description: DataTypes.TEXT,
    validatedAt: DataTypes.DATE,
    validatedBy: DataTypes.UUID,
    rejectedAt: DataTypes.DATE,
    rejectedBy: DataTypes.UUID,
    rejectionReason: DataTypes.TEXT,
    internalNotes: DataTypes.TEXT,
    priority: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
      defaultValue: 'LOW'
    }
  }, {
    sequelize,
    modelName: 'Declaration',
    tableName: 'Declarations',
    timestamps: true,
    hooks: {
      beforeSave: (declaration) => {
        const tax = declaration.taxAmount || 0;
        const paid = declaration.paidAmount || 0;
        declaration.remainingAmount = Math.max(0, tax - paid);

        if (tax > 0 && declaration.remainingAmount === 0) {
          declaration.status = 'PAID';
        } else if (paid > 0 && declaration.remainingAmount > 0) {
          declaration.status = 'PARTIALLY_PAID';
        }
      }
    },
    indexes: [
      { unique: true, fields: ['userId', 'period'] },
      { fields: ['status'] },
      { fields: ['nifNumber'] },
      { fields: ['period'] },
      { fields: ['priority'] }
    ]
  });

  return Declaration;
};
