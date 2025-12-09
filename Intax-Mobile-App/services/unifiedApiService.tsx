// services/unifiedApiService.ts - VERSION CORRIGÉE
import { ApiNotification, apiService, Declaration } from './api';

// Interface pour les données extraites
interface ExtractedData {
  amount: number;
  period: string;
  activityType: 'ALIMENTATION' | 'ARTISANAT' | 'COMMERCE' | 'SERVICES' | 'AUTRE';
  description: string;
  source?: 'voice' | 'photo';
}

class UnifiedApiService {
  
  // 🎤 Pour la déclaration vocale - SIMULATION COMPLÈTE
  async processVoiceDeclaration(audioUri: string): Promise<Declaration> {
    console.log('🎤 Simulation traitement vocal...', audioUri);
    
    try {
      // ✅ SIMULATION D'EXTRACTION DE DONNÉES DEPUIS L'AUDIO
      const extractedData = await this.simulateVoiceExtraction(audioUri);
      
      console.log('📋 Données extraites vocales:', extractedData);
      
      // ✅ CRÉATION DE LA DÉCLARATION AVEC LES DONNÉES "EXTRAITES"
      const declaration = await apiService.createDeclaration({
        amount: extractedData.amount,
        period: extractedData.period,
        activityType: extractedData.activityType,
        description: `Déclaration vocale - ${extractedData.description}`
      });
      
      // Envoyer une notification de succès
      this.sendProcessingNotification('Votre déclaration vocale a été traitée avec succès!');
      
      return declaration;
      
    } catch (error: any) {
      console.error('❌ Erreur simulation vocale:', error);
      this.sendErrorNotification('Erreur lors du traitement vocal');
      throw new Error('Tsy afaka mandika ny teny. Andramo indray na ampiasao ny fomba hafa.');
    }
  }

  // 📸 Pour la déclaration photo - SIMULATION COMPLÈTE
  async processPhotoDeclaration(imageUri: string): Promise<Declaration> {
    console.log('📸 Simulation traitement photo...', imageUri);
    
    try {
      // ✅ SIMULATION D'EXTRACTION DE DONNÉES DEPUIS LA PHOTO
      const extractedData = await this.simulatePhotoExtraction(imageUri);
      
      console.log('📋 Données extraites photo:', extractedData);
      
      // ✅ CRÉATION DE LA DÉCLARATION AVEC LES DONNÉES "EXTRAITES"
      const declaration = await apiService.createDeclaration({
        amount: extractedData.amount,
        period: extractedData.period,
        activityType: extractedData.activityType,
        description: `Déclaration photo - ${extractedData.description}`
      });
      
      // Envoyer une notification de succès
      this.sendProcessingNotification('Votre photo a été analysée avec succès!');
      
      return declaration;
      
    } catch (error: any) {
      console.error('❌ Erreur simulation photo:', error);
      this.sendErrorNotification('Erreur lors de l\'analyse de la photo');
      throw new Error('Tsy afaka mandika ny sary. Andramo indray.');
    }
  }

  // ✅ SIMULATION INTELLIGENTE D'EXTRACTION VOCALE
  private async simulateVoiceExtraction(audioUri: string): Promise<ExtractedData> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // ✅ SCÉNARIOS PLUS INTELLIGENTS ET VARIÉS
        const scenarios: ExtractedData[] = [
          // Scénario Restaurant
          { 
            amount: this.generateRealisticAmount('restaurant'), 
            period: this.getCurrentPeriod(),
            activityType: 'ALIMENTATION',
            description: 'Restaurant - déclaration vocale'
          },
          // Scénario Commerce vêtements
          { 
            amount: this.generateRealisticAmount('commerce'), 
            period: this.getPreviousPeriod(),
            activityType: 'COMMERCE',
            description: 'Boutique vêtements - déclaration vocale'
          },
          // Scénario Services
          { 
            amount: this.generateRealisticAmount('service'), 
            period: this.getCurrentPeriod(),
            activityType: 'SERVICES',
            description: 'Services réparation - déclaration vocale'
          },
          // Scénario Artisanat
          { 
            amount: this.generateRealisticAmount('artisanat'), 
            period: this.getPreviousPeriod(),
            activityType: 'ARTISANAT',
            description: 'Atelier artisanat - déclaration vocale'
          },
          // Scénario Autre
          { 
            amount: this.generateRealisticAmount('autre'), 
            period: this.getCurrentPeriod(),
            activityType: 'AUTRE',
            description: 'Autre activité - déclaration vocale'
          }
        ];
        
        // Sélection aléatoire mais logique
        const randomIndex = Math.floor(Math.random() * scenarios.length);
        const selectedScenario = scenarios[randomIndex];
        
        console.log('🎭 Scénario vocal sélectionné:', selectedScenario);
        resolve(selectedScenario);
        
      }, 2000); // Simule le temps de "traitement"
    });
  }

  // ✅ SIMULATION INTELLIGENTE D'EXTRACTION PHOTO
  private async simulatePhotoExtraction(imageUri: string): Promise<ExtractedData> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // ✅ SCÉNARIOS SPÉCIFIQUES POUR LES PHOTOS
        const scenarios: ExtractedData[] = [
          // Scénario Facture commerce
          { 
            amount: this.generateRealisticAmount('commerce'), 
            period: this.getCurrentPeriod(),
            activityType: 'COMMERCE',
            description: 'Facture textile extraite'
          },
          // Scénario Facture restaurant
          { 
            amount: this.generateRealisticAmount('restaurant'), 
            period: this.getPreviousPeriod(),
            activityType: 'ALIMENTATION',
            description: 'Facture restaurant extraite'
          },
          // Scénario Facture services
          { 
            amount: this.generateRealisticAmount('service'), 
            period: this.getCurrentPeriod(),
            activityType: 'SERVICES',
            description: 'Facture services extraite'
          },
          // Scénario Facture artisanat
          { 
            amount: this.generateRealisticAmount('artisanat'), 
            period: this.getPreviousPeriod(),
            activityType: 'ARTISANAT',
            description: 'Facture artisanat extraite'
          }
        ];
        
        const randomIndex = Math.floor(Math.random() * scenarios.length);
        const selectedScenario = scenarios[randomIndex];
        
        console.log('🎭 Scénario photo sélectionné:', selectedScenario);
        resolve(selectedScenario);
        
      }, 3000); // Plus long pour la "lecture" photo
    });
  }

  // ✅ GÉNÉRATION DE MONTANTS RÉALISTES PAR TYPE D'ACTIVITÉ
  private generateRealisticAmount(activityType: string): number {
    const ranges: { [key: string]: [number, number] } = {
      'restaurant': [150000, 800000],   // 150k - 800k
      'commerce': [200000, 1200000],    // 200k - 1.2M
      'service': [100000, 500000],      // 100k - 500k
      'artisanat': [80000, 400000],     // 80k - 400k
      'autre': [50000, 300000]          // 50k - 300k
    };
    
    const [min, max] = ranges[activityType] || [100000, 500000];
    const amount = Math.floor(Math.random() * (max - min + 1)) + min;
    
    // Arrondir à 500 près pour plus de réalisme
    return Math.round(amount / 500) * 500;
  }

  // ✅ PÉRIODE COURANTE (mois en cours)
  private getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  // ✅ PÉRIODE PRÉCÉDENTE (mois dernier)
  private getPreviousPeriod(): string {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth(); // Mois précédent
    
    if (month === 0) {
      month = 11;
      year--;
    } else {
      month--;
    }
    
    return `${year}-${String(month + 1).padStart(2, '0')}`;
  }

  // ✅ ENVOI DE NOTIFICATION DE TRAITEMENT
  private async sendProcessingNotification(message: string) {
    try {
      // Vous pourriez utiliser votre service de notifications ici
      console.log('📢 Notification:', message);
    } catch (error) {
      console.warn('⚠️ Erreur envoi notification:', error);
    }
  }

  // ✅ ENVOI DE NOTIFICATION D'ERREUR
  private async sendErrorNotification(message: string) {
    try {
      console.log('❌ Notification d\'erreur:', message);
    } catch (error) {
      console.warn('⚠️ Erreur envoi notification d\'erreur:', error);
    }
  }

  // ======================================
  // ✅ PROXY DES MÉTHODES DE apiService
  // ======================================

  async createDeclaration(declarationData: any): Promise<Declaration> {
    return apiService.createDeclaration(declarationData);
  }

  async getUserDeclarations(page = 1, limit = 10): Promise<Declaration[]> {
    return apiService.getUserDeclarations(page, limit);
  }

  async getDeclaration(id: string): Promise<Declaration> {
    return apiService.getDeclaration(id);
  }

  async updateDeclaration(id: string, data: any): Promise<Declaration> {
    return apiService.updateDeclaration(id, data);
  }

  async deleteDeclaration(id: string): Promise<void> {
    return apiService.deleteDeclaration(id);
  }

  async login(phoneNumber: string): Promise<any> {
    return apiService.login(phoneNumber);
  }

  async verifyOTP(userId: string, otpCode: string): Promise<any> {
    return apiService.verifyOTP(userId, otpCode);
  }

  async getProfile(): Promise<any> {
    return apiService.getProfile();
  }

  async getAllZones(): Promise<any[]> {
    return apiService.getAllZones();
  }

  async resendOtp(userId: string): Promise<any> {
    return apiService.resendOtp(userId);
  }

  async getDeclarationsStats(): Promise<any> {
    return apiService.getDeclarationsStats();
  }

  async initiatePayment(paymentData: any): Promise<any> {
    return apiService.initiatePayment(paymentData);
  }

  async confirmPayment(transactionId: string, provider: string): Promise<any> {
    return apiService.confirmPayment(transactionId, provider);
  }

  async getPaymentHistory(page = 1, limit = 10): Promise<any> {
    return apiService.getPaymentHistory(page, limit);
  }

  async getUserNotifications(unreadOnly = false, limit = 50): Promise<{ 
    notifications: ApiNotification[]; 
    unreadCount: number 
  }> {
    return apiService.getUserNotifications(unreadOnly, limit);
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    return apiService.markNotificationAsRead(notificationId);
  }

  async markAllNotificationsAsRead(): Promise<number> {
    return apiService.markAllNotificationsAsRead();
  }

  async getSystemHealth(): Promise<any> {
    return apiService.getSystemHealth();
  }

  async getMobileMoneyStatus(): Promise<any> {
    return apiService.getMobileMoneyStatus();
  }

  setToken(token: string): void {
    apiService.setToken(token);
  }

  async logout(): Promise<void> {
    return apiService.logout();
  }

  isAuthenticated(): boolean {
    return apiService.isAuthenticated();
  }

  getToken(): string | null {
    return apiService.getToken();
  }

  // ✅ NOUVELLE MÉTHODE : Simulation améliorée pour tests
  async simulateAdvancedPhotoProcessing(imageUri: string, options?: {
    simulateDelay?: number;
    forceScenario?: number;
    customData?: Partial<ExtractedData>;
  }): Promise<Declaration> {
    const delay = options?.simulateDelay || 3000;
    const forceScenario = options?.forceScenario;
    const customData = options?.customData;

    console.log('🧪 Simulation avancée photo:', { delay, forceScenario, customData });

    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          let extractedData: ExtractedData;
          
          if (customData) {
            // Utiliser les données personnalisées
            extractedData = {
              amount: customData.amount || this.generateRealisticAmount('commerce'),
              period: customData.period || this.getCurrentPeriod(),
              activityType: customData.activityType || 'COMMERCE',
              description: customData.description || 'Simulation personnalisée'
            };
          } else if (forceScenario !== undefined) {
            // Forcer un scénario spécifique
            const scenarios = [
              { amount: 250000, period: this.getCurrentPeriod(), activityType: 'COMMERCE' as const, description: 'Petit commerce' },
              { amount: 450000, period: this.getPreviousPeriod(), activityType: 'ALIMENTATION' as const, description: 'Restaurant' },
              { amount: 350000, period: this.getCurrentPeriod(), activityType: 'SERVICES' as const, description: 'Services divers' }
            ];
            extractedData = scenarios[forceScenario % scenarios.length];
          } else {
            // Simulation normale
            extractedData = await this.simulatePhotoExtraction(imageUri);
          }

          // Créer la déclaration
          const declaration = await apiService.createDeclaration({
            amount: extractedData.amount,
            period: extractedData.period,
            activityType: extractedData.activityType,
            description: `Simulation avancée - ${extractedData.description}`
          });

          resolve(declaration);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }
}

export const unifiedApiService = new UnifiedApiService();