'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TransactionLogs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      transactionId: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      provider: {
        type: Sequelize.ENUM('ORANGE_MONEY', 'MVOLA', 'AIRTEL_MONEY'),
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
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      phoneNumber: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'COMPLETED', 'FAILED', 'EXPIRED'),
        defaultValue: 'PENDING'
      },
      mode: {
        type: Sequelize.ENUM('REAL', 'SIMULATION', 'SANDBOX'),
        defaultValue: 'SIMULATION'
      },
      metadata: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Création des index
    await queryInterface.addIndex('TransactionLogs', ['transactionId'], {
      unique: true,
      name: 'transaction_logs_transaction_id_unique'
    });

    await queryInterface.addIndex('TransactionLogs', ['userId'], {
      name: 'transaction_logs_user_id_index'
    });

    await queryInterface.addIndex('TransactionLogs', ['declarationId'], {
      name: 'transaction_logs_declaration_id_index'
    });

    await queryInterface.addIndex('TransactionLogs', ['status'], {
      name: 'transaction_logs_status_index'
    });

    await queryInterface.addIndex('TransactionLogs', ['provider'], {
      name: 'transaction_logs_provider_index'
    });

    await queryInterface.addIndex('TransactionLogs', ['createdAt'], {
      name: 'transaction_logs_created_at_index'
    });

    // Index composite pour les recherches fréquentes
    await queryInterface.addIndex('TransactionLogs', ['userId', 'status'], {
      name: 'transaction_logs_user_status_index'
    });

    await queryInterface.addIndex('TransactionLogs', ['provider', 'status'], {
      name: 'transaction_logs_provider_status_index'
    });
  },

  async down(queryInterface, Sequelize) {
    // Supprimer les index d'abord
    await queryInterface.removeIndex('TransactionLogs', 'transaction_logs_user_status_index');
    await queryInterface.removeIndex('TransactionLogs', 'transaction_logs_provider_status_index');
    await queryInterface.removeIndex('TransactionLogs', 'transaction_logs_created_at_index');
    await queryInterface.removeIndex('TransactionLogs', 'transaction_logs_provider_index');
    await queryInterface.removeIndex('TransactionLogs', 'transaction_logs_status_index');
    await queryInterface.removeIndex('TransactionLogs', 'transaction_logs_declaration_id_index');
    await queryInterface.removeIndex('TransactionLogs', 'transaction_logs_user_id_index');
    await queryInterface.removeIndex('TransactionLogs', 'transaction_logs_transaction_id_unique');
    
    // Supprimer la table
    await queryInterface.dropTable('TransactionLogs');
    
    // Supprimer le type ENUM
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_TransactionLogs_provider";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_TransactionLogs_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_TransactionLogs_mode";');
  }
};