'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔐 CORRECTION DES MOTS DE PASSE ADMIN');
    console.log('====================================\n');

    // Générer les hashs bcrypt
    const passwordHashes = {
      'superadmin@intax.mg': await bcrypt.hash('Admin123!', 12),
      'admin.tana@intax.mg': await bcrypt.hash('TanaAdmin123!', 12),
      'admin.toamasina@intax.mg': await bcrypt.hash('ToamasinaAdmin123!', 12),
      'admin.fianarantsoa@intax.mg': await bcrypt.hash('FianarAdmin123!', 12),
      'agent.finance@intax.mg': await bcrypt.hash('Finance123!', 12)
    };

    // Mettre à jour chaque admin
    for (const [email, hash] of Object.entries(passwordHashes)) {
      await queryInterface.sequelize.query(
        `UPDATE "Admins" SET "passwordHash" = :hash WHERE email = :email`,
        {
          replacements: { hash, email },
          type: Sequelize.QueryTypes.UPDATE
        }
      );
      console.log(`✅ Mot de passe corrigé pour: ${email}`);
    }

    console.log('\n🎉 Tous les mots de passe ont été corrigés!');
  },

  async down(queryInterface, Sequelize) {
    // Remettre les mots de passe temporaires
    const tempPassword = 'admin_temp_password';
    
    await queryInterface.sequelize.query(
      `UPDATE "Admins" SET "passwordHash" = :password WHERE email IN (:emails)`,
      {
        replacements: { 
          password: tempPassword,
          emails: [
            'superadmin@intax.mg',
            'admin.tana@intax.mg', 
            'admin.toamasina@intax.mg',
            'admin.fianarantsoa@intax.mg',
            'agent.finance@intax.mg'
          ]
        },
        type: Sequelize.QueryTypes.UPDATE
      }
    );

    console.log('🔄 Mots de passe remis à temporaire');
  }
};