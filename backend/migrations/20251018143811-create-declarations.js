'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 1. CRÉATION DE LA TABLE DECLARATIONS
    await queryInterface.createTable('Declarations', {
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
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      period: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      activityType: {
        type: Sequelize.ENUM('ALIMENTAION', 'ARTISANAT', 'COMMERCE', 'SERVICES', 'AUTRE'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'VALIDATED', 'PAID'),
        defaultValue: 'PENDING'
      },
      taxAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      nifNumber: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      description: {
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
        // 💡 CORRECTION : On retire la clause MySQL. Le trigger gérera la mise à jour.
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') 
      }
    });

    // 2. DÉFINITION DE LA FONCTION DE MISE À JOUR (PostgreSQL Trigger Function)
    // NOTE: Si vous avez déjà créé cette fonction dans la migration Users ou Zones, 
    // vous pouvez ignorer cette étape. Cependant, l'utiliser avec CREATE OR REPLACE est sûr.
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 3. DÉFINITION DU TRIGGER pour la table DECLARATIONS
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_declarations_updated_at
      BEFORE UPDATE ON "Declarations"
      FOR EACH ROW
      EXECUTE PROCEDURE set_updated_at_timestamp();
    `);

    // 4. Ajout des Index (inchangé)
    await queryInterface.addIndex('Declarations', ['userId', 'period'], { unique: true });
    await queryInterface.addIndex('Declarations', ['status']);
    await queryInterface.addIndex('Declarations', ['nifNumber']);
    await queryInterface.addIndex('Declarations', ['period']);
  },

  async down (queryInterface, Sequelize) {
    // 💡 IMPORTANT : Supprimez le trigger lors d'un rollback
    await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS update_declarations_updated_at ON "Declarations";
    `);
    
    await queryInterface.dropTable('Declarations');
  }
};