'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // 1. CRÉATION DE LA TABLE ZONES
    await queryInterface.createTable('Zones', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false,
        unique: true
      },
      code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      region: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        // Valeur par défaut simple, la mise à jour sera gérée par le Trigger PostgreSQL
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') 
      }
    });
    
    // 2. DÉFINITION DE LA FONCTION DE MISE À JOUR (PostgreSQL Trigger Function)
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Les guillemets sont nécessaires car Sequelize utilise le nom 'updatedAt' (camelCase)
        NEW."updatedAt" = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 3. DÉFINITION DU TRIGGER
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_zones_updated_at
      BEFORE UPDATE ON "Zones"
      FOR EACH ROW
      EXECUTE PROCEDURE set_updated_at_timestamp();
    `);

    // 4. Insertion des données
    await queryInterface.bulkInsert('Zones', [
      {
        name: 'Antananarivo ville',
        code: 'TANA',
        region: 'Analamanga',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Antsirabe',
        code: 'ATSR',
        region: 'Vakinankaratra',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Toamasina',
        code: 'TMM',
        region: 'Atsinanana',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Mahajanga',
        code: 'MJG',
        region: 'Boeny',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Fianarantsoa',
        code: 'FNA',
        region: 'Haute Matsiatra',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    // Nettoyage : Suppression du trigger lors du rollback
    await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS update_zones_updated_at ON "Zones";
    `);
    
    // Suppression de la table
    await queryInterface.dropTable('Zones');
    
    // Note : La fonction set_updated_at_timestamp peut être conservée pour d'autres tables
    // ou supprimée si elle est unique à cette table.
  }
};