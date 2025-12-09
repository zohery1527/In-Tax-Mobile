// migrations/XXXXXXXXXXXXXX-create-nif-histories.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('NIFHistories', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      nifNumber: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      action: {
        type: Sequelize.ENUM('CREATED', 'UPDATED', 'SUSPENDED', 'REJECTED', 'VALIDATED'),
        allowNull: false
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      performedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Admins',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      performedType: {
        type: Sequelize.ENUM('USER', 'ADMIN', 'SYSTEM'),
        defaultValue: 'USER'
      },
      oldValue: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      newValue: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
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
    await queryInterface.addIndex('NIFHistories', ['userId']);
    await queryInterface.addIndex('NIFHistories', ['nifNumber']);
    await queryInterface.addIndex('NIFHistories', ['action']);
    await queryInterface.addIndex('NIFHistories', ['performedBy']);
    await queryInterface.addIndex('NIFHistories', ['performedType']);
    await queryInterface.addIndex('NIFHistories', ['createdAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('NIFHistories');
  }
};