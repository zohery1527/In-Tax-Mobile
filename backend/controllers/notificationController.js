const NotificationService = require('../services/notificationService');

class NotificationController {
  
  // Récupérer les notifications de l'utilisateur
  async getUserNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { unreadOnly, limit } = req.query;

      console.log(`📨 Récupération notifications pour user: ${userId}`);

      const result = await NotificationService.getUserNotifications(userId, {
        unreadOnly: unreadOnly === 'true',
        limit: limit ? parseInt(limit) : 20
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('❌ Erreur récupération notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Tsy nahomby ny fandraisana ny fampahatsiahivana',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Marquer une notification comme lue
  async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;

      console.log(`📌 Marquage notification ${notificationId} comme lue`);

      const notification = await NotificationService.markAsRead(notificationId, userId);

      res.json({
        success: true,
        message: 'Voamarika ho vakina ny fampahatsiahivana',
        data: { notification }
      });

    } catch (error) {
      console.error('❌ Erreur marquage notification:', error);
      
      const status = error.message.includes('Tsy hita') ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }

  // Marquer toutes les notifications comme lues
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      console.log(`📌 Marquage toutes notifications comme lues`);

      const updatedCount = await NotificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: `Voamarika ho vakina ny fampahatsiahivana rehetra (${updatedCount})`,
        data: { updatedCount }
      });

    } catch (error) {
      console.error('❌ Erreur marquage toutes notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Tsy nahomby ny marika fampahatsiahivana'
      });
    }
  }

  // Générer les rappels (pour admin)
  async generateReminders(req, res) {
    try {
      console.log('🔄 Début génération rappels automatiques...');

      // Exécuter toutes les tâches
      const result = await require('../jobs/notificationJobs').runAllTasks();

      res.json({
        success: true,
        message: 'Nahomby ny famokarana fanamarihana',
        data: result
      });

    } catch (error) {
      console.error('❌ Erreur génération rappels:', error);
      res.status(500).json({
        success: false,
        message: 'Tsy nahomby ny famokarana fanamarihana',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Nettoyer les notifications expirées (admin)
  async cleanupExpired(req, res) {
    try {
      console.log('🧹 Nettoyage notifications expirées...');

      const cleanedCount = await NotificationService.cleanupExpiredNotifications();

      res.json({
        success: true,
        message: `Vita ny fanadiovana (${cleanedCount} fampahatsiahivana)`,
        data: { cleanedCount }
      });

    } catch (error) {
      console.error('❌ Erreur nettoyage notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Tsy nahomby ny fanadiovana'
      });
    }
  }
}

module.exports = new NotificationController();