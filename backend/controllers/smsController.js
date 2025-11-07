const db = require('../models');
const { User, PendingOTP, Declaration } = db;

const SMSController = {
  async handleAndroidSMS(req, res) {
    try {
      const { sender, message, timestamp } = req.body;
      
      console.log(`📱 SMS reçu de ${sender}: ${message}`);
      
      const phoneNumber = this.cleanPhoneNumber(sender);
      await this.processIncomingSMS(phoneNumber, message);
      
      res.json({ success: true, message: 'SMS traité' });
    } catch (error) {
      console.error('Erreur traitement SMS:', error);
      res.status(500).json({ success: false, message: 'Erreur traitement SMS' });
    }
  },

  async processIncomingSMS(phoneNumber, message) {
    const cleanMessage = message.trim().toUpperCase();
    
    if (/^\d{4,6}$/.test(cleanMessage)) {
      await this.handleOTPCode(phoneNumber, cleanMessage);
      return;
    }
    
    switch(cleanMessage) {
      case 'STATUS':
      case 'STATUT':
        await this.sendUserStatus(phoneNumber);
        break;
      case 'SOLDE':
      case 'BALANCE':
        await this.sendUserBalance(phoneNumber);
        break;
      case 'HELP':
      case 'AIDE':
        await this.sendHelp(phoneNumber);
        break;
      default:
        await this.sendUnknownCommand(phoneNumber);
    }
  },

  async handleOTPCode(phoneNumber, otpCode) {
    try {
      const user = await User.findOne({ where: { phoneNumber } });
      if (!user) {
        await this.sendSMSResponse(phoneNumber, '❌ Utilisateur non trouvé.');
        return;
      }
      
      const pendingOTP = await PendingOTP.findOne({
        where: {
          userId: user.id,
          code: otpCode,
          used: false,
          expiresAt: { [db.Sequelize.Op.gt]: new Date() }
        }
      });
      
      if (pendingOTP) {
        await pendingOTP.update({ used: true });
        await this.sendSMSResponse(phoneNumber, '✅ Connexion réussie!');
      } else {
        await this.sendSMSResponse(phoneNumber, '❌ Code invalide.');
      }
    } catch (error) {
      console.error('Erreur OTP:', error);
      await this.sendSMSResponse(phoneNumber, '❌ Erreur système.');
    }
  },

  async sendUserStatus(phoneNumber) {
    try {
      const user = await User.findOne({ 
        where: { phoneNumber },
        include: [{
          model: Declaration,
          as: 'declarations',
          attributes: ['status', 'period']
        }]
      });
      
      if (!user) {
        await this.sendSMSResponse(phoneNumber, '❌ Utilisateur non trouvé.');
        return;
      }
      
      const pendingCount = user.declarations.filter(d => d.status === 'PENDING').length;
      const paidCount = user.declarations.filter(d => d.status === 'PAID').length;
      
      const statusMessage = `📊 STATUT IN-TAX:
👤 ${user.firstName} ${user.lastName}
📞 ${user.phoneNumber}
🎯 NIF: ${user.nifStatus}
📋 Déclarations: ⏳${pendingCount} ✅${paidCount}`;
      
      await this.sendSMSResponse(phoneNumber, statusMessage);
    } catch (error) {
      await this.sendSMSResponse(phoneNumber, '❌ Erreur statut.');
    }
  },

  async sendSMSResponse(phoneNumber, message) {
    console.log(`📤 Réponse à ${phoneNumber}: ${message}`);
  },

  cleanPhoneNumber(phone) {
    return phone.replace(/\s+/g, '').replace('+', '');
  }
};

module.exports = SMSController;