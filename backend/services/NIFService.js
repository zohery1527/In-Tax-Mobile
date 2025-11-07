const db = require('../models');
const { NIFHistory } = db;

class NIFService {
  static generateNIF(zoneCode) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `NIF${zoneCode}${timestamp}${random}`;
  }

  static validateNIFFormat(nif) {
    const nifRegex = /^NIF[A-Z]{3}\d{9}$/;
    return nifRegex.test(nif);
  }

  static async createNIFHistory(userId, nifNumber, action, reason = null, performedBy = null) {
    return await NIFHistory.create({
      userId,
      nifNumber,
      action,
      reason,
      performedBy: performedBy || null,
      metadata: {
        timestamp: new Date().toISOString(),
        source: performedBy ? 'USER' : 'SYSTEM'
      }
    });
  }

  static async getUserNIFHistory(userId) {
    return await NIFHistory.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 10
    });
  }
}

module.exports = NIFService;