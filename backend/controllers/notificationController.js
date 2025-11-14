const NotificationService = require('../services/notificationService');

class NotificationController {
  
  // Récupérer les notifications de l'utilisateur
  async getUserNotifications(req, res) {
    try {
      const userId = req.user.id;
      // S'assurer que limit est bien un nombre ou null
      const { unreadOnly, limit } = req.query;

      const notifications = await NotificationService.getUserNotifications(userId, {
        unreadOnly: unreadOnly === 'true',
        limit: limit ? parseInt(limit) : 50
      });

      res.json({
        success: true,
        data: {
          notifications,
          // Calcul direct du nombre non lu pour la réponse
          unreadCount: notifications.filter(n => !n.isRead).length 
        }
      });

    } catch (error) {
      console.error('Erreur récupération notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des notifications'
      });
    }
  }

  // Marquer une notification comme lue
  async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;

      const notification = await NotificationService.markAsRead(notificationId, userId);

      res.json({
        success: true,
        message: 'Notification marquée comme lue',
        data: { notification }
      });

    } catch (error) {
      console.error('Erreur marquage notification:', error);
      // Le 400 est maintenu si le service lève une erreur de "non trouvé"
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Marquer toutes les notifications comme lues
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      await NotificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: 'Toutes les notifications marquées comme lues'
      });

    } catch (error) {
      console.error('Erreur marquage toutes notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du marquage des notifications'
      });
    }
  }

  // Générer les rappels (pour admin ou cron job)
  async generateReminders(req, res) {
    try {
      await NotificationService.generateAutomaticReminders();

      res.json({
        success: true,
        message: 'Rappels automatiques générés avec succès'
      });

    } catch (error) {
      console.error('Erreur génération rappels:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération des rappels'
      });
    }
  }
}

module.exports = new NotificationController();