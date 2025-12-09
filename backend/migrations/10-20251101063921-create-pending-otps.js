// migrations/XXXXXXXXXXXXXX-create-pending-otps.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PendingOTPs', {
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
      phoneNumber: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      otpCode: {
        type: Sequelize.STRING(6),
        allowNull: false
      },
      otpHash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      purpose: {
        type: Sequelize.ENUM('LOGIN', 'REGISTRATION', 'PASSWORD_RESET', 'PHONE_VERIFICATION'),
        defaultValue: 'LOGIN'
      },
      attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      isUsed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
    await queryInterface.addIndex('PendingOTPs', ['userId']);
    await queryInterface.addIndex('PendingOTPs', ['phoneNumber']);
    await queryInterface.addIndex('PendingOTPs', ['expiresAt']);
    await queryInterface.addIndex('PendingOTPs', ['isUsed']);
    await queryInterface.addIndex('PendingOTPs', ['purpose']);
    await queryInterface.addIndex('PendingOTPs', ['otpHash']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PendingOTPs');
  }
};