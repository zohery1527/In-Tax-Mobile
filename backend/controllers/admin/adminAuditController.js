// controllers/admin/adminAuditController.js
const { AuditLog, Admin } = require('../../models');

const adminAuditController = {

  getAuditLogs: async (req, res) => {
    try {
      const { page = 1, limit = 50, action, resource, adminId, startDate, endDate } = req.query;

      const whereClause = buildAuditWhereClause(req.query);

      const { count, rows: logs } = await AuditLog.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        order: [['createdAt', 'DESC']],
        include: [{
          model: Admin,
          as: 'admin',
          attributes: ['fullName', 'role', 'email']
        }]
      });

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des journaux d\'audit'
      });
    }
  }
};

function buildAuditWhereClause(query) {
  const whereClause = {};

  if (query.action) whereClause.action = query.action;
  if (query.resource) whereClause.resource = query.resource;
  if (query.adminId) whereClause.adminId = query.adminId;

  if (query.startDate || query.endDate) {
    whereClause.createdAt = {};
    if (query.startDate) whereClause.createdAt[sequelize.Op.gte] = new Date(query.startDate);
    if (query.endDate) whereClause.createdAt[sequelize.Op.lte] = new Date(query.endDate);
  }

  return whereClause;
}

module.exports = adminAuditController;