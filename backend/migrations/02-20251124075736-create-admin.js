// migrations/XXXXXXXXXXXXXX-create-admins.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Admins', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      username: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      fullName: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      passwordHash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('SUPER_ADMIN', 'ADMIN_REGIONAL', 'ADMIN_ZONE', 'AGENT_FINANCE', 'AGENT_SUPPORT'),
        defaultValue: 'AGENT_SUPPORT',
        allowNull: false
      },
      scope: {
        type: Sequelize.ENUM('GLOBAL', 'REGIONAL', 'ZONAL'),
        defaultValue: 'ZONAL',
        allowNull: false
      },
      region: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      permissions: {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: false
      },
      department: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      lastLogin: {
        type: Sequelize.DATE,
        allowNull: true
      },
      loginAttempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      lockedUntil: {
        type: Sequelize.DATE,
        allowNull: true
      },
      twoFactorSecret: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      twoFactorEnabled: {
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
    await queryInterface.addIndex('Admins', ['email'], { unique: true });
    await queryInterface.addIndex('Admins', ['username'], { unique: true });
    await queryInterface.addIndex('Admins', ['role']);
    await queryInterface.addIndex('Admins', ['scope']);
    await queryInterface.addIndex('Admins', ['isActive']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Admins');
  }
};