'use strict';

// Retrait du require inutile : const { type } = require("express/lib/response");

module.exports = {
  async up (queryInterface, Sequelize) {
    // 1. CRÉATION DE LA TABLE USERS
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      phoneNumber: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      firstName: {
        type: Sequelize.STRING(60),
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING(60),
        allowNull: false
      },
      nifNumber: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true
      },
      nifStatus: {
        type: Sequelize.ENUM('PENDING', 'VALIDATED', 'REJECTED'),
        defaultValue: 'PENDING'
      },
      otpHash: {
        type: Sequelize.STRING,
        allowNull: true
      },
      otpExpirestAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      nifAttributionDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      activityType: {
        type: Sequelize.ENUM('ALIMENTATION', 'ARTISANAT', 'COMMERCE', 'SERVICE', 'AUTRE'),
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
      role: {
        type: Sequelize.ENUM('VENDEUR', 'ADMIN', 'AGENT'),
        defaultValue: 'VENDEUR'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      fcmToken: {
        type: Sequelize.STRING,
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
    // NOTE: Il est préférable de créer cette fonction une seule fois pour tout le schéma,
    // mais la recréer ici est sûr si elle n'existe pas encore.
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 3. DÉFINITION DU TRIGGER pour la table USERS
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON "Users"
      FOR EACH ROW
      EXECUTE PROCEDURE set_updated_at_timestamp();
    `);




    await queryInterface.bulkInsert('Users', [
      {
        id: '11111111-1111-1111-1111-111111111111',
        phoneNumber: '+261386573293',
        firstName: 'RAKOTOMAONJY',
        lastName: 'Marline',
        nifNumber: 'NIFADMIN1',
        nifStatus: 'VALIDATED',
        otpHash: null,
        otpExpirestAt: null,
        nifAttributionDate: new Date(),
        activityType: 'SERVICE',
        zoneId: 1, // ⚠️ adapte cette valeur selon ta table Zones !
        role: 'ADMIN',
        isActive: true,
        fcmToken: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        phoneNumber: '+261340000002',
        firstName: 'RAKOTOMAMONJY',
        lastName: 'HERIZO',
        nifNumber: 'NIFADMIN2',
        nifStatus: 'VALIDATED',
        otpHash: null,
        otpExpirestAt: null,
        nifAttributionDate: new Date(),
        activityType: 'COMMERCE',
        zoneId: 1,
        role: 'ADMIN',
        isActive: true,
        fcmToken: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    // 4. Les index sont commentés, mais peuvent être ajoutés ici si vous le souhaitez:
    // await queryInterface.addIndex('Users',['phoneNumber'],{unique:true});
    // await queryInterface.addIndex('Users',['zoneId']);
    // await queryInterface.addIndex('Users',['nifNumber'],{unique:true});
    // await queryInterface.addIndex('Users',['nifStatus'])
  },

  async down (queryInterface, Sequelize) {
    // 💡 IMPORTANT : Supprimez le trigger lors d'un rollback
    await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS update_users_updated_at ON "Users";
    `);
    
    await queryInterface.dropTable('Users');
  }
};