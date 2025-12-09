const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');
require('dotenv').config();

// Routes
const Routeauth = require('./routes/auth');

// Services et Jobs
const { sequelize } = require('./models');
const NotificationJobs = require('./jobs/notificationJobs');

const app = express();

// ✅ Middleware de sécurité et parsing
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Routes de l'API
app.use('/api/auth', Routeauth);
app.use('/api/declarations', require('./routes/declarations'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/system', require('./routes/system'));
app.use('/api/sms', require('./routes/sms'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin',require('./routes/admin'));
// ✅ Route de santé améliorée
app.get('/health', async (req, res) => {
  const healthCheck = {
    success: true,
    message: 'API In-Tax opérationnelle',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0'
  };

  try {
    await sequelize.authenticate();
    healthCheck.database = 'connected';
    healthCheck.cron = {
      status: 'active',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      jobs: 'configurés pour vendeurs'
    };
  } catch (error) {
    healthCheck.success = false;
    healthCheck.database = 'disconnected';
    healthCheck.message = 'Problème de connexion base de données';
    healthCheck.error = process.env.NODE_ENV === 'development' ? error.message : undefined;
    return res.status(503).json(healthCheck);
  }

  res.json(healthCheck);
});

// ✅ Routes de gestion des jobs MIS À JOUR
app.get('/api/jobs/status', async (req, res) => {
  try {
    const jobsStatus = {
      monthly_reminders: { 
        schedule: '0 8 20-25 * *', 
        description: 'Rappels mensuels du 20 au 25 à 8h',
        next: 'Pour vendeurs: rappel paiement mensuel'
      },
      check_missing_declarations: { 
        schedule: '0 9 5 * *', 
        description: 'Vérification déclarations manquantes le 5 du mois',
        next: 'Pour vendeurs: alerte si pas déclaré mois précédent'
      },
      notify_late_declarations: { 
        schedule: '0 10 */10 * *', 
        description: 'Notification déclarations en retard tous les 10 jours',
        next: 'Pour vendeurs: alerte retard paiement'
      },
      cleanup_expired_notifications: { 
        schedule: '0 0 * * *', 
        description: 'Nettoyage notifications expirées à minuit',
        next: 'Maintenance: supprime vieilles notifications'
      }
    };

    res.json({
      success: true,
      data: jobsStatus,
      serverTime: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      message: 'Jobs configurés pour vendeurs informels'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur récupération statut jobs'
    });
  }
});

// ✅ Route d'exécution manuelle des jobs (admin)
app.post('/api/jobs/run-all', async (req, res) => {
  try {
    console.log('🚀 Exécution manuelle de tous les jobs...');
    
    const result = await NotificationJobs.runAllTasks();
    
    res.json({
      success: true,
      message: 'Tous les jobs exécutés avec succès',
      data: result
    });

  } catch (error) {
    console.error('❌ Erreur exécution jobs:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ✅ Page d'accueil de l'API
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API In-Tax - Gestion Fiscale pour Vendeurs Madagascar',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: '/api/auth',
      declarations: '/api/declarations',
      payments: '/api/payments',
      system: '/api/system',
      notifications: '/api/notifications',
      health: '/health',
      jobs: '/api/jobs/status',
      run_jobs: '/api/jobs/run-all (POST)',
      admin:'/api/admin'
    }
  });
});

// ✅ Middleware 404
app.use((req, res, next) => {
  console.log(`❌ Route non trouvée: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      '/api/auth',
      '/api/declarations', 
      '/api/payments',
      '/api/notifications',
      '/health',
      '/api/jobs/status',
      '/api/jobs/run-all',
      '/api/admin'
    ]
  });
});

// ✅ Gestion des erreurs globales
app.use((error, req, res, next) => {
  console.error('🚨 Erreur serveur:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(error.status || 500).json({
    success: false,
    message: isProduction ? 'Erreur interne du serveur' : error.message,
    ...(isProduction ? {} : { 
      stack: error.stack,
      path: req.path 
    })
  });
});

// ✅ Configuration du port
const PORT = process.env.PORT || 5000;

// 🚀 Initialisation du serveur
(async function initializeServer() {
  try {
    console.log('🔄 Initialisation du serveur In-Tax pour vendeurs...');
    
    // 1. Connexion à la base de données
    await sequelize.authenticate();
    console.log('✅ Connexion PostgreSQL établie avec succès!');
    
    // 2. Synchronisation des modèles (développement seulement)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('✅ Modèles de base de données synchronisés');
    }

    // 3. Configuration des tâches CRON POUR VENDEURS
    console.log('⏰ Configuration des tâches CRON pour vendeurs...');

    // a) Rappels mensuels du 20 au 25 à 8h
    cron.schedule('0 8 20-25 * *', async () => {
      console.log('🔔 CRON: Rappels mensuels pour vendeurs (20-25 du mois)');
      await NotificationJobs.runMonthlyReminders();
    });

    // b) Vérifier déclarations manquantes le 5 de chaque mois à 9h
    cron.schedule('0 9 5 * *', async () => {
      console.log('🔍 CRON: Vérification déclarations manquantes');
      await NotificationJobs.runCheckMissingDeclarations();
    });

    // c) Notifier déclarations en retard tous les 10 jours à 10h
    cron.schedule('0 10 */10 * *', async () => {
      console.log('⚠️ CRON: Notification déclarations en retard');
      await NotificationJobs.runNotifyLateDeclarations();
    });

    // d) Nettoyage notifications expirées à minuit
    cron.schedule('0 0 * * *', async () => {
      console.log('🧹 CRON: Nettoyage notifications expirées');
      await NotificationJobs.runCleanupExpired();
    });

    console.log('✅ Tâches CRON configurées pour vendeurs!');

    // 4. Démarrage du serveur
    app.listen(PORT, "0.0.0.0", () => {
      console.log('\n' + '='.repeat(60));
      console.log('🚀 SERVEUR IN-TAX DÉMARRÉ AVEC SUCCÈS!');
      console.log('='.repeat(60));
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌐 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`👥 Cible: Vendeurs informels Madagascar`);
      console.log(`🔔 Notifications: Rappels 20-25, Manquants le 5, Retards tous 10j`);
      console.log(`🔗 URL API: http://localhost:${PORT}`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
      console.log(`🛠️  Jobs Status: http://localhost:${PORT}/api/jobs/status`);
      console.log('='.repeat(60));
    });

  } catch (error) {
    console.error('❌ ERREUR CRITIQUE LORS DE L\'INITIALISATION:', error);
    
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️  Mode dégradé: Serveur démarre sans certaines fonctionnalités');
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 Serveur démarré en mode dégradé sur le port ${PORT}`);
      });
    } else {
      process.exit(1);
    }
  }
})();

// Gestion gracieuse de l'arrêt
process.on('SIGINT', async () => {
  console.log('\n🔻 Arrêt gracieux du serveur...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔻 Arrêt gracieux du serveur...');
  await sequelize.close();
  process.exit(0);
});

module.exports = app;