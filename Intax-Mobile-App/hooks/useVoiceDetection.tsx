import { useState } from 'react';
import { Alert } from 'react-native';

// Détection vocale simplifiée pour chiffres
export const useVoiceDetection = () => {
  const [montantDetecte, setMontantDetecte] = useState<number | null>(null);

  // En production, intégrer avec une API de reconnaissance vocale
  const simulerDetection = (commande: string) => {
    const commandes = {
      'iray': 1,
      'roa': 2, 
      'telo': 3,
      'efatra': 4,
      'dimy': 5,
      'enina': 6,
      'fito': 7,
      'valo': 8,
      'sivy': 9,
      'folo': 10,
      'zato': 100,
      'arivo': 1000
    };

    const nombre = commandes[commande as keyof typeof commandes];
    if (nombre) {
      setMontantDetecte(nombre * 100000); // Conversion en Ariary
      return true;
    }
    return false;
  };

  const demarrerEcoute = () => {
    Alert.alert(
      'Hiteny izao',
      'Lazao ny vola nahazoanao amin\'ny teny malagasy',
      [
        { text: 'Aoka', onPress: () => {
          // Simulation - en vrai, démarrer la reconnaissance vocale
          setTimeout(() => {
            const succes = simulerDetection('dimy'); // "dimy" = 500,000 Ar
            if (succes) {
              Alert.alert('Voamarina', `Vola: ${montantDetecte?.toLocaleString()} Ar`);
            }
          }, 2000);
        }},
        { text: 'Tsy', style: 'cancel' }
      ]
    );
  };

  return {
    montantDetecte,
    demarrerEcoute,
    simulerDetection
  };
};