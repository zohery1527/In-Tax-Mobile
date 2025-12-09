// migrations/XXXXXXXXXXXXXX-create-system-configs.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SystemConfigs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      value: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      category: {
        type: Sequelize.ENUM('TAX', 'NOTIFICATION', 'PAYMENT', 'SYSTEM', 'SECURITY'),
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      updatedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Admins',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.addIndex('SystemConfigs', ['key'], { unique: true });
    await queryInterface.addIndex('SystemConfigs', ['category']);
    await queryInterface.addIndex('SystemConfigs', ['isActive']);
    await queryInterface.addIndex('SystemConfigs', ['updatedBy']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SystemConfigs');
  }
};