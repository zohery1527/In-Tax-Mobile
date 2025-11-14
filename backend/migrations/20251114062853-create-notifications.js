'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    // 0. Création de la fonction trigger
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 1. Création de la table Notifications
    await queryInterface.createTable('Notifications', {
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
      type: {
        type: Sequelize.ENUM(
          'DEADLINE_REMINDER',
          'PAYMENT_PENDING',
          'NIF_STATUS',
          'PAYMENT_CONFIRMED',
          'DECLARATION_SUBMITTED',
          'SYSTEM_ALERT'
        ),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      actionUrl: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      expiresAt: {
        type: Sequelize.DATE,
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

    // 2. Trigger
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_notifications_updated_at
      BEFORE UPDATE ON "Notifications"
      FOR EACH ROW
      EXECUTE PROCEDURE set_updated_at_timestamp();
    `);

    // 3. Index
    await queryInterface.addIndex('Notifications', ['userId', 'isRead']);
    await queryInterface.addIndex('Notifications', ['userId', 'isActive']);
    await queryInterface.addIndex('Notifications', ['type']);
    await queryInterface.addIndex('Notifications', ['expiresAt']);
    await queryInterface.addIndex('Notifications', ['createdAt']);

    // 4. Données de test
    await queryInterface.bulkInsert('Notifications', [
      {
        id: '33333333-3333-3333-3333-333333333333',
        userId: '11111111-1111-1111-1111-111111111111',
        type: 'SYSTEM_ALERT',
        title: 'Bienvenue sur In-Tax',
        message: 'Votre compte administrateur a été créé avec succès.',
        isRead: false,
        isActive: true,
        actionUrl: '/users',
        metadata: { welcome: true },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        userId: '22222222-2222-2222-2222-222222222222',
        type: 'SYSTEM_ALERT',
        title: 'Bienvenue sur In-Tax',
        message: 'Votre compte administrateur a été créé avec succès.',
        isRead: false,
        isActive: true,
        actionUrl: '/users',
        metadata: { welcome: true },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS update_notifications_updated_at ON "Notifications";
    `);

    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS set_updated_at_timestamp();
    `);

    await queryInterface.dropTable('Notifications');
  }
};
