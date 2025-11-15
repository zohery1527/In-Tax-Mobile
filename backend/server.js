const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron'); // 💡 NÉCESSAIRE pour la planification
require('dotenv').config();
const Routeauth=require('./routes/auth');
const RouteAdmin=require('./routes/admin');




const app = express();
const { sequelize } = require('./models');
const NotificationService = require('./services/notificationService'); // 💡 NÉCESSAIRE pour la maintenance

// ✅ Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(helmet());
app.use(express.json());

// ✅ Routes principales
app.use('/api/auth',Routeauth);
app.use('/api/admin',RouteAdmin);
app.use('/api/declarations', require('./routes/declarations'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/system', require('./routes/system'));
app.use('/api/sms', require('./routes/sms'));
app.use('/api/notifications', require('./routes/notifications')); // 💡 Route de notification ajoutée

// ✅ Vérification de santé (utile pour Render)
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API In-Tax opérationnelle',
    timestamp: new Date().toISOString()
  });
});

// ✅ Page d'accueil de l'API
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API In-Tax - Gestion Fiscale Madagascar',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      declarations: '/api/declarations',
      payments: '/api/payments',
      system: '/api/system',
      notifications: '/api/notifications' // 💡 Endpoint ajouté
    }
  });
});

// ✅ Gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// ✅ Gestion des erreurs serveur (Middleware à 4 arguments)
app.use((error, req, res, next) => {
  console.error('Erreur serveur:', error);
  // Empêcher l'envoi de l'erreur brute en production
  const message = process.env.NODE_ENV === 'production' 
                ? 'Erreur interne du serveur' 
                : error.message || 'Erreur interne du serveur'; 
  res.status(error.status || 500).json({
    success: false,
    message: message
  });
});

// ✅ Port dynamique (important pour Render)
const PORT = process.env.PORT || 5000;


// 💾 Initialisation et Tâches planifiées (Cron Jobs)
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion PostgreSQL établie avec succès sur Render !');
    
    // Nettoyer les notifications expirées au démarrage
    console.log('🧹 Exécution du nettoyage des notifications expirées au démarrage...');
    await NotificationService.cleanupExpiredNotifications();

    // Planifier les tâches automatiques (si en production)
    if (process.env.NODE_ENV === 'production') {
      console.log('⏰ Planification des tâches automatiques activée.');
      
      // Nettoyer les notifications expirées chaque jour à minuit
      cron.schedule('0 0 * * *', () => {
        console.log('🧹 Tâche Cron (Minuit): Nettoyage quotidien des notifications.');
        NotificationService.cleanupExpiredNotifications();
      });

      // Générer les rappels chaque jour à 8h du matin
      cron.schedule('0 8 * * *', () => {
        console.log('🔔 Tâche Cron (8h00): Génération quotidienne des rappels.');
        NotificationService.generateAutomaticReminders();
      });
    }

  } catch (error) {
    console.error('❌ Erreur de connexion PostgreSQL :', error.message);
    // Gérer les erreurs de connexion à la base de données
    // Le serveur peut démarrer même sans DB si vous ne voulez pas qu'il plante
    // Pour une API critique, vous pourriez choisir de faire planter le processus: process.exit(1);
  }
})();


app.listen(PORT, () => {
  console.log(`🚀 Serveur In-Tax démarré sur le port ${PORT}`);
  console.log(`📱 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend: http://localhost:3001`);
  console.log(`🔗 API: http://localhost:${PORT}`);
});