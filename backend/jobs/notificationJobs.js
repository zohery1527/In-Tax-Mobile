const NotificationService = require('../services/notificationService');

class NotificationJobs {
  
  // 1. Tâche: Rappels mensuels (20-25 du mois)
  static async runMonthlyReminders() {
    try {
      console.log('🔔 [CRON] Début rappels mensuels pour vendeurs...');
      const count = await NotificationService.sendMonthlyReminders();
      
      return {
        success: true,
        task: 'monthly_reminders',
        notificationsCount: count,
        timestamp: new Date().toISOString(),
        message: `Rappels mensuels envoyés: ${count} notifications`
      };
    } catch (error) {
      console.error('❌ [CRON] Erreur rappels mensuels:', error.message);
      return {
        success: false,
        task: 'monthly_reminders',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // 2. Tâche: Vérifier déclarations manquantes
  static async runCheckMissingDeclarations() {
    try {
      console.log('🔍 [CRON] Vérification déclarations manquantes...');
      const count = await NotificationService.notifyMissingDeclarations();
      
      return {
        success: true,
        task: 'check_missing_declarations',
        notificationsCount: count,
        timestamp: new Date().toISOString(),
        message: `Déclarations manquantes vérifiées: ${count} notifications`
      };
    } catch (error) {
      console.error('❌ [CRON] Erreur vérification manquantes:', error.message);
      return {
        success: false,
        task: 'check_missing_declarations',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // 3. Tâche: Notifier déclarations en retard
  static async runNotifyLateDeclarations() {
    try {
      console.log('⚠️ [CRON] Notification déclarations en retard...');
      const count = await NotificationService.notifyLateDeclarations();
      
      return {
        success: true,
        task: 'notify_late_declarations',
        notificationsCount: count,
        timestamp: new Date().toISOString(),
        message: `Déclarations en retard notifiées: ${count} notifications`
      };
    } catch (error) {
      console.error('❌ [CRON] Erreur notifications retard:', error.message);
      return {
        success: false,
        task: 'notify_late_declarations',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // 4. Tâche: Nettoyage notifications expirées
  static async runCleanupExpired() {
    try {
      console.log('🧹 [CRON] Nettoyage notifications expirées...');
      const cleanedCount = await NotificationService.cleanupExpiredNotifications();
      
      return {
        success: true,
        task: 'cleanup_expired_notifications',
        cleanedCount: cleanedCount,
        timestamp: new Date().toISOString(),
        message: `Notifications expirées nettoyées: ${cleanedCount}`
      };
    } catch (error) {
      console.error('❌ [CRON] Erreur nettoyage notifications:', error.message);
      return {
        success: false,
        task: 'cleanup_expired_notifications',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // 5. Tâche: Exécuter toutes les tâches (pour admin)
  static async runAllTasks() {
    try {
      console.log('🚀 [CRON] Exécution de toutes les tâches de notification...');
      
      const results = await Promise.allSettled([
        this.runCleanupExpired(),
        this.runMonthlyReminders(),
        this.runCheckMissingDeclarations(),
        this.runNotifyLateDeclarations()
      ]);
      
      const summary = {
        cleanup: results[0].status === 'fulfilled' ? results[0].value : results[0].reason,
        reminders: results[1].status === 'fulfilled' ? results[1].value : results[1].reason,
        missing: results[2].status === 'fulfilled' ? results[2].value : results[2].reason,
        late: results[3].status === 'fulfilled' ? results[3].value : results[3].reason,
        timestamp: new Date().toISOString()
      };
      
      console.log('📋 [CRON] Résumé des tâches:', summary);
      return summary;
      
    } catch (error) {
      console.error('❌ [CRON] Erreur exécution toutes tâches:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = NotificationJobs;