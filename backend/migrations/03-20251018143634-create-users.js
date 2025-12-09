// migrations/XXXXXXXXXXXXXX-create-users.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      firstName: {
        type: Sequelize.STRING(60),
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING(60),
        allowNull: false
      },
      phoneNumber: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      role: {
        type: Sequelize.ENUM('VENDEUR', 'ADMIN', 'AGENT'),
        defaultValue: 'VENDEUR',
        allowNull: false
      },
      zoneId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Zones',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      nifNumber: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true
      },
      nifAttributionDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      nifStatus: {
        type: Sequelize.ENUM('PENDING', 'VALIDATED', 'REJECTED', 'SUSPENDED'),
        defaultValue: 'PENDING'
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
      rejectionReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      suspendedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      suspensionReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      lastActivityAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      otpHash: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      otpExpiresAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      activityType: {
        type: Sequelize.ENUM('ALIMENTATION', 'ARTISANAT', 'COMMERCE', 'SERVICE', 'AUTRE'),
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      fcmToken: {
        type: Sequelize.STRING(500),
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
    await queryInterface.addIndex('Users', ['phoneNumber'], { unique: true });
    await queryInterface.addIndex('Users', ['nifNumber'], { unique: true, where: { nifNumber: { [Sequelize.Op.ne]: null } } });
    await queryInterface.addIndex('Users', ['zoneId']);
    await queryInterface.addIndex('Users', ['nifStatus']);
    await queryInterface.addIndex('Users', ['activityType']);
    await queryInterface.addIndex('Users', ['isActive']);
    await queryInterface.addIndex('Users', ['role']);
    await queryInterface.addIndex('Users', ['validatedBy']);
    await queryInterface.addIndex('Users', ['lastActivityAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};