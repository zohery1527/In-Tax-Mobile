// migrations/XXXXXXXXXXXXXX-create-payments.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Payments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      declarationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Declarations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      paymentType: {
        type: Sequelize.ENUM('FULL', 'PARTIAL'),
        defaultValue: 'FULL'
      },
      remainingAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      provider: {
        type: Sequelize.ENUM('ORANGE_MONEY', 'MVOLA', 'AIRTEL_MONEY'),
        allowNull: false
      },
      nifNumber: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      transactionId: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'),
        defaultValue: 'PENDING'
      },
      phoneNumber: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      paidAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      processedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Admins',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      refundedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      refundedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Admins',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      refundReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      adminNotes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: false,
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
    await queryInterface.addIndex('Payments', ['transactionId'], { unique: true });
    await queryInterface.addIndex('Payments', ['declarationId']);
    await queryInterface.addIndex('Payments', ['nifNumber']);
    await queryInterface.addIndex('Payments', ['userId']);
    await queryInterface.addIndex('Payments', ['status']);
    await queryInterface.addIndex('Payments', ['provider']);
    await queryInterface.addIndex('Payments', ['processedBy']);
    await queryInterface.addIndex('Payments', ['refundedBy']);
    await queryInterface.addIndex('Payments', ['paidAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Payments');
  }
};