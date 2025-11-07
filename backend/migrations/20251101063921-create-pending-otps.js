'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. CRÉATION DE LA TABLE PendingOTPs
    await queryInterface.createTable('PendingOTPs', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
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
      code: {
        type: Sequelize.STRING(6),
        allowNull: false
      },
      purpose: {
        type: Sequelize.ENUM('LOGIN', 'VERIFICATION', 'TRANSACTION'),
        defaultValue: 'LOGIN'
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      used: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        // Uniformisation : Ajout de la valeur par défaut simple
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') 
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        // Uniformisation : Ajout de la valeur par défaut simple
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') 
      }
    });

    // 2. DÉFINITION DU TRIGGER pour la table PendingOTPs
    // Si la fonction set_updated_at_timestamp() existe déjà, cela fonctionne.
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_pendingotps_updated_at
      BEFORE UPDATE ON "PendingOTPs"
      FOR EACH ROW
      EXECUTE PROCEDURE set_updated_at_timestamp();
    `);

    // 3. Ajout des Indexes (inchangé)
    await queryInterface.addIndex('PendingOTPs', ['phoneNumber', 'code'], {
      name: 'pending_otps_phone_code'
    });

    await queryInterface.addIndex('PendingOTPs', ['expiresAt'], {
      name: 'pending_otps_expires'
    });

    await queryInterface.addIndex('PendingOTPs', ['userId'], {
      name: 'pending_otps_user'
    });

    await queryInterface.addIndex('PendingOTPs', ['used'], {
      name: 'pending_otps_used'
    });

    await queryInterface.addIndex('PendingOTPs', ['purpose'], {
      name: 'pending_otps_purpose'
    });

    await queryInterface.addIndex('PendingOTPs', ['phoneNumber', 'used', 'expiresAt'], {
      name: 'pending_otps_verification'
    });
  },

  async down(queryInterface, Sequelize) {
    // Suppression du trigger lors du rollback
    await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS update_pendingotps_updated_at ON "PendingOTPs";
    `);

    await queryInterface.dropTable('PendingOTPs');
  }
};