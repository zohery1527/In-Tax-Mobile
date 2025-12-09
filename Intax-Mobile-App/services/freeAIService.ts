// 📁 services/freeAIService.ts
export class FreeAIService {
  // 🆓 OCR gratuit intelligent - SIMULATION
  static async processImage(imageUri: string): Promise<any> {
    console.log('🆓 Processing image with FREE OCR simulation...');
    
    // Simulation réaliste avec délai
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 📊 Scénarios variés basés sur l'URI de l'image
    const scenario = this.getScenarioFromImageUri(imageUri);
    
    return {
      success: true,
      data: scenario,
      message: '✅ Données extraites avec OCR gratuit'
    };
  }

  // 🆓 Reconnaissance vocale simulée intelligente
  static async processVoice(audioUri: string): Promise<any> {
    console.log('🆓 Processing voice with FREE recognition simulation...');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const scenario = this.getScenarioFromAudio();
    
    return {
      success: true,
      transcribedText: scenario.text,
      extractedData: scenario.data,
      message: '✅ Transcription réussie avec reconnaissance gratuite'
    };
  }

  private static getScenarioFromImageUri(imageUri: string): any {
    // Génère des données basées sur le nom/timestamp de l'image
    const timestamp = Date.now();
    const scenarios = [
      {
        amount: 450000,
        period: '2024-01',
        description: 'Facture fournisseur textile',
        activityType: 'COMMERCE',
        confidence: 0.85
      },
      {
        amount: 620000,
        period: '2024-02', 
        description: 'Facture restaurant alimentation',
        activityType: 'ALIMENTATION',
        confidence: 0.82
      },
      {
        amount: 280000,
        period: '2024-03',
        description: 'Facture services réparation',
        activityType: 'SERVICE', 
        confidence: 0.78
      },
      {
        amount: 380000,
        period: '2024-01',
        description: 'Facture matériel artisanat',
        activityType: 'ARTISANAT',
        confidence: 0.80
      }
    ];
    
    // Choisit un scénario basé sur le hash de l'URI
    const hash = this.simpleHash(imageUri);
    return scenarios[hash % scenarios.length];
  }

  private static getScenarioFromAudio(): any {
    const voiceScenarios = [
      {
        text: "J'ai gagné quatre cent cinquante mille ariary en janvier avec mon commerce de vêtements",
        data: {
          amount: 450000,
          period: '2024-01',
          description: 'Commerce vêtements',
          activityType: 'COMMERCE'
        }
      },
      {
        text: "Six cent vingt mille ariary en février pour mon restaurant",
        data: {
          amount: 620000, 
          period: '2024-02',
          description: 'Restaurant alimentation',
          activityType: 'ALIMENTATION'
        }
      },
      {
        text: "Deux cent quatre vingt mille en mars avec mes services de réparation",
        data: {
          amount: 280000,
          period: '2024-03',
          description: 'Services réparation',
          activityType: 'SERVICE'
        }
      }
    ];
    
    return voiceScenarios[Math.floor(Math.random() * voiceScenarios.length)];
  }

  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}