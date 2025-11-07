const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const { sequelize } = require('./models');
// ✅ Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(helmet());
app.use(express.json());

// ✅ Routes principales
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/declarations', require('./routes/declarations'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/system', require('./routes/system'));
app.use('/api/sms', require('./routes/sms'));

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
      system: '/api/system'
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

// ✅ Gestion des erreurs serveur
app.use((error, req, res, next) => {
  console.error('Erreur serveur:', error);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur'
  });
});

// ✅ Port dynamique (important pour Render)
const PORT = process.env.PORT || 5000;



(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion PostgreSQL établie avec succès sur Render !');
  } catch (error) {
    console.error('❌ Erreur de connexion PostgreSQL :', error.message);
  }
})();


app.listen(PORT, () => {
  console.log(`🚀 Serveur In-Tax démarré sur le port ${PORT}`);
  console.log(`📱 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend: http://localhost:3001`);
  console.log(`🔗 API: http://localhost:${PORT}`);
});
