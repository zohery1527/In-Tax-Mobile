// migrations/XXXXXXXXXXXXXX-create-admin-zones.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AdminZones', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      adminId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Admins',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      zoneId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Zones',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      isPrimary: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Indexes
    await queryInterface.addIndex('AdminZones', ['adminId', 'zoneId'], { unique: true });
    await queryInterface.addIndex('AdminZones', ['adminId']);
    await queryInterface.addIndex('AdminZones', ['zoneId']);
    await queryInterface.addIndex('AdminZones', ['isPrimary']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('AdminZones');
  }
};