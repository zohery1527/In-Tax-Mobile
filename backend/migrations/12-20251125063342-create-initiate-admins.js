'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🚀 INITIALISATION DES ADMINISTRATEURS IN-TAX');
    console.log('============================================\n');

    // Fonction pour obtenir les permissions par défaut (converties en JSON)
    const getDefaultPermissions = (role) => {
      const permissions = {
        SUPER_ADMIN: [
          'dashboard:view',
          'user:view', 'user:update',
          'declaration:view', 'declaration:validate',
          'payment:view', 'payment:refund',
          'nif:validate',
          'report:export',
          'audit:view',
          'system:config',
          'zone:view'
        ],
        ADMIN_ZONE: [
          'dashboard:view',
          'user:view',
          'declaration:view', 'declaration:validate',
          'payment:view',
          'nif:validate',
          'report:export',
          'zone:view'
        ],
        AGENT_FINANCE: [
          'dashboard:view',
          'declaration:view', 'declaration:validate',
          'payment:view', 'payment:refund',
          'report:view'
        ],
        AGENT_SUPPORT: [
          'dashboard:view',
          'user:view', 'user:update',
          'declaration:view',
          'payment:view'
        ]
      };
      return JSON.stringify(permissions[role] || []); // ✅ CONVERTIR EN JSON
    };

    // 1. CRÉATION DES ADMINISTRATEURS
    const admins = [
      {
        id: uuidv4(),
        email: 'superadmin@intax.mg',
        username: 'superadmin',
        fullName: 'Super Administrateur IN-TAX',
        passwordHash: 'admin_temp_password', // Mot de passe temporaire
        role: 'SUPER_ADMIN',
        scope: 'GLOBAL',
        region: 'Analamanga',
        permissions: getDefaultPermissions('SUPER_ADMIN'), // ✅ DÉJÀ EN JSON
        department: 'Direction Générale',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        email: 'admin.tana@intax.mg',
        username: 'admin_tana',
        fullName: 'Admin Antananarivo',
        passwordHash: 'admin_temp_password',
        role: 'ADMIN_ZONE',
        scope: 'ZONAL',
        region: 'Analamanga',
        permissions: getDefaultPermissions('ADMIN_ZONE'),
        department: 'Antananarivo',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        email: 'admin.toamasina@intax.mg',
        username: 'admin_toamasina',
        fullName: 'Admin Toamasina',
        passwordHash: 'admin_temp_password',
        role: 'ADMIN_ZONE',
        scope: 'ZONAL',
        region: 'Atsinanana',
        permissions: getDefaultPermissions('ADMIN_ZONE'),
        department: 'Toamasina',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        email: 'admin.fianarantsoa@intax.mg',
        username: 'admin_fianar',
        fullName: 'Admin Fianarantsoa',
        passwordHash: 'admin_temp_password',
        role: 'ADMIN_ZONE',
        scope: 'ZONAL',
        region: 'Haute Matsiatra',
        permissions: getDefaultPermissions('ADMIN_ZONE'),
        department: 'Fianarantsoa',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        email: 'agent.finance@intax.mg',
        username: 'agent_finance',
        fullName: 'Agent Finance Central',
        passwordHash: 'admin_temp_password',
        role: 'AGENT_FINANCE',
        scope: 'GLOBAL',
        region: 'Analamanga',
        permissions: getDefaultPermissions('AGENT_FINANCE'),
        department: 'Service Financier',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insérer les administrateurs
    await queryInterface.bulkInsert('Admins', admins, {});
    console.log('✅ 5 administrateurs créés avec succès!');

    // 2. ASSOCIATIONS ADMIN-ZONES
    console.log('\n🔗 CRÉATION DES ASSOCIATIONS ADMIN-ZONES...');

    // Récupérer les IDs des zones
    const [zones] = await queryInterface.sequelize.query('SELECT id, code FROM "Zones"');
    
    // Créer un mapping des zones par code
    const zoneMap = {};
    zones.forEach(zone => {
      zoneMap[zone.code] = zone.id;
    });

    // Récupérer les IDs des admins
    const [adminRecords] = await queryInterface.sequelize.query('SELECT id, email FROM "Admins"');
    
    // Créer un mapping des admins par email
    const adminMap = {};
    adminRecords.forEach(admin => {
      adminMap[admin.email] = admin.id;
    });

    // Définir les associations
    const adminZones = [
      // Admin Tana -> Zone TANA
      {
        id: uuidv4(),
        adminId: adminMap['admin.tana@intax.mg'],
        zoneId: zoneMap['TANA'],
        isPrimary: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Admin Toamasina -> Zone TMM
      {
        id: uuidv4(),
        adminId: adminMap['admin.toamasina@intax.mg'],
        zoneId: zoneMap['TMM'],
        isPrimary: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Admin Fianarantsoa -> Zone FNA
      {
        id: uuidv4(),
        adminId: adminMap['admin.fianarantsoa@intax.mg'],
        zoneId: zoneMap['FNA'],
        isPrimary: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // SUPER_ADMIN a accès à toutes les zones
      {
        id: uuidv4(),
        adminId: adminMap['superadmin@intax.mg'],
        zoneId: zoneMap['TANA'],
        isPrimary: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        adminId: adminMap['superadmin@intax.mg'],
        zoneId: zoneMap['TMM'],
        isPrimary: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        adminId: adminMap['superadmin@intax.mg'],
        zoneId: zoneMap['FNA'],
        isPrimary: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        adminId: adminMap['superadmin@intax.mg'],
        zoneId: zoneMap['MJG'],
        isPrimary: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        adminId: adminMap['superadmin@intax.mg'],
        zoneId: zoneMap['ATSR'],
        isPrimary: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insérer les associations
    await queryInterface.bulkInsert('AdminZones', adminZones, {});
    console.log('✅ Associations admin-zones créées avec succès!');

    // 3. AFFICHER LES INFORMATIONS
    console.log('\n📋 COMPTES ADMINISTRATEURS CRÉÉS:');
    console.log('================================');
    
    const adminInfo = [
      { email: 'superadmin@intax.mg', password: 'admin_temp_password', role: 'SUPER_ADMIN', zone: 'Global' },
      { email: 'admin.tana@intax.mg', password: 'admin_temp_password', role: 'ADMIN_ZONE', zone: 'Antananarivo' },
      { email: 'admin.toamasina@intax.mg', password: 'admin_temp_password', role: 'ADMIN_ZONE', zone: 'Toamasina' },
      { email: 'admin.fianarantsoa@intax.mg', password: 'admin_temp_password', role: 'ADMIN_ZONE', zone: 'Fianarantsoa' },
      { email: 'agent.finance@intax.mg', password: 'admin_temp_password', role: 'AGENT_FINANCE', zone: 'Global' }
    ];

    adminInfo.forEach(admin => {
      console.log(`\n👤 ${admin.role}`);
      console.log(`   📧 ${admin.email}`);
      console.log(`   🔑 ${admin.password}`);
      console.log(`   🎯 ${admin.zone}`);
    });

    console.log('\n⚠️  IMPORTANT: Changez les mots de passe après la première connexion!');
    console.log('🎉 INITIALISATION TERMINÉE AVEC SUCCÈS!');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 SUPPRESSION DES DONNÉES DE TEST...');

    // 1. Supprimer les associations admin-zones
    await queryInterface.bulkDelete('AdminZones', {}, {});

    // 2. Supprimer les administrateurs de test
    await queryInterface.bulkDelete('Admins', {
      email: {
        [Sequelize.Op.in]: [
          'superadmin@intax.mg',
          'admin.tana@intax.mg',
          'admin.toamasina@intax.mg',
          'admin.fianarantsoa@intax.mg',
          'agent.finance@intax.mg'
        ]
      }
    }, {});

    console.log('✅ Données de test supprimées avec succès!');
  }
};