'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // 1. CRÉATION DE LA TABLE NIFHistories
    await queryInterface.createTable('NIFHistories', {
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
      nifNumber: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      action: {
        type: Sequelize.ENUM('CREATED', 'VALIDATED', 'REJECTED', 'UPDATED', 'SUSPENDED'),
        allowNull: false
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      performedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: null
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        // 💡 CORRECTION : On retire la clause MySQL. Le trigger gérera la mise à jour.
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 2. DÉFINITION DE LA FONCTION DE MISE À JOUR (PostgreSQL Trigger Function)
    // Elle sera réutilisée ici. L'utilisation de CREATE OR REPLACE est sûre.
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 3. DÉFINITION DU TRIGGER pour la table NIFHistories
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_nifhistories_updated_at
      BEFORE UPDATE ON "NIFHistories"
      FOR EACH ROW
      EXECUTE PROCEDURE set_updated_at_timestamp();
    `);

    // 4. Ajout des Index (inchangé)
    await queryInterface.addIndex('NIFHistories', ['userId']);
    await queryInterface.addIndex('NIFHistories', ['nifNumber']);
    await queryInterface.addIndex('NIFHistories', ['action']);
  },

  async down (queryInterface, Sequelize) {
    // 💡 IMPORTANT : Supprimez le trigger lors d'un rollback
    await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS update_nifhistories_updated_at ON "NIFHistories";
    `);
    
    await queryInterface.dropTable('NIFHistories');
  }
};