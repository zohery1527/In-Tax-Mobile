const db = require('../models');
// Utiliser destructuring pour un accès facile
const { Notification, User, Declaration } = db;
const { Op } = db.Sequelize;

class NotificationService {
  
  // Créer une notification
  static async createNotification(userId, notificationData) {
    try {
      const notification = await Notification.create({
        userId,
        ...notificationData
      });
      
      return notification;
    } catch (error) {
      console.error('Erreur création notification:', error);
      throw error;
    }
  }

  // Générer les rappels automatiques
  static async generateAutomaticReminders() {
    try {
      const today = new Date();
      const currentDay = today.getDate();
      // 💡 CORRECTION: Utiliser l'index du mois (0-11)
      const currentMonthIndex = today.getMonth(); 
      const currentMonth = currentMonthIndex + 1; // Mois réel (1-12)
      const currentYear = today.getFullYear();

      // Trouver tous les utilisateurs actifs avec leurs déclarations en attente
      const users = await User.findAll({
        where: { isActive: true },
        include: [{
          model: Declaration,
          as: 'declarations',
          where: {
            status: 'PENDING'
          },
          required: false
        }]
      });

      for (const user of users) {
        const pendingDeclarations = user.declarations || [];

        // 1. Rappel échéance (à partir du 20 du mois)
        if (currentDay >= 20 && currentDay <= 25) {
          const daysLeft = 25 - currentDay;
          await this.createNotification(user.id, {
            type: 'DEADLINE_REMINDER',
            title: 'Famaranana akaiky',
            message: `Mbola misy ${daysLeft} andro sisa ny famaranana volana ${currentMonth}/${currentYear}`,
            actionUrl: '/declarations',
            metadata: { daysLeft, month: currentMonth, year: currentYear },
            // 💡 Correction de l'index: expire le 25 du mois courant
            expiresAt: new Date(currentYear, currentMonthIndex, 25) 
          });
        }

        // 2. Rappel déclarations en attente de paiement
        if (pendingDeclarations.length > 0) {
          await this.createNotification(user.id, {
            type: 'PAYMENT_PENDING',
            title: 'Famaranana tsy voalohany',
            message: `Misy ${pendingDeclarations.length} famaranana mbola tsy voalohany`,
            actionUrl: '/declarations',
            metadata: { pendingCount: pendingDeclarations.length },
            // Utiliser currentMonthIndex + 1 pour expirer au début du mois suivant
            expiresAt: new Date(currentYear, currentMonthIndex + 1, 1) 
          });
        }

        // 3. Rappel NIF en attente (valable 30 jours)
        // 💡 AJOUT: S'assurer que la date d'attribution du NIF est disponible
        if (user.nifStatus === 'PENDING' && user.nifAttributionDate) { 
          const nifCreationDate = new Date(user.nifAttributionDate);
          
            // Sauter si la date n'est pas valide (ne devrait pas arriver si le champ est bien rempli)
          if (isNaN(nifCreationDate.getTime())) continue; 

          const daysSinceCreation = Math.floor((today - nifCreationDate) / (1000 * 60 * 60 * 24));
          
          if (daysSinceCreation >= 3) { // Rappel après 3 jours
            await this.createNotification(user.id, {
              type: 'NIF_STATUS',
              title: 'NIF mbola miandry',
              message: 'Miantso ny administrasiona hanamafisana ny NIF',
              actionUrl: '/profile',
              metadata: { daysSinceCreation },
              expiresAt: new Date(nifCreationDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 jours après attribution
            });
          }
        }
      }

      console.log(`Rappels automatiques générés pour ${users.length} utilisateurs`);
    } catch (error) {
      console.error('Erreur génération rappels automatiques:', error);
    }
  }

  // Récupérer les notifications d'un utilisateur
  static async getUserNotifications(userId, options = {}) {
    try {
      const whereClause = { 
        userId, 
        isActive: true 
      };

      if (options.unreadOnly) {
        whereClause.isRead = false;
      }

      const notifications = await Notification.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: options.limit || 50
      });

      return notifications;
    } catch (error) {
      console.error('Erreur récupération notifications:', error);
      throw error;
    }
  }

  // Marquer une notification comme lue
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        where: { id: notificationId, userId }
      });

      if (!notification) {
        throw new Error('Notification non trouvée');
      }

      await notification.update({ isRead: true });
      return notification;
    } catch (error) {
      console.error('Erreur marquage notification comme lue:', error);
      throw error;
    }
  }

  // Marquer toutes les notifications comme lues
  static async markAllAsRead(userId) {
    try {
      await Notification.update(
        { isRead: true },
        { where: { userId, isRead: false } }
      );
    } catch (error) {
      console.error('Erreur marquage toutes notifications comme lues:', error);
      throw error;
    }
  }

  // Supprimer les notifications expirées
  static async cleanupExpiredNotifications() {
    try {
      const result = await Notification.update(
        { isActive: false },
        { 
          where: { 
            expiresAt: { 
              [Op.lt]: new Date() // Utilisation de Op.lt (less than)
            },
            isActive: true 
          } 
        }
      );
      
      console.log(`Notifications expirées nettoyées: ${result[0]} enregistrements`);
    } catch (error) {
      console.error('Erreur nettoyage notifications expirées:', error);
    }
  }
}

module.exports = NotificationService;