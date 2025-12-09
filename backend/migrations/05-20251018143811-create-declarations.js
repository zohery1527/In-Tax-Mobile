// migrations/XXXXXXXXXXXXXX-create-declarations.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Declarations', {
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
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      nifNumber: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      period: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      activityType: {
        type: Sequelize.ENUM('ALIMENTATION', 'ARTISANAT', 'COMMERCE', 'SERVICES', 'AUTRE'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'VALIDATED', 'REJECTED', 'PARTIALLY_PAID', 'PAID'),
        defaultValue: 'PENDING'
      },
      taxAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      paidAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      remainingAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      validatedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      validatedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Admins',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      rejectedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      rejectedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Admins',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      rejectionReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      internalNotes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      priority: {
        type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH'),
        defaultValue: 'LOW'
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
    await queryInterface.addIndex('Declarations', ['userId', 'period'], { unique: true });
    await queryInterface.addIndex('Declarations', ['status']);
    await queryInterface.addIndex('Declarations', ['nifNumber']);
    await queryInterface.addIndex('Declarations', ['period']);
    await queryInterface.addIndex('Declarations', ['validatedBy']);
    await queryInterface.addIndex('Declarations', ['rejectedBy']);
    await queryInterface.addIndex('Declarations', ['priority']);
    await queryInterface.addIndex('Declarations', ['createdAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Declarations');
  }
};