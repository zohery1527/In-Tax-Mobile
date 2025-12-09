'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AdminZone extends Model {
    static associate(models) {
      this.belongsTo(models.Admin, {
        foreignKey: 'adminId',
        as: 'admin'
      });
      this.belongsTo(models.Zone, {
        foreignKey: 'zoneId',
        as: 'zone'
      });
    }
  }

  AdminZone.init({
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
    zoneId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Zones',
        key: 'id'
      }
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'AdminZone',
    tableName: 'AdminZones',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['adminId', 'zoneId']
      },
      {
        fields: ['adminId']
      },
      {
        fields: ['zoneId']
      }
    ]
  });

  return AdminZone;
};