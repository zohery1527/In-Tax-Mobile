const db = require('../models');
const { Notification, User, Declaration } = db;
const { Op } = require('sequelize');

class NotificationService {
  
  // === FONCTIONS DE BASE ===
  
  static async createNotification(userId, notificationData) {
    try {
      const notification = await Notification.create({
        userId,
        ...notificationData,
        isRead: false,
        isActive: true,
        createdAt: new Date()
      });
      
      console.log(`✅ Notification créée: ${notification.title} pour user ${userId}`);
      return notification;
    } catch (error) {
      console.error('❌ Erreur création notification:', error);
      throw error;
    }
  }

  static async getUserNotifications(userId, options = {}) {
    try {
      const whereClause = { 
        userId, 
        isActive: true 
      };

      if (options.unreadOnly === true) {
        whereClause.isRead = false;
      }

      const notifications = await Notification.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: options.limit || 20
      });

      const unreadCount = await Notification.count({
        where: {
          userId,
          isRead: false,
          isActive: true
        }
      });

      return { notifications, unreadCount };
      
    } catch (error) {
      console.error('❌ Erreur récupération notifications:', error);
      throw error;
    }
  }

  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        where: { 
          id: notificationId, 
          userId,
          isActive: true 
        }
      });

      if (!notification) {
        throw new Error('Tsy hita ny fampahatsiahivana');
      }

      await notification.update({ 
        isRead: true,
        readAt: new Date()
      });
      
      return notification;
      
    } catch (error) {
      console.error('❌ Erreur marquage notification:', error);
      throw error;
    }
  }

  static async markAllAsRead(userId) {
    try {
      const result = await Notification.update(
        { 
          isRead: true,
          readAt: new Date()
        },
        { 
          where: { 
            userId, 
            isRead: false,
            isActive: true 
          } 
        }
      );
      
      console.log(`✅ ${result[0]} fampahatsiahivana voamarika ho vakina`);
      return result[0];
      
    } catch (error) {
      console.error('❌ Erreur marquage toutes notifications:', error);
      throw error;
    }
  }

  static async cleanupExpiredNotifications() {
    try {
      const result = await Notification.update(
        { isActive: false },
        { 
          where: { 
            expiresAt: { 
              [Op.lt]: new Date()
            },
            isActive: true 
          } 
        }
      );
      
      console.log(`🧹 Notifications expirées nettoyées: ${result[0]} enregistrements`);
      return result[0];
      
    } catch (error) {
      console.error('❌ Erreur nettoyage notifications expirées:', error);
      throw error;
    }
  }

  // === NOTIFICATIONS POUR VENDEURS ===
  
  // 1. Notification bienvenue (nouveau vendeur)
  static async sendWelcomeNotification(userId) {
    const user = await User.findByPk(userId);
    
    if (!user) return;
    
    return this.createNotification(userId, {
      type: 'WELCOME',
      title: 'Tonga soa! 👋',
      message: `Tonga soa eo amin'ny In-Tax ${user.firstName}! Azonao atao izao ny manao famaranana sy manoro vola amin'ny finday.`,
      actionUrl: '/guide',
      metadata: JSON.stringify({ type: 'welcome' }),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    });
  }

  // 2. Notification NIF validé
  static async notifyNIFValidated(userId) {
    const user = await User.findByPk(userId);
    
    if (!user) return;
    
    return this.createNotification(userId, {
      type: 'NIF_VALIDATED',
      title: 'NIF voamarina! 🎊',
      message: `NIF misy anao izao! Azonao atao ny manao famaranana sy manoro vola amin'ny finday.`,
      actionUrl: '/declarations/new',
      metadata: JSON.stringify({ type: 'nif_validated' }),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    });
  }

  // 3. Notification déclaration créée
  static async notifyDeclarationCreated(userId, declarationId, amount, period) {
    const monthNames = {
      '01': 'Janoary', '02': 'Febroary', '03': 'Martsa', '04': 'Aprily',
      '05': 'Mey', '06': 'Jona', '07': 'Jolay', '08': 'Aogositra',
      '09': 'Septambra', '10': 'Oktobra', '11': 'Novambra', '12': 'Desambra'
    };
    
    const month = monthNames[period.split('-')[1]] || period;
    
    return this.createNotification(userId, {
      type: 'NEW_DECLARATION',
      title: 'Famaranana vaovao',
      message: `Nanao famaranana ${amount.toLocaleString('mg-MG')} Ar ho an'ny ${month} ianao. Mandehana anjara izao!`,
      actionUrl: `/declarations/${declarationId}`,
      metadata: JSON.stringify({ type: 'declaration_created', amount, period }),
      expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
    });
  }

  // 4. Notification paiement réussi
  static async notifyPaymentSuccess(userId, declarationId, amount, period) {
    const monthNames = {
      '01': 'Janoary', '02': 'Febroary', '03': 'Martsa', '04': 'Aprily',
      '05': 'Mey', '06': 'Jona', '07': 'Jolay', '08': 'Aogositra',
      '09': 'Septambra', '10': 'Oktobra', '11': 'Novambra', '12': 'Desambra'
    };
    
    const month = monthNames[period.split('-')[1]] || period;
    
    return this.createNotification(userId, {
      type: 'PAYMENT_SUCCESS',
      title: 'Fandoavana nahomby! 🎉',
      message: `Misaotra! Voaloa ny ${amount.toLocaleString('mg-MG')} Ar ho an'ny ${month}. Efa tapitra ny asa!`,
      actionUrl: `/declarations/${declarationId}`,
      metadata: JSON.stringify({ type: 'payment_success', amount, period }),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
  }

  // 5. Rappels mensuels (20-25 du mois)
  static async sendMonthlyReminders() {
    try {
      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      
      // Vérifier si on est entre le 20 et 25
      if (currentDay < 20 || currentDay > 25) {
        console.log(`📅 Pas dans la période de rappel (${currentDay}/${currentMonth})`);
        return 0;
      }
      
      const monthNames = {
        1: 'Janoary', 2: 'Febroary', 3: 'Martsa', 4: 'Aprily',
        5: 'Mey', 6: 'Jona', 7: 'Jolay', 8: 'Aogositra',
        9: 'Septambra', 10: 'Oktobra', 11: 'Novambra', 12: 'Desambra'
      };
      
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextMonthName = monthNames[nextMonth];
      const daysLeft = 25 - currentDay;
      
      console.log(`🔔 Rappel mensuel: ${daysLeft} jours restants pour ${nextMonthName}`);
      
      // Trouver tous les vendeurs actifs
      const users = await User.findAll({
        where: { 
          isActive: true,
          role: 'VENDEUR'
        }
      });
      
      let notificationsCreated = 0;
      
      for (const user of users) {
        const message = `Mbola misy ${daysLeft} andro hialana amin'ny ${nextMonthName}. Ataovy izao ny fandoavana!`;
        
        await this.createNotification(user.id, {
          type: 'MONTHLY_REMINDER',
          title: 'Fanamarihana fandoavana',
          message: message,
          actionUrl: '/declarations',
          metadata: JSON.stringify({ 
            type: 'monthly_reminder', 
            nextMonth: nextMonthName, 
            daysLeft 
          }),
          expiresAt: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)
        });
        
        notificationsCreated++;
      }
      
      console.log(`✅ ${notificationsCreated} rappels mensuels envoyés`);
      return notificationsCreated;
      
    } catch (error) {
      console.error('❌ Erreur rappel mensuel:', error);
      throw error;
    }
  }

  // 6. Vérifier déclarations manquantes
  static async notifyMissingDeclarations() {
    try {
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      
      // Vérifier le mois précédent
      const targetMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const targetYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const targetPeriod = `${targetYear}-${targetMonth.toString().padStart(2, '0')}`;
      
      const monthNames = {
        1: 'Janoary', 2: 'Febroary', 3: 'Martsa', 4: 'Aprily',
        5: 'Mey', 6: 'Jona', 7: 'Jolay', 8: 'Aogositra',
        9: 'Septambra', 10: 'Oktobra', 11: 'Novambra', 12: 'Desambra'
      };
      
      const targetMonthName = monthNames[targetMonth];
      
      console.log(`🔍 Vérification déclarations manquantes: ${targetMonthName} ${targetYear}`);
      
      // Trouver vendeurs sans déclaration pour ce mois
      const users = await User.findAll({
        where: { 
          isActive: true,
          role: 'VENDEUR',
          nifStatus: 'VALIDATED'
        },
        include: [{
          model: Declaration,
          as: 'declarations',
          where: { period: targetPeriod },
          required: false
        }]
      });
      
      let notificationsCreated = 0;
      
      for (const user of users) {
        if (!user.declarations || user.declarations.length === 0) {
          await this.createNotification(user.id, {
            type: 'MISSING_DECLARATION',
            title: 'Tsy nanao famaranana',
            message: `Tsy nanao famaranana ho an'ny ${targetMonthName} ianao. Ataovy izao mba hisorohana ny sazy.`,
            actionUrl: '/declarations/new',
            metadata: JSON.stringify({ 
              type: 'missing_declaration', 
              period: targetPeriod 
            }),
            expiresAt: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000)
          });
          
          notificationsCreated++;
        }
      }
      
      console.log(`✅ ${notificationsCreated} notifications déclarations manquantes`);
      return notificationsCreated;
      
    } catch (error) {
      console.error('❌ Erreur notifications manquantes:', error);
      throw error;
    }
  }

  // 7. Notifier déclarations en retard
  static async notifyLateDeclarations() {
    try {
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      
      console.log(`🔍 Recherche déclarations en retard...`);
      
      // Déclarations validées mais non payées (plus de 1 mois)
      const lateDeclarations = await Declaration.findAll({
        where: {
          status: 'VALIDATED',
          paidAmount: { [Op.lt]: db.sequelize.col('amount') },
          period: {
            [Op.lt]: `${currentYear}-${currentMonth.toString().padStart(2, '0')}`
          }
        },
        include: [{ model: User, where: { role: 'VENDEUR' } }]
      });
      
      let notificationsCreated = 0;
      
      for (const declaration of lateDeclarations) {
        const monthsLate = this.calculateMonthsLate(declaration.period, currentYear, currentMonth);
        const remaining = declaration.amount - declaration.paidAmount;
        
        const message = `${monthsLate} volana tafa mihoatra ny ${declaration.period}. Misy ${remaining.toLocaleString()} Ar mbola tsy voaloa.`;
        
        await this.createNotification(declaration.userId, {
          type: 'OVERDUE_DECLARATION',
          title: 'Famaranana tafa mihoatra',
          message: message,
          actionUrl: `/declarations/${declaration.id}`,
          metadata: JSON.stringify({ 
            type: 'overdue_declaration', 
            period: declaration.period, 
            monthsLate, 
            remaining 
          }),
          expiresAt: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
        });
        
        notificationsCreated++;
      }
      
      console.log(`✅ ${notificationsCreated} notifications retard envoyées`);
      return notificationsCreated;
      
    } catch (error) {
      console.error('❌ Erreur notifications retard:', error);
      throw error;
    }
  }

  // Helper: calculer mois de retard
  static calculateMonthsLate(period, currentYear, currentMonth) {
    const [year, month] = period.split('-').map(Number);
    return Math.max(0, (currentYear - year) * 12 + (currentMonth - month));
  }
}

module.exports = NotificationService;