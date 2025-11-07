'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // 1. CRÉATION DE LA TABLE PAYMENTS
    await queryInterface.createTable('Payments', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
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
      nifNumber: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      provider: {
        type: Sequelize.ENUM('ORANGE_MONEY', 'MVOLA', 'AIRTEL_MONEY'),
        allowNull: false
      },
      transactionId: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'COMPLETED', 'FAILED'),
        allowNull: false
      },
      phoneNumber: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      metadata: {
        type: Sequelize.JSON,
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
        // 💡 CORRECTION : On retire la clause MySQL. Le trigger gérera la mise à jour.
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 2. DÉFINITION DE LA FONCTION DE MISE À JOUR (PostgreSQL Trigger Function)
    // C'est une vérification de sécurité. Si la fonction existe déjà (créée par Zones/Users/Declarations), elle sera juste remplacée, ce qui est sûr.
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 3. DÉFINITION DU TRIGGER pour la table PAYMENTS
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_payments_updated_at
      BEFORE UPDATE ON "Payments"
      FOR EACH ROW
      EXECUTE PROCEDURE set_updated_at_timestamp();
    `);

    // 4. Ajout des Index (inchangé)
    await queryInterface.addIndex('Payments', ['transactionId'], { unique: true });
    await queryInterface.addIndex('Payments', ['declarationId']);
    await queryInterface.addIndex('Payments', ['userId']);
    await queryInterface.addIndex('Payments', ['status']);
    await queryInterface.addIndex('Payments', ['nifNumber']);
  },

  async down (queryInterface, Sequelize) {
    // 💡 IMPORTANT : Supprimez le trigger lors d'un rollback
    await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS update_payments_updated_at ON "Payments";
    `);
    
    await queryInterface.dropTable('Payments');
  }
};