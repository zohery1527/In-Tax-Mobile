'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class NIFHistory extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  NIFHistory.init({
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
    nifNumber: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    action: {
      type: DataTypes.ENUM('CREATED', 'UPDATED', 'SUSPENDED', 'REJECTED', 'VALIDATED'),
      allowNull: false
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    performedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    performedType: {
      type: DataTypes.ENUM('USER', 'ADMIN', 'SYSTEM'),
      defaultValue: 'USER'
    },
    oldValue: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    newValue: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'NIFHistory',
    tableName: 'NIFHistories',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['nifNumber']
      },
      {
        fields: ['action']
      },
      {
        fields: ['performedBy']
      }
    ]
  });

  return NIFHistory;
};