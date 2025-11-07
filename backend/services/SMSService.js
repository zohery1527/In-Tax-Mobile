const axios = require('axios');

class SMSService {
  constructor() {
    this.isSandbox = true;
    this.messageTemplates = this.initTemplates();
  }

  initTemplates() {
    return {
      OTP: {
        fr: (code, type) => `Votre code ${type} In-Tax: ${code}. Valide 10 min. Ne partagez pas ce code.`,
        mg: (code, type) => `Kaody ${type} In-Tax anao: ${code}. Manakery 10 min. Aza mizara io kaody io.`
      },
      
      PAYMENT_CONFIRMATION: {
        fr: (amount, period, ref) => `Paiement ${amount} MGA pour ${period} confirmé! Ref: ${ref}. Merci!`,
        mg: (amount, period, ref) => `Fandoavam-bola ${amount} Ar ho an'ny ${period} voamarina! Ref: ${ref}. Misaotra!`
      },
      
      DECLARATION_SUBMITTED: {
        fr: (period, tax) => `Déclaration ${period} soumise. Taxe: ${tax} MGA. Paiement dans 7 jours. In-Tax`,
        mg: (period, tax) => `Famaranana ${period} nalefa. Hetezambola: ${tax} Ar. Fandoavana ao anatin'ny 7 andro. In-Tax`
      },
      
      DECLARATION_VALIDATED: {
        fr: (period, tax) => `Votre déclaration ${period} est validée. Taxe: ${tax} MGA. Paiement mobile money disponible. In-Tax`,
        mg: (period, tax) => `Voamarina ny famaranana ${period}. Hetezambola: ${tax} Ar. Afaka mandoa @ mobile money ianao. In-Tax`
      }
    };
  }

  async sendOTP(phoneNumber, otpCode, type = 'connexion', language = 'fr') {
    try {
      const message = this.messageTemplates.OTP[language](otpCode, type);
      
      if (this.isSandbox) {
        console.log('\n' + '='.repeat(50));
        console.log('📱 **SMS OTP - IN-TAX**');
        console.log('='.repeat(50));
        console.log(`Destinataire: ${phoneNumber}`);
        console.log(`Type: ${type.toUpperCase()}`);
        console.log(`Message: ${message}`);
        console.log(`Statut: SMS Simulé avec succès`);
        console.log('='.repeat(50));
        
        return { 
          success: true, 
          messageId: 'mock-otp-' + Date.now(),
          sandbox: true 
        };
      }
      
      return await this.sendRealSMS(phoneNumber, message);
      
    } catch (error) {
      console.error('❌ Erreur envoi OTP:', error);
      return { success: false, error: error.message };
    }
  }

  async sendPaymentConfirmation(phoneNumber, amount, period, transactionRef, language = 'fr') {
    try {
      const message = this.messageTemplates.PAYMENT_CONFIRMATION[language](
        amount.toLocaleString(), period, transactionRef
      );
      
      if (this.isSandbox) {
        console.log('\n' + '='.repeat(50));
        console.log('💰 **SMS CONFIRMATION PAIEMENT**');
        console.log('='.repeat(50));
        console.log(`Destinataire: ${phoneNumber}`);
        console.log(`Montant: ${amount} MGA`);
        console.log(`Période: ${period}`);
        console.log(`Transaction: ${transactionRef}`);
        console.log(`Message: ${message}`);
        console.log(`Statut: SMS Simulé avec succès`);
        console.log('='.repeat(50));
        
        return { 
          success: true, 
          messageId: 'mock-payment-' + Date.now(),
          sandbox: true 
        };
      }
      
      return await this.sendRealSMS(phoneNumber, message);
      
    } catch (error) {
      console.error('❌ Erreur SMS confirmation paiement:', error);
      return { success: false, error: error.message };
    }
  }

  async sendDeclarationSubmitted(phoneNumber, period, taxAmount, language = 'fr') {
    try {
      const message = this.messageTemplates.DECLARATION_SUBMITTED[language](
        period, taxAmount.toLocaleString()
      );
      
      if (this.isSandbox) {
        console.log('\n' + '='.repeat(50));
        console.log('📋 **SMS DÉCLARATION SOUMISE**');
        console.log('='.repeat(50));
        console.log(`Destinataire: ${phoneNumber}`);
        console.log(`Période: ${period}`);
        console.log(`Taxe: ${taxAmount} MGA`);
        console.log(`Message: ${message}`);
        console.log(`Statut: SMS Simulé avec succès`);
        console.log('='.repeat(50));
        
        return { 
          success: true, 
          messageId: 'mock-declaration-' + Date.now(),
          sandbox: true 
        };
      }
      
      return await this.sendRealSMS(phoneNumber, message);
      
    } catch (error) {
      console.error('❌ Erreur SMS déclaration soumise:', error);
      return { success: false, error: error.message };
    }
  }

  async sendDeclarationValidated(phoneNumber, period, taxAmount, language = 'fr') {
    try {
      const message = this.messageTemplates.DECLARATION_VALIDATED[language](
        period, taxAmount.toLocaleString()
      );
      
      if (this.isSandbox) {
        console.log('\n' + '='.repeat(50));
        console.log('✅ **SMS DÉCLARATION VALIDÉE**');
        console.log('='.repeat(50));
        console.log(`Destinataire: ${phoneNumber}`);
        console.log(`Période: ${period}`);
        console.log(`Taxe: ${taxAmount} MGA`);
        console.log(`Message: ${message}`);
        console.log(`Statut: SMS Simulé avec succès`);
        console.log('='.repeat(50));
        
        return { 
          success: true, 
          messageId: 'mock-validation-' + Date.now(),
          sandbox: true 
        };
      }
      
      return await this.sendRealSMS(phoneNumber, message);
      
    } catch (error) {
      console.error('❌ Erreur SMS déclaration validée:', error);
      return { success: false, error: error.message };
    }
  }

  async sendRealSMS(phoneNumber, message) {
    console.log(`🚀 [PRODUCTION] SMS envoyé à ${phoneNumber}: ${message}`);
    return { success: true, production: true };
  }
}

module.exports = new SMSService();