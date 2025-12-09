'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SystemConfig extends Model {
    static associate(models) {
      this.belongsTo(models.Admin, {
        foreignKey: 'updatedBy',
        as: 'updatedByAdmin'
      });
    }
  }

  SystemConfig.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    value: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.ENUM('TAX', 'NOTIFICATION', 'PAYMENT', 'SYSTEM', 'SECURITY'),
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Admins',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'SystemConfig',
    tableName: 'SystemConfigs',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['key']
      },
      {
        fields: ['category']
      },
      {
        fields: ['isActive']
      }
    ]
  });

  return SystemConfig;
};