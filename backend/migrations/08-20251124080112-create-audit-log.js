// migrations/XXXXXXXXXXXXXX-create-audit-logs.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AuditLogs', {
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
      action: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      resource: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      resourceId: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      details: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('SUCCESS', 'FAILED'),
        defaultValue: 'SUCCESS'
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true
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
    await queryInterface.addIndex('AuditLogs', ['adminId']);
    await queryInterface.addIndex('AuditLogs', ['action']);
    await queryInterface.addIndex('AuditLogs', ['resource']);
    await queryInterface.addIndex('AuditLogs', ['createdAt']);
    await queryInterface.addIndex('AuditLogs', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('AuditLogs');
  }
};