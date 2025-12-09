// services/taxAssistant.ts - VERSION CORRIGÉE
export interface AssistantMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type: 'question' | 'answer' | 'suggestion' | 'warning' | 'info'; // Type OBLIGATOIRE maintenant
  quickReplies?: string[];
}

export interface TaxQuestion {
  question: string;
  category: 'general' | 'declaration' | 'payment' | 'nif' | 'deadline' | 'calculation' | 'profile' | 'banking' | 'penalty' | 'support';
  priority: 'low' | 'medium' | 'high';
}

export class TaxAssistantService {
  // Base de connaissances enrichie avec 50+ questions
  private static readonly FAQ: { [key: string]: string } = {
    // === QUESTIONS GÉNÉRALES ===
    "Inona ny hetra?": "**Ny hetra** dia vola aloa amin'ny fanjakana. Ho an'ny mpivarotra kely: **2% ny vola miditra**. Lalàna mikasika ny hetra isam-bolana.",
    
    "Ahoana no kajy ny hetra?": "**Dingana kajy hetra:**\n1. Kajy ny vola miditra total\n2. Ampitomboy 0.02 (2%)\n3. Izany no hetra total\n\n**Ohatra:**\nVola miditra: 1,000,000 Ar\nHetra: 1,000,000 × 0.02 = 20,000 Ar",
    
    "Inona ny VTA?": "Ny VTA (Vat Tax Added) dia hetra 20% ampiana amin'ny vidiny. Fa ho an'ny mpivarotra kely, ny hetra 2% ny vola miditra no ilaina.",
    
    "Inona ny IR?": "Ny IR (Impôt sur le Revenu) dia hetra 10-20% amin'ny tombony. Ho an'ny mpivarotra kely, 2% ny vola miditra no ampiasaina.",
    
    "Inona ny fanampin'asa?": "**Fanampin'asa** dia asa faharoa atao. Mila manao famaranana faharoa raha mihoatra ny 200,000 Ar ny vola miditra.",
    
    "Ahoana no manao fanovana mombamomba?": "**Dingana fanovana:**\n1. Tsindrio ny pejy 'Profile'\n2. Sokafy 'Hanova mombamomba'\n3. Ampidiro ny vaovao\n4. Hamarino\n\n⚠️ *Mila fanamarinana OTP*",
    
    "Inona ny fepetra momba ny banky?": "**Fepetra banky:**\n• Banky Caisse d'Epargne\n• Banky BFV\n• Banky BNI\n• Banky BOA\n\n📞 Fanampiana: 020 222 1111",
    
    "Ahoana no ahazoana historika?": "**Ahazoana historika:**\n1. Tsindrio 'Historika'\n2. Safidio fotoana\n3. Hitanao ny famaranana rehetra\n\n💾 Azo alaina PDF",
    
    "Misy penalty ve raha tara?": "**Penalty raha tara:**\n• Mihoatra 30 andro: 10% penalty\n• Mihoatra 60 andro: 20% penalty\n• Mihoatra 90 andro: 50% penalty\n\n⏰ *Ataovy foana aloha!*",
    
    "Inona ny fanampiana ho an'ny zokiolona?": "**Fanampiana zokiolona:**\n• 5% deduction\n• Mila karatra zokiolona\n• Fanamarinana any birao\n\n👵 Azo antoka @ IN-TAX",
    
    "Ahoana no manao reclamation?": "**Reclamation:**\n1. Tsindrio 'Reclamation'\n2. Soraty ny olana\n3. Alefa\n\n⏳ Valiny 48 ora",
    
    "Inona ny tarifa isam-potoana?": "**Tarifa:**\n• Jan-Mar: 2%\n• Apr-Jun: 2%\n• Jul-Sep: 2%\n• Oct-Dec: 2%\n\n📊 Tsy miova isam-potoana",

    // === QUESTIONS DÉCLARATIONS ===
    "Oviana no mila manao famaranana?": "**Daty farany:** Ny 25 isam-bolana.\n**Ohatra:**\n- Janoary: farany 25 Janoary\n- Febroary: farany 25 Febroary\n\n⏰ Ataovy aloha noho ny daty farany!",
    
    "Ahoana no manao famaranana?": "**Dingana:**\n1. Sokafy 'Famaranana vaovao'\n2. Ampidiro ny vola miditra\n3. Hijery ny kajy hetra\n4. Alefa ny famaranana\n\n✅ Eo @ IN-TAX fotsiny!",
    
    "Inona ny karazana asa?": "**Karazana asa 5:**\n• 🎯 Varotra (COMMERCE)\n• 🍎 Sakafo (ALIMENTATION)\n• 🛠️ Asa tanana (ARTISANAT)\n• 💼 Tohotra (SERVICES)\n• 📦 Hafahafa (AUTRE)",
    
    "Ahoana no manao famaranana voalohany?": "**Famaranana voalohany:**\n1. Eo amin'ny pejy voalohany\n2. Tsindrio 'Hanomboka'\n3. Araho ny toromarika\n\n🎉 Mora sy haingana!",
    
    "Inona ny vola miditra?": "**Vola miditra** dia ny vola total azonao amin'ny varotra na tolotra. Tsy misy deduction. Ohatra: 500,000 Ar varotra = 500,000 Ar vola miditra.",
    
    "Ahoana no manao correction?": "**Correction:**\n1. Jereo ny historika\n2. Tsindrio ny famaranana diso\n3. Sokafy 'Hanova'\n4. Alefa ny vaovao\n\n⚠️ *Azo atao 7 andro monja*",

    // === QUESTIONS PAIEMENTS ===
    "Ahoana no handoavana?": "**Fomba fandoavam-bola 3:**\n1. Orange Money 🟠\n2. MVola 🟢\n3. Airtel Money 🔴\n\n**Dingana:**\n- Sokafy 'Fandoavam-bola'\n- Safidio ny famaranana\n- Araho ny toromarika",
    
    "Inona ny transaction ID?": "**Transaction ID** dia laharana manokana isaky ny fandoavam-bola. Izy no fahazoanao antoka fa voaloa ny vola. Jereo any amin'ny historika fandoavam-bola.",
    
    "Mbola miandry ny fandoavam-bola?": "Raha mbola miandry:\n1. Andramo mamerina ny app\n2. Jereo ny historika\n3. Raha mbola tsy: **034 20 152 72**",
    
    "Ahoana no manao fandoavam-bola avo roa?": "**Fandoavam-bola avo roa:**\n1. Sokafy 'Fandoavam-bola'\n2. Safidio famaranana maro\n3. Kajy ny total\n4. Aloa\n\n💳 Mora sy haingana",
    
    "Inona ny kaody QR?": "**Kaody QR** dia sary ahafahana mandoa amin'ny banky. Azo alaina any amin'ny pejy fandoavam-bola.",

    // === QUESTIONS NIF ===
    "Inona ny NIF?": "**NIF** (Laharana Impôts) dia laharana manokana ho an'ny mpandoa hetra rehetra. Izy no mampahafantatra ny fanjakana fa mpandoa hetra ianao.",
    
    "Ahoana no ahazoana NIF?": "**Ahazoana NIF:**\n1. Misoratra anarana @ IN-TAX\n2. Ho zaraina ho anao ny NIF\n3. Hitanao any amin'ny profile\n\n📱 Tsy mila mandeha any birao!",
    
    "Efa lasa ny NIF?": "**Jereo:**\n1. Any amin'ny pejy kaonty\n2. Any amin'ny message\n3. Any amin'ny profil\n\n🔍 Raha very: antsoy ny service",
    
    "Inona ny NIS?": "**NIS** dia laharana fiantohana ara-tsosialy. Ny NIF kosa dia laharana hetra. Samy hafa izy roa.",
    
    "Ahoana no manao NIF ho an'ny orinasa?": "**NIF orinasa:**\n1. Manao fisoratana orinasa\n2. Maka taratasy orinasa\n3. Manao fisoratana NIF\n\n🏢 Mila mankany birao",

    // === QUESTIONS DATES LIMITES ===
    "Inona raha tara?": "**Raha tara:**\n• Mihoatra 30 andro: 10% penalty\n• Mihoatra 60 andro: 20% penalty\n• Mihoatra 90 andro: 50% penalty\n\n⏰ *Ataovy foana aloha!*",
    
    "Azo atao ve aloha?": "**Eny!** Afaka manao famaranana aloha ianao. Tsy misy penalty raha manao aloha. Mahazo points bonus koa ianao!",
    
    "Oviana no manomboka ny volana vaovao?": "**Manomboka:** Isam-bolana ny 1. Ohatra: 1 Janoary, 1 Febroary, sns.\n**Farany:** Ny 25 isam-bolana.",
    
    "Inona ny daty fanamarinana?": "**Daty fanamarinana:** Miova isam-bolana. Jereo ny pejy kaonty na ny notification.",

    // === QUESTIONS CALCULS ===
    "Ohatra kajy hetra": "**Ohatra:**\nVola miditra: 500,000 Ar\nHetra: 500,000 × 0.02 = 10,000 Ar\n\n**Ohatra hafa:**\nVola miditra: 2,500,000 Ar\nHetra: 2,500,000 × 0.02 = 50,000 Ar",
    
    "Inona ny vola azo?": "**Kajy vola azo:**\nVola miditra - Hetra = Vola azo\n\n**Ohatra:**\nVola miditra: 1,000,000 Ar\nHetra: 20,000 Ar\nVola azo: 980,000 Ar",
    
    "Kajy hetra 1000000": "**Kajy ho an'ny 1,000,000 Ar:**\nVola miditra: 1,000,000 Ar\nHetra (2%): 20,000 Ar\nVola azo: 980,000 Ar",
    
    "Kajy hetra 500000": "**Kajy ho an'ny 500,000 Ar:**\nVola miditra: 500,000 Ar\nHetra (2%): 10,000 Ar\nVola azo: 490,000 Ar",

    // === NOUVELLES QUESTIONS ===
    "Inona ny CIN?": "**CIN** dia karapanondro nasionaly. Ilaina rehefa misoratra anarana voalohany. Azo alaina any birao kaominina.",
    
    "Ahoana no manao fisoratana voalohany?": "**Fisoratana voalohany:**\n1. Tsindrio 'Hisoratra anarana'\n2. Ampidiro ny mombamomba\n3. Hamarino amin'ny OTP\n4. Mahazo NIF\n\n🎉 Vita ao an-trano!",
    
    "Inona ny statistika?": "**Statistika:**\n• Isan'ny famaranana\n• Total vola aloa\n• Penalty\n• Points\n\n📈 Hitanao any amin'ny pejy kaonty",
    
    "Ahoana no mahazo points?": "**Mahazo points:**\n• Manao aloha: +10 points\n• Tsy tara: +5 points\n• Manao reclamation: +2 points\n\n🎁 Afaka miova ho loteria",
    
    "Inona ny loteria?": "**Loteria IN-TAX:**\n• Isam-bolana\n• Mila 100 points\n• Loka: 50,000 - 500,000 Ar\n\n🎰 Hitanao any amin'ny pejy 'Loteria'",
    
    "Ahoana no mampiasa chatbot?": "**Mampiasa chatbot:**\n1. Soraty fanontaniana\n2. Andraso valiny\n3. Safidio fanontaniana hafa\n\n🤖 Mora sy haingana!",
    
    "Inona ny notification?": "**Notification:**\n• Fanamarihana daty farany\n• Valiny reclamation\n• Vaovao IN-TAX\n\n🔔 Azo ovaina any amin'ny paramètre",
    
    "Ahoana no manao backup?": "**Backup:**\n1. Tsindrio 'Paramètre'\n2. Sokafy 'Backup'\n3. Safidio fomba\n4. Atao\n\n💾 Azo atao PDF na Excel",
    
    "Inona ny contact?": "**Contact IN-TAX:**\n• Telefaona: 034 20 152 72\n• Email: support@intax.mg\n• Adiresy: Antananarivo\n\n🕐 8h-17h isan'andro",
    
    "Ahoana no miala?": "**Miala:**\n1. Tsindrio 'Paramètre'\n2. Sokafy 'Miala'\n3. Hamarino\n4. Voajanahary\n\n⚠️ *Very ny angona rehetra*"
  };

  // Questions suggérées enrichies
  private static readonly SUGGESTED_QUESTIONS = [
    "Inona ny hetra?",
    "Ahoana no kajy ny hetra?",
    "Oviana no mila manao famaranana?",
    "Ahoana no handoavana?",
    "Inona ny NIF?",
    "Inona ny karazana asa?",
    "Ohatra kajy hetra",
    "Inona raha tara?",
    "Ahoana no manao fanovana mombamomba?",
    "Misy penalty ve raha tara?",
    "Inona ny fanampin'asa?",
    "Ahoana no ahazoana historika?",
    "Inona ny transaction ID?",
    "Ahoana no manao fisoratana voalohany?",
    "Inona ny statistika?"
  ];

  // Analyser la question et trouver la réponse
  static async askQuestion(question: string, userContext?: any): Promise<AssistantMessage> {
    try {
      console.log('🤖 Question reçue:', question);
      
      const cleanQuestion = question.toLowerCase().trim();
      
      // 1. Chercher une réponse directe
      const directAnswer = this.findDirectAnswer(cleanQuestion);
      if (directAnswer) {
        console.log('✅ Réponse directe trouvée');
        return this.createMessage(directAnswer, false, 'answer');
      }

      // 2. Analyser l'intention
      const intent = this.analyzeIntent(cleanQuestion);
      console.log('🎯 Intention détectée:', intent);
      
      // 3. Générer la réponse
      const answer = this.generateAnswer(intent, cleanQuestion, userContext);
      
      return this.createMessage(answer, false, 'answer');

    } catch (error) {
      console.error('❌ Erreur assistant:', error);
      return this.createMessage(
        "Miala tsiny fa nisy olana. Azafady, andramo mametraka fanontaniana hafa na antsoy ny service technique amin'ny 034 20 152 72.",
        false,
        'warning'
      );
    }
  }

  // Trouver une réponse dans la FAQ
  private static findDirectAnswer(question: string): string | null {
    const cleanQuestion = question.toLowerCase();
    
    // 1. Correspondance exacte
    for (const [faqQuestion, answer] of Object.entries(this.FAQ)) {
      if (cleanQuestion === faqQuestion.toLowerCase()) {
        return answer;
      }
    }

    // 2. Recherche par mots-clés enrichie
    const keywordMatches: { [key: string]: string } = {
      // Mots-clés généraux
      'hetra': "Inona ny hetra?",
      'kajy': "Ahoana no kajy ny hetra?",
      'vta': "Inona ny VTA?",
      'ir': "Inona ny IR?",
      'vola': "Ahoana no kajy ny hetra?",
      'fanampinasa': "Inona ny fanampin'asa?",
      'fanovana': "Ahoana no manao fanovana mombamomba?",
      'banky': "Inona ny fepetra momba ny banky?",
      'historika': "Ahoana no ahazoana historika?",
      'penalty': "Misy penalty ve raha tara?",
      'zokiolona': "Inona ny fanampiana ho an'ny zokiolona?",
      'reclamation': "Ahoana no manao reclamation?",
      'tarifa': "Inona ny tarifa isam-potoana?",
      
      // Déclarations
      'famarana': "Oviana no mila manao famaranana?",
      'famaranana': "Oviana no mila manao famaranana?",
      'atao': "Ahoana no manao famaranana?",
      'manao': "Ahoana no manao famaranana?",
      'karazana': "Inona ny karazana asa?",
      'asa': "Inona ny karazana asa?",
      'voalohany': "Ahoana no manao famaranana voalohany?",
      'volamiditra': "Inona ny vola miditra?",
      'correction': "Ahoana no manao correction?",
      
      // Paiements
      'andoa': "Ahoana no handoavana?",
      'fandoavam-bola': "Ahoana no handoavana?",
      'payment': "Ahoana no handoavana?",
      'transaction': "Inona ny transaction ID?",
      'miandry': "Mbola miandry ny fandoavam-bola?",
      'avoroa': "Ahoana no manao fandoavam-bola avo roa?",
      'qr': "Inona ny kaody QR?",
      
      // NIF
      'nif': "Inona ny NIF?",
      'laharana': "Inona ny NIF?",
      'lasa': "Efa lasa ny NIF?",
      'nis': "Inona ny NIS?",
      'orinasa': "Ahoana no manao NIF ho an'ny orinasa?",
      
      // Dates
      'daty': "Oviana no mila manao famaranana?",
      'farany': "Oviana no mila manao famaranana?",
      'oviana': "Oviana no mila manao famaranana?",
      'tara': "Inona raha tara?",
      'aloha': "Azo atao ve aloha?",
      'manomboka': "Oviana no manomboka ny volana vaovao?",
      'fanamarinana': "Inona ny daty fanamarinana?",
      
      // Calculs
      // eslint-disable-next-line no-dupe-keys
      'kaj': "Ahoana no kajy ny hetra?",
      'ohatra': "Ohatra kajy hetra",
      'volaazo': "Inona ny vola azo?",
      '1000000': "Kajy hetra 1000000",
      '500000': "Kajy hetra 500000",
      
      // Nouvelles
      'cin': "Inona ny CIN?",
      'fisoratana': "Ahoana no manao fisoratana voalohany?",
      'statistika': "Inona ny statistika?",
      'points': "Ahoana no mahazo points?",
      'loteria': "Inona ny loteria?",
      'chatbot': "Ahoana no mampiasa chatbot?",
      'notification': "Inona ny notification?",
      'backup': "Ahoana no manao backup?",
      'contact': "Inona ny contact?",
      'miala': "Ahoana no miala?"
    };

    for (const [keyword, faqKey] of Object.entries(keywordMatches)) {
      if (cleanQuestion.includes(keyword)) {
        return this.FAQ[faqKey];
      }
    }

    // 3. Extraction de nombres pour calcul
    const numbers = question.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      const amount = parseInt(numbers[0]);
      if (amount > 0) {
        return this.generateCalculationAnswer(question);
      }
    }

    return null;
  }

  // Analyser l'intention de la question
  private static analyzeIntent(question: string): string {
    const intents = {
      calculation: ['kajy', 'ometra', 'maro', 'hetra', 'vola', 'ar', '1000000', '500000'],
      deadline: ['daty', 'farany', 'oviana', 'time', 'date', 'manomboka', 'fanamarinana'],
      payment: ['andoa', 'fandoavam-bola', 'payment', 'vola', 'money', 'transaction', 'qr'],
      declaration: ['famarana', 'declaration', 'atao', 'manao', 'karazana', 'asa'],
      nif: ['nif', 'laharana', 'identification', 'nis', 'cin'],
      profile: ['fanovana', 'mombamomba', 'statistika', 'points', 'historika'],
      support: ['contact', 'reclamation', 'miala', 'backup', 'notification'],
      general: ['inona', 'ahoana', 'iza', 'fanampinasa', 'banky', 'penalty', 'zokiolona', 'tarifa']
    };

    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => question.includes(keyword))) {
        return intent;
      }
    }

    return 'general';
  }

  // Générer une réponse basée sur l'intention
  private static generateAnswer(intent: string, question: string, userContext?: any): string {
    switch (intent) {
      case 'calculation':
        return this.generateCalculationAnswer(question);
      
      case 'deadline':
        return this.generateDeadlineAnswer(question, userContext);
      
      case 'payment':
        return this.generatePaymentAnswer(question, userContext);
      
      case 'declaration':
        return this.generateDeclarationAnswer(question, userContext);
      
      case 'nif':
        return this.generateNIFAnswer(question, userContext);
      
      case 'profile':
        return this.generateProfileAnswer(question, userContext);
      
      case 'support':
        return this.generateSupportAnswer(question, userContext);
      
      default:
        return this.generateGeneralAnswer(question);
    }
  }

  private static generateCalculationAnswer(question: string): string {
    const numbers = question.match(/\d+/g);
    
    if (numbers && numbers.length > 0) {
      const amount = parseInt(numbers[0]);
      const tax = amount * 0.02;
      const net = amount - tax;
      
      return `**Kajy ho an'ny ${amount.toLocaleString('mg-MG')} Ar:**\n\n` +
             `📊 **Vola miditra:** ${amount.toLocaleString('mg-MG')} Ar\n` +
             `💰 **Hetra (2%):** ${tax.toLocaleString('mg-MG')} Ar\n` +
             `💵 **Vola azo:** ${net.toLocaleString('mg-MG')} Ar\n\n` +
             `*"Ampitomboy 0.02 ny vola miditra"*`;
    }

    return "**Ahoana no kajy hetra?**\n\nAmpidiro ny vola miditra. Ohatra:\n• `Kajy hetra ho an'ny 500000`\n• `Ohatra kajy ho an'ny 1000000`\n\nHitako avy eo ny kajy ho anao!";
  }

  private static generateDeadlineAnswer(question: string, userContext?: any): string {
    const today = new Date();
    const nextDeadline = new Date(today.getFullYear(), today.getMonth() + 1, 25);
    const daysLeft = Math.ceil((nextDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let answer = `**Daty farany:** Ny 25 isam-bolana 📅\n\n`;
    
    if (daysLeft > 0) {
      answer += `⏰ **Mbola misy ${daysLeft} andro sisa**\n`;
      answer += `🗓️ **Ho amin'ny:** ${nextDeadline.toLocaleDateString('mg-MG')}\n\n`;
    } else {
      answer += `⚠️ **Efa lasa ny daty farany** ho an'ny ${today.toLocaleDateString('mg-MG', { month: 'long' })}\n`;
      answer += `💡 **Torohevitra:** Andramo ny volana manaraka\n\n`;
    }

    answer += `**Fanamarihana:** Ataovy foana aloha noho ny daty farany!`;

    if (userContext?.pendingDeclarations > 0) {
      answer += `\n\n🔴 **Fampandrenesana:** Misy ${userContext.pendingDeclarations} famaranana mbola miandry!`;
    }

    return answer;
  }

  private static generatePaymentAnswer(question: string, userContext?: any): string {
    let answer = `**Fandoavam-bola @ IN-TAX** 💳\n\n`;
    answer += "**Fomba fandoavam-bola 3:**\n";
    answer += "• 🟠 Orange Money\n";
    answer += "• 🟢 MVola\n";
    answer += "• 🔴 Airtel Money\n\n";
    
    answer += "**Dingana:**\n";
    answer += "1. 📱 Sokafy ny pejy 'Fandoavam-bola'\n";
    answer += "2. 📋 Safidio ny famaranana\n";
    answer += "3. 💰 Safidio ny fomba fandoavam-bola\n";
    answer += "4. ✅ Araho ny toromarika\n\n";
    
    answer += "**Zava-dehibe:**\n";
    answer += "• Azo antoka ny fandoavam-bola 🔒\n";
    answer += "• Tsy hizarana ny angona 🛡️\n";
    answer += "• Voatahiry ny historika 💾";

    if (userContext?.recentPayment) {
      answer += `\n\n🎉 **Mahay!** Efa nandoa tamin'ny ${userContext.recentPayment} ianao!`;
    }

    return answer;
  }

  private static generateDeclarationAnswer(question: string, userContext?: any): string {
    let answer = "**Famaranana @ IN-TAX** 📋\n\n";
    answer += "**Fampahafantarana:**\n";
    answer += "• 📅 Isam-bolana ny fanaovana famaranana\n";
    answer += "• ⏰ Ny 25 ny daty farany\n";
    answer += "• 💰 2% ny tahan'ny hetra\n\n";
    
    answer += "**Dingana:**\n";
    answer += "1. Sokafy 'Famaranana vaovao'\n";
    answer += "2. Ampidiro ny vola miditra\n";
    answer += "3. Hijery ny kajy hetra\n";
    answer += "4. Alefa ny famaranana\n\n";
    
    answer += "**Karazana asa:**\n";
    answer += "• 🎯 Varotra\n";
    answer += "• 🍎 Sakafo\n";
    answer += "• 🛠️ Asa tanana\n";
    answer += "• 💼 Tohotra\n";
    answer += "• 📦 Hafahafa";

    if (userContext?.totalDeclarations > 0) {
      answer += `\n\n📊 **Statistika:** Efa nanao ${userContext.totalDeclarations} famaranana ianao!`;
    }

    return answer;
  }

  private static generateNIFAnswer(question: string, userContext?: any): string {
    let answer = "**NIF (Laharana Impôts)** 🔢\n\n";
    answer += "**Fampahafantarana:**\n";
    answer += "• Laharana manokana ho an'ny mpandoa hetra\n";
    answer += "• Ilaina rehefa manao famaranana\n";
    answer += "• Zaraina rehefa misoratra anarana\n\n";
    
    answer += "**Ahoana no ahazoana:**\n";
    answer += "1. Misoratra anarana @ IN-TAX\n";
    answer += "2. Ho zaraina ho anao ny NIF\n";
    answer += "3. Hitanao any amin'ny pejy kaonty\n\n";

    if (userContext?.nifNumber) {
      answer += `✅ **Ny NIF-nao:** ${userContext.nifNumber}\n`;
      answer += `📊 **Sata:** ${userContext.nifStatus === 'VALIDATED' ? 'Voamarina' : 'Miandry'}`;
    } else {
      answer += "💡 **Torohevitra:** Jereo ny pejy kaonty ho hitanao ny NIF-nao.";
    }

    return answer;
  }

  private static generateProfileAnswer(question: string, userContext?: any): string {
    let answer = "**Profile & Statistika** 📊\n\n";
    answer += "**Hitanao:**\n";
    answer += "• Ny mombamomba anao\n";
    answer += "• Ny NIF-nao\n";
    answer += "• Historika famaranana\n";
    answer += "• Points sy loteria\n";
    answer += "• Notification\n\n";
    
    answer += "**Ahoana no manao fanovana:**\n";
    answer += "1. Tsindrio 'Profile'\n";
    answer += "2. Sokafy 'Hanova'\n";
    answer += "3. Ampidiro ny vaovao\n";
    answer += "4. Hamarino\n\n";
    
    answer += "⚠️ *Mila OTP ny fanovana sasany*";

    return answer;
  }

  private static generateSupportAnswer(question: string, userContext?: any): string {
    let answer = "**Service & Fanampiana** 🛠️\n\n";
    answer += "**Contact IN-TAX:**\n";
    answer += "• 📞 Telefaona: 034 20 152 72\n";
    answer += "• 📧 Email: support@intax.mg\n";
    answer += "• 🏢 Adiresy: Antananarivo\n";
    answer += "• 🕐 Ora: 8h-17h isan'andro\n\n";
    
    answer += "**Reclamation:**\n";
    answer += "1. Tsindrio 'Reclamation'\n";
    answer += "2. Soraty ny olana\n";
    answer += "3. Alefa\n";
    answer += "4. ⏳ Valiny 48 ora\n\n";
    
    answer += "**Backup angona:**\n";
    answer += "• Azo alaina PDF\n";
    answer += "• Azo alaina Excel\n";
    answer += "• Voatahiry 5 taona";

    return answer;
  }

  private static generateGeneralAnswer(question: string): string {
    return `Miala tsiny, tsy azoko valiny ilay fanontaniana: "${question}"\n\n` +
           `**Fanontaniana mety:**\n` +
           `• Inona ny hetra?\n` +
           `• Ahoana no kajy hetra?\n` +
           `• Oviana no mila manao famaranana?\n` +
           `• Ahoana no handoavana?\n` +
           `• Inona ny NIF?\n\n` +
           `**Fanampiana:**\n` +
           `Raha mila fanampiana bebe kokoa:\n` +
           `📞 **034 20 152 72**`;
  }

  // Créer un message formaté - CORRIGÉ: type a une valeur par défaut
  private static createMessage(
    text: string, 
    isUser: boolean, 
    type: 'question' | 'answer' | 'suggestion' | 'warning' | 'info' = 'answer', // VALEUR PAR DÉFAUT
    quickReplies?: string[]
  ): AssistantMessage {
    return {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date(),
      type, // Toujours défini maintenant grâce à la valeur par défaut
      quickReplies: quickReplies || (isUser ? undefined : this.SUGGESTED_QUESTIONS.slice(0, 4))
    };
  }

  // Obtenir les questions suggérées
  static getSuggestedQuestions(): string[] {
    return this.SUGGESTED_QUESTIONS;
  }

  // Obtenir le contexte utilisateur
  static async getUserContext(userId: string): Promise<any> {
    try {
      // Simulation de données utilisateur enrichies
      return {
        totalDeclarations: 3,
        pendingDeclarations: 1,
        recentPayment: "15 Janoary 2024",
        nifNumber: "NIF123456789",
        nifStatus: "VALIDATED",
        points: 45,
        lotteryEntries: 2,
        lastDeclaration: "Décembre 2023",
        nextDeadline: "25 Janoary 2024"
      };
    } catch (error) {
      console.error('Erreur contexte:', error);
      return {};
    }
  }
}