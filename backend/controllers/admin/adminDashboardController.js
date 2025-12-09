// controllers/admin/adminDashboardController.js - VERSION FINALE CORRIGÉE
const { User, Declaration, Payment, Zone, AuditLog, Admin, sequelize } = require('../../models');
const { Op } = require('sequelize');

const adminDashboardController = {

  getDashboard: async (req, res) => {
    try {
      const admin = req.admin;
      const dashboardData = await getDashboardDataByScope(admin);

      res.json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du chargement du tableau de bord'
      });
    }
  },

  getChartsData: async (req, res) => {
    try {
      const { period = 'month' } = req.query;
      const admin = req.admin;

      const chartsData = await getChartsDataByScope(admin, period);

      res.json({
        success: true,
        data: chartsData
      });

    } catch (error) {
      console.error('Charts data error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du chargement des graphiques'
      });
    }
  },

  getQuickStats: async (req, res) => {
    try {
      const admin = req.admin;
      const zoneFilter = await getZoneFilter(admin);

      const [usersStats, declarationsStats, paymentsStats] = await Promise.all([
        getUserStats(zoneFilter),
        getDeclarationStats(zoneFilter),
        getPaymentStats(zoneFilter)
      ]);

      res.json({
        success: true,
        data: {
          users: usersStats,
          declarations: declarationsStats,
          payments: paymentsStats
        }
      });

    } catch (error) {
      console.error('Quick stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du chargement des statistiques'
      });
    }
  },

  getRecentActivities: async (req, res) => {
    try {
      const admin = req.admin;
      const { limit = 10 } = req.query;
      const zoneFilter = await getZoneFilter(admin);

      const activities = await getRecentActivitiesData(zoneFilter, parseInt(limit));

      res.json({
        success: true,
        data: activities
      });

    } catch (error) {
      console.error('Recent activities error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du chargement des activités récentes'
      });
    }
  },

  getZoneStatistics: async (req, res) => {
    try {
      const admin = req.admin;
      const zoneFilter = await getZoneFilter(admin);

      const zoneStats = await getZoneStatsData(zoneFilter, admin);

      res.json({
        success: true,
        data: zoneStats
      });

    } catch (error) {
      console.error('Zone statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du chargement des statistiques par zone'
      });
    }
  },

  getTopPayers: async (req, res) => {
    try {
      const admin = req.admin;
      const { limit = 5 } = req.query;
      const zoneFilter = await getZoneFilter(admin);

      const topPayers = await getTopPayersData(zoneFilter, parseInt(limit));

      res.json({
        success: true,
        data: topPayers
      });

    } catch (error) {
      console.error('Top payers error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du chargement des top payeurs'
      });
    }
  }
};

// ==================== FONCTIONS HELPER ====================

async function getZoneFilter(admin) {
  try {
    if (admin.scope === 'GLOBAL') {
      return {};
    }
    
    const adminZones = await admin.getZones();
    const zoneIds = adminZones.map(z => z.id);
    
    if (zoneIds.length === 0) {
      return { zoneId: { [Op.eq]: null } };
    }
    
    return { zoneId: { [Op.in]: zoneIds } };
  } catch (error) {
    console.error('Get zone filter error:', error);
    return {};
  }
}

async function getDashboardDataByScope(admin) {
  try {
    const zoneFilter = await getZoneFilter(admin);

    const [
      usersStats,
      declarationsStats,
      paymentsStats,
      recentActivities,
      zoneStats,
      topPayers
    ] = await Promise.all([
      getUserStats(zoneFilter),
      getDeclarationStats(zoneFilter),
      getPaymentStats(zoneFilter),
      getRecentActivitiesData(zoneFilter, 10),
      getZoneStatsData(zoneFilter, admin),
      getTopPayersData(zoneFilter, 5)
    ]);

    return {
      scope: admin.scope,
      stats: {
        users: usersStats,
        declarations: declarationsStats,
        payments: paymentsStats
      },
      recentActivities,
      zoneStats,
      topPayers,
      adminInfo: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        scope: admin.scope,
        region: admin.region,
        department: admin.department
      }
    };
  } catch (error) {
    console.error('Get dashboard data by scope error:', error);
    throw error;
  }
}

async function getUserStats(zoneFilter) {
  try {
    const baseOptions = {
      include: [{
        model: Zone,
        as: 'zone',
        where: zoneFilter.zoneId || {},
        required: !!zoneFilter.zoneId
      }]
    };

    const [totalUsers, activeUsers, pendingNIF] = await Promise.all([
      User.count(baseOptions),
      User.count({
        where: { isActive: true },
        ...baseOptions
      }),
      User.count({
        where: { nifStatus: 'PENDING' },
        ...baseOptions
      })
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newUsers = await User.count({
      where: {
        createdAt: { [Op.gte]: sevenDaysAgo }
      },
      ...baseOptions
    });

    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      pendingNIF: pendingNIF || 0,
      newUsers: newUsers || 0
    };
  } catch (error) {
    console.error('Get user stats error:', error);
    return { totalUsers: 0, activeUsers: 0, pendingNIF: 0, newUsers: 0 };
  }
}

async function getDeclarationStats(zoneFilter) {
  try {
    const baseOptions = {
      include: [{
        model: User,
        as: 'user',
        include: [{
          model: Zone,
          as: 'zone',
          where: zoneFilter.zoneId || {},
          required: !!zoneFilter.zoneId
        }],
        required: true
      }]
    };

    const [totalDeclarations, pendingDeclarations] = await Promise.all([
      Declaration.count(baseOptions),
      Declaration.count({
        where: { status: 'PENDING' },
        ...baseOptions
      })
    ]);

    const validatedDeclarations = await Declaration.count({
      where: { status: 'VALIDATED' },
      ...baseOptions
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentDeclarations = await Declaration.count({
      where: {
        createdAt: { [Op.gte]: sevenDaysAgo }
      },
      ...baseOptions
    });

    return {
      totalDeclarations: totalDeclarations || 0,
      pendingDeclarations: pendingDeclarations || 0,
      validatedDeclarations: validatedDeclarations || 0,
      recentDeclarations: recentDeclarations || 0
    };
  } catch (error) {
    console.error('Get declaration stats error:', error);
    return { 
      totalDeclarations: 0, 
      pendingDeclarations: 0, 
      validatedDeclarations: 0, 
      recentDeclarations: 0 
    };
  }
}

/**
 * Statistiques des paiements - VERSION FINALE CORRIGÉE
 */
async function getPaymentStats(zoneFilter) {
  try {
    // Créer les conditions WHERE pour Sequelize
    const userWhereCondition = zoneFilter.zoneId ? { zoneId: zoneFilter.zoneId } : {};
    
    // Options de base pour les requêtes
    const baseOptions = {
      where: { status: 'COMPLETED' },
      include: [{
        model: User,
        as: 'user',
        where: userWhereCondition,
        required: true,
        attributes: [] // Ne pas inclure les colonnes de l'utilisateur ici
      }]
    };

    // 1. Total des paiements COMPLETED
    const totalPayments = await Payment.count(baseOptions);

    // 2. Revenu total - CORRECTION: SUM sans colonnes non-agrégées
    const totalRevenue = await Payment.sum('amount', {
      where: { status: 'COMPLETED' },
      include: [{
        model: User,
        as: 'user',
        where: userWhereCondition,
        required: true,
        attributes: [] // Important: pas de colonnes user ici
      }]
    });

    // 3. Paiements PENDING
    const pendingPayments = await Payment.count({
      where: { status: 'PENDING' },
      include: [{
        model: User,
        as: 'user',
        where: userWhereCondition,
        required: true,
        attributes: []
      }]
    });

    // 4. Revenu des 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRevenue = await Payment.sum('amount', {
      where: {
        status: 'COMPLETED',
        createdAt: { [Op.gte]: thirtyDaysAgo }
      },
      include: [{
        model: User,
        as: 'user',
        where: userWhereCondition,
        required: true,
        attributes: []
      }]
    });

    return {
      totalPayments: totalPayments || 0,
      totalRevenue: parseFloat(totalRevenue || 0).toFixed(2),
      pendingPayments: pendingPayments || 0,
      recentRevenue: parseFloat(recentRevenue || 0).toFixed(2)
    };
  } catch (error) {
    console.error('Get payment stats error:', error);
    return { totalPayments: 0, totalRevenue: 0, pendingPayments: 0, recentRevenue: 0 };
  }
}

async function getRecentActivitiesData(zoneFilter, limit = 10) {
  try {
    const activities = await AuditLog.findAll({
      include: [
        {
          model: Admin,
          as: 'admin',
          attributes: ['id', 'fullName', 'email', 'role']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: limit
    });

    return activities.map(activity => ({
      id: activity.id,
      action: activity.action,
      resource: activity.resource,
      resourceId: activity.resourceId,
      status: activity.status,
      details: activity.details,
      ipAddress: activity.ipAddress,
      userAgent: activity.userAgent,
      errorMessage: activity.errorMessage,
      createdAt: activity.createdAt,
      admin: activity.admin ? {
        id: activity.admin.id,
        fullName: activity.admin.fullName || 'Admin inconnu',
        email: activity.admin.email,
        role: activity.admin.role
      } : null
    }));
  } catch (error) {
    console.error('Get recent activities error:', error);
    return [];
  }
}

async function getZoneStatsData(zoneFilter, admin) {
  try {
    let zones;
    const whereCondition = zoneFilter.zoneId ? { id: zoneFilter.zoneId } : {};

    if (admin.scope === 'GLOBAL') {
      zones = await Zone.findAll({
        where: whereCondition,
        attributes: {
          include: [
            [
              sequelize.literal(`(
                SELECT COUNT(*) FROM "Users" 
                WHERE "Users"."zoneId" = "Zone"."id"
              )`),
              'userCount'
            ],
            [
              sequelize.literal(`(
                SELECT COUNT(*) FROM "Users" 
                WHERE "Users"."zoneId" = "Zone"."id"
                AND "Users"."isActive" = true
              )`),
              'activeUserCount'
            ],
            [
              sequelize.literal(`(
                SELECT COALESCE(SUM(amount), 0) FROM "Payments"
                INNER JOIN "Users" ON "Payments"."userId" = "Users"."id"
                WHERE "Users"."zoneId" = "Zone"."id"
                AND "Payments"."status" = 'COMPLETED'
              )`),
              'totalRevenue'
            ],
            [
              sequelize.literal(`(
                SELECT COUNT(*) FROM "Declarations"
                INNER JOIN "Users" ON "Declarations"."userId" = "Users"."id"
                WHERE "Users"."zoneId" = "Zone"."id"
                AND "Declarations"."status" = 'PENDING'
              )`),
              'pendingDeclarations'
            ]
          ]
        },
        order: [['name', 'ASC']]
      });
    } else {
      zones = await Zone.findAll({
        where: whereCondition,
        attributes: [
          'id',
          'name',
          'code',
          'region',
          'isActive',
          'createdAt'
        ]
      });

      zones = await Promise.all(zones.map(async (zone) => {
        const [userCount, activeUserCount, totalRevenue, pendingDeclarations] = await Promise.all([
          User.count({ where: { zoneId: zone.id } }),
          User.count({ where: { zoneId: zone.id, isActive: true } }),
          // CORRECTION: Ajout de attributes: [] pour éviter l'erreur GROUP BY
          Payment.sum('amount', {
            where: { status: 'COMPLETED' },
            include: [{
              model: User,
              as: 'user',
              where: { zoneId: zone.id },
              attributes: [] // Important!
            }]
          }),
          // CORRECTION: Ajout de attributes: [] ici aussi
          Declaration.count({
            where: { status: 'PENDING' },
            include: [{
              model: User,
              as: 'user',
              where: { zoneId: zone.id },
              attributes: [] // Important!
            }]
          })
        ]);

        return {
          id: zone.id,
          name: zone.name,
          code: zone.code,
          region: zone.region,
          isActive: zone.isActive,
          createdAt: zone.createdAt,
          userCount: userCount || 0,
          activeUserCount: activeUserCount || 0,
          totalRevenue: parseFloat(totalRevenue || 0).toFixed(2),
          pendingDeclarations: pendingDeclarations || 0
        };
      }));
    }

    return zones;
  } catch (error) {
    console.error('Get zone stats error:', error);
    return [];
  }
}

async function getTopPayersData(zoneFilter, limit = 5) {
  try {
    const topPayers = await Payment.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('Payment.id')), 'paymentCount']
      ],
      where: {
        status: 'COMPLETED'
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'nifNumber', 'activityType'],
        include: [{
          model: Zone,
          as: 'zone',
          attributes: ['id', 'name', 'code', 'region'],
          where: zoneFilter.zoneId || {},
          required: !!zoneFilter.zoneId
        }],
        required: true
      }],
      group: ['Payment.userId', 'user.id', 'user.zone.id'],
      order: [[sequelize.literal('"totalAmount"'), 'DESC']],
      limit: limit,
      raw: false,
      nest: true
    });

    return topPayers.map(payer => ({
      userId: payer.user.id,
      fullName: `${payer.user.firstName} ${payer.user.lastName}`,
      phoneNumber: payer.user.phoneNumber,
      nifNumber: payer.user.nifNumber,
      activityType: payer.user.activityType,
      zone: payer.user.zone,
      totalAmount: parseFloat(payer.dataValues.totalAmount || 0).toFixed(2),
      paymentCount: payer.dataValues.paymentCount || 0
    }));
  } catch (error) {
    console.error('Get top payers error:', error);
    return [];
  }
}

/**
 * Données pour les graphiques - VERSION FINALE
 */
async function getChartsDataByScope(admin, period) {
  try {
    const zoneFilter = await getZoneFilter(admin);
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    // Préparer la condition de zone pour les requêtes SQL
    let zoneCondition = '';
    if (zoneFilter.zoneId && zoneFilter.zoneId[Op.in]) {
      const zoneIds = Array.isArray(zoneFilter.zoneId[Op.in]) 
        ? zoneFilter.zoneId[Op.in] 
        : [zoneFilter.zoneId[Op.in]];
      zoneCondition = `AND u."zoneId" IN (${zoneIds.map(id => `'${id}'`).join(',')})`;
    }

    // Données des utilisateurs par jour
    const usersQuery = `
      SELECT 
        DATE_TRUNC('day', u."createdAt") as date,
        COUNT(u.id) as count
      FROM "Users" u
      WHERE u."createdAt" >= '${startDate.toISOString()}'
      ${zoneCondition}
      GROUP BY DATE_TRUNC('day', u."createdAt")
      ORDER BY date ASC
    `;

    // Données des paiements par jour
    const paymentsQuery = `
      SELECT 
        DATE_TRUNC('day', p."createdAt") as date,
        COALESCE(SUM(p.amount), 0) as total,
        COUNT(p.id) as count
      FROM "Payments" p
      INNER JOIN "Users" u ON p."userId" = u.id
      WHERE p.status = 'COMPLETED'
      AND p."createdAt" >= '${startDate.toISOString()}'
      ${zoneCondition}
      GROUP BY DATE_TRUNC('day', p."createdAt")
      ORDER BY date ASC
    `;

    // Données des déclarations par jour
    const declarationsQuery = `
      SELECT 
        DATE_TRUNC('day', d."createdAt") as date,
        COUNT(d.id) as count
      FROM "Declarations" d
      INNER JOIN "Users" u ON d."userId" = u.id
      WHERE d."createdAt" >= '${startDate.toISOString()}'
      ${zoneCondition}
      GROUP BY DATE_TRUNC('day', d."createdAt")
      ORDER BY date ASC
    `;

    // Exécuter les requêtes
    const [usersData, paymentsData, declarationsData] = await Promise.all([
      sequelize.query(usersQuery, { type: sequelize.QueryTypes.SELECT }),
      sequelize.query(paymentsQuery, { type: sequelize.QueryTypes.SELECT }),
      sequelize.query(declarationsQuery, { type: sequelize.QueryTypes.SELECT })
    ]);

    // Formater les données pour le frontend
    const formatChartData = (data) => {
      const labels = [];
      const values = [];

      data.forEach(item => {
        if (item.date) {
          const date = new Date(item.date);
          labels.push(date.toLocaleDateString('fr-FR'));
          values.push(parseFloat(item.count || item.total || 0));
        }
      });

      return { labels, values };
    };

    return {
      period,
      users: formatChartData(usersData),
      payments: {
        ...formatChartData(paymentsData.map(p => ({ ...p, count: p.total }))),
        transactionCounts: paymentsData.map(p => parseFloat(p.count || 0))
      },
      declarations: formatChartData(declarationsData)
    };

  } catch (error) {
    console.error('Get charts data error:', error);
    return {
      period,
      users: { labels: [], values: [] },
      payments: { labels: [], values: [], transactionCounts: [] },
      declarations: { labels: [], values: [] }
    };
  }
}

module.exports = adminDashboardController;