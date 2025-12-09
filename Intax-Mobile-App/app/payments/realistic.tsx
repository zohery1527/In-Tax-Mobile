import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import ProfessionalLayout from '../../components/ProfessionalLayout';
import { useAuth } from '../../contexts/AuthContext';
import { Declaration as ApiDeclaration, apiService, PaymentProvider } from '../../services/api';

// ✅ TYPES
type Declaration = ApiDeclaration & {
  description?: string;
  source?: string;
  amount?: number;
  paidAmount?: number;
  remainingAmount?: number;
  taxAmount?: number;
  period?: string;
  activityType?: string;
};

type PaymentStep = 'DETAILS' | 'PROVIDER_SELECTION' | 'REDIRECTION' | 'PIN_ENTRY' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

// ✅ MAPPING
const ACTIVITY_TYPES_MG: Record<string, string> = {
  'COMMERCE': 'Varotra',
  'ALIMENTATION': 'Sakafo',
  'ARTISANAT': 'Asa tanana',
  'SERVICES': 'Tohotra',
  'SERVICE': 'Tohotra',
  'AUTRE': 'Hafa'
};

const getActivityType = (activityType: string | undefined): string => {
  if (!activityType) return 'Tsy fantatra';
  return ACTIVITY_TYPES_MG[activityType] || activityType;
};

const formatPeriod = (period: string | undefined): string => {
  if (!period) return 'Tsy fantatra';
  const [year, month] = period.split('-');
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const monthName = months[parseInt(month, 10) - 1] || month;
  return `${monthName} ${year}`;
};

export default function RealisticPaymentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const params = useLocalSearchParams<{
    declarationId?: string;
    declarationData?: string;
  }>();
  
  const { declarationId, declarationData } = params;
  
  const [declaration, setDeclaration] = useState<Declaration | null>(null);
  const [currentStep, setCurrentStep] = useState<PaymentStep>('DETAILS');
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('ORANGE_MONEY');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [pinAttempts, setPinAttempts] = useState(0);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false); // ✅ AJOUT: Suivi de l'état

  const providers = [
    {
      id: 'ORANGE_MONEY',
      name: 'Orange Money',
      color: '#FF6600',
      icon: '🟠',
      description: 'Fandoavana azo antoka amin\'ny kaontinao Orange Money'
    },
    {
      id: 'MVOLA',
      name: 'Mvola',
      color: '#00A859', 
      icon: '🟢',
      description: 'Fandoavana azo antoka amin\'ny kaontinao Mvola'
    },
    {
      id: 'AIRTEL_MONEY',
      name: 'Airtel Money',
      color: '#ED1C24',
      icon: '🔴',
      description: 'Fandoavana azo antoka amin\'ny kaontinao Airtel Money'
    }
  ];

  useEffect(() => {
    loadDeclaration();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // ✅ CHARGEMENT
  const loadDeclaration = async () => {
    try {
      let declarationToUse: Declaration | null = null;

      if (declarationData) {
        try {
          declarationToUse = JSON.parse(declarationData);
        } catch (error) {
          console.error('❌ Erreur parsing declarationData:', error);
        }
      } else if (declarationId) {
        try {
          const response = await apiService.getDeclaration(declarationId);
          if (response) {
            declarationToUse = response;
          }
        } catch (error) {
          console.error('❌ Erreur API getDeclaration:', error);
        }
      }

      if (declarationToUse) {
        declarationToUse = {
          ...declarationToUse,
          amount: Number(declarationToUse.amount) || 0,
          taxAmount: Number(declarationToUse.taxAmount) || 0,
          paidAmount: Number(declarationToUse.paidAmount) || 0,
          remainingAmount: Number(declarationToUse.remainingAmount) || 
                          (Number(declarationToUse.taxAmount) - Number(declarationToUse.paidAmount)) || 0
        };
        setDeclaration(declarationToUse);
      } else {
        throw new Error('Tsy hita ny famaranana');
      }
    } catch (error) {
      console.error('❌ Erreur loadDeclaration:', error);
      Alert.alert('Hadisoana', 'Tsy afaka maka ny famaranana');
    } finally {
      setLoading(false);
    }
  };

  // ✅ SIMULATION
  const simulateProviderRedirection = (providerId: PaymentProvider) => {
    setSelectedProvider(providerId);
    setCurrentStep('REDIRECTION');
    
    setTimeout(() => {
      setCurrentStep('PIN_ENTRY');
      setShowPinModal(true);
      setPin('');
      setPinAttempts(0);
    }, 1000);
  };

  // ✅ INITIATION
  const initiatePayment = async (): Promise<{ success: boolean; transactionId?: string }> => {
    if (!declaration) {
      return { success: false };
    }

    try {
      const amount = declaration.remainingAmount || declaration.taxAmount || 0;

      const paymentData = {
        declarationId: declaration.id,
        provider: selectedProvider,
        paymentAmount: amount,
      };

      console.log('💳 Initiating payment with data:', paymentData);
      
      const result = await apiService.initiatePayment(paymentData);
      console.log('✅ Payment initiation response:', result);
      
      if (result?.success) {
        return { 
          success: true, 
          transactionId: result.transactionId || result.data?.transactionId || `SIM_${Date.now()}`
        };
      } else {
        throw new Error(result?.message || 'Erreur lors de l\'initiation du paiement');
      }
      
    } catch (error: any) {
      console.error('❌ Payment initiation error:', error);
      throw error;
    }
  };

  // ✅ CONFIRMATION - CORRIGÉE POUR GÉRER "DÉJÀ CONFIRMÉ"
  const confirmPayment = async (transactionId: string): Promise<boolean> => {
    try {
      const confirmData = {
        transactionId,
        provider: selectedProvider
      };

      console.log('✅ Confirming payment with data:', confirmData);
      
      const result = await apiService.confirmPayment(confirmData);
      console.log('✅ Payment confirmation response:', result);
      
      if (result?.success) {
        return true;
      } else if (result?.message?.includes('déjà confirmé') || 
                 result?.message?.includes('already confirmed')) {
        console.log('⚠️ Paiement déjà confirmé, marqué comme succès');
        setIsPaymentConfirmed(true); // ✅ Marquer comme déjà confirmé
        return true; // Considérer comme succès
      }
      
      return false;
      
    } catch (error: any) {
      if (error.message?.includes('déjà confirmé') || 
          error.message?.includes('already confirmed')) {
        console.log('⚠️ Paiement déjà confirmé, continuation...');
        setIsPaymentConfirmed(true); // ✅ Marquer comme déjà confirmé
        return true; // Considérer comme succès
      }
      
      console.error('❌ Payment confirmation error:', error);
      throw error;
    }
  };

  // ✅ GESTION COMPLÈTE - CORRIGÉE
  const handleCompletePayment = async () => {
    if (pin.length !== 4) {
      Alert.alert('PIN tsy mety', 'Mila isa 4 ny PIN');
      return;
    }

    if (pinAttempts >= 3) {
      Alert.alert('Tentatives tapitra', 'Nihoatra ny 3 andrana ianao. Avereno amin\'ny dingana voalohany.');
      setShowPinModal(false);
      setCurrentStep('PROVIDER_SELECTION');
      setPin('');
      setPinAttempts(0);
      return;
    }

    setShowPinModal(false);
    setCurrentStep('PROCESSING');
    setProcessing(true);
    setPinAttempts(prev => prev + 1);

    try {
      console.log('🔄 Début du processus de paiement...');

      // 1. Initier le paiement
      const initiationResult = await initiatePayment();
      
      if (!initiationResult.success || !initiationResult.transactionId) {
        throw new Error('Tsy afaka nanomboka ny fandoavana');
      }

      const transactionId = initiationResult.transactionId;
      setTransactionId(transactionId);
      console.log('✅ Paiement initié avec transactionId:', transactionId);

      // 2. VÉRIFIER SI DÉJÀ CONFIRMÉ (optionnel)
      if (isPaymentConfirmed) {
        console.log('ℹ️ Paiement déjà marqué comme confirmé, redirection directe');
        setCurrentStep('SUCCESS');
        redirectToConfirmation(transactionId);
        return;
      }

      // 3. Court délai pour UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 4. Confirmer le paiement (UNE SEULE FOIS)
      const confirmationSuccess = await confirmPayment(transactionId);
      
      if (!confirmationSuccess) {
        throw new Error('Tsy afaka nanamafy ny fandoavana');
      }

      console.log('🎉 Paiement confirmé avec succès!');
      setCurrentStep('SUCCESS');

      // 5. Redirection
      redirectToConfirmation(transactionId);
      
    } catch (error: any) {
      console.error('❌ Erreur dans le processus de paiement:', error);
      setCurrentStep('FAILED');
      
      let errorMessage = error.message || 'Nisy olana ny fandoavana. Andramo indray.';
      
      Alert.alert(
        'Hadisoana', 
        errorMessage,
        [
          { 
            text: 'Andramo indray', 
            onPress: () => {
              setCurrentStep('PROVIDER_SELECTION');
              setPin('');
              setPinAttempts(0);
            }
          },
          { text: 'Hiverina', onPress: handleGoHome }
        ]
      );
    } finally {
      setProcessing(false);
      setPin('');
    }
  };

  // ✅ REDIRECTION VERS CONFIRMATION
  const redirectToConfirmation = (transactionId: string) => {
    setTimeout(() => {
      router.push({
        pathname: '/payments/confirm',
        params: { 
          transactionId: transactionId,
          provider: selectedProvider.toLowerCase(),
          amount: (declaration?.remainingAmount || 0).toString(),
          declarationId: declaration?.id || '',
          alreadyConfirmed: isPaymentConfirmed ? 'true' : 'false'
        }
      });
    }, 1500);
  };

  // ✅ RETOUR ACCUEIL
  const handleGoHome = () => {
    Alert.alert(
      'Hiverina any amin\'ny fandraisana?',
      'Hamerina anao any amin\'ny pejy fandraisana ianao.',
      [
        {
          text: 'Tsy',
          style: 'cancel'
        },
        {
          text: 'Eny',
          onPress: () => router.push('/(tabs)/accueil')
        }
      ]
    );
  };

  // ✅ GESTION PIN
  const handlePinChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    setPin(numericText);
    
    // ✅ OPTIONNEL: Soumission automatique quand 4 chiffres
    if (numericText.length === 4) {
      setTimeout(() => {
        handleCompletePayment();
      }, 300);
    }
  };

  const getStepProgress = () => {
    const steps = ['DETAILS', 'PROVIDER_SELECTION', 'REDIRECTION', 'PIN_ENTRY', 'PROCESSING', 'SUCCESS'];
    const currentIndex = steps.indexOf(currentStep);
    return currentIndex >= 0 ? ((currentIndex + 1) / steps.length) * 100 : 0;
  };

  // ✅ CARTE PROVIDER
  const ProviderCard = ({ provider }: any) => (
    <TouchableOpacity
      style={[
        styles.providerCard,
        { borderColor: provider.color }
      ]}
      onPress={() => simulateProviderRedirection(provider.id)}
    >
      <View style={[styles.providerIcon, { backgroundColor: provider.color }]}>
        <Text style={styles.providerIconText}>{provider.icon}</Text>
      </View>
      <View style={styles.providerInfo}>
        <Text style={styles.providerName}>{provider.name}</Text>
        <Text style={styles.providerDescription}>{provider.description}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  // ✅ MODAL D'ENTRÉE DU PIN - CORRIGÉ
  const PinEntryModal = () => (
    <Modal
      visible={showPinModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setShowPinModal(false);
        setCurrentStep('PROVIDER_SELECTION');
        setPin('');
        setPinAttempts(0);
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ampidiro ny PIN</Text>
            <Text style={styles.modalSubtitle}>
              {selectedProvider === 'ORANGE_MONEY' ? 'Orange Money' : 
               selectedProvider === 'MVOLA' ? 'Mvola' : 'Airtel Money'}
            </Text>
            {pinAttempts > 0 && (
              <Text style={styles.pinAttempts}>
                Andrana {pinAttempts}/3
              </Text>
            )}
          </View>

          <View style={styles.pinContainer}>
            <Text style={styles.pinLabel}>Kaody PIN 4 isa</Text>
            <Text style={styles.pinAmount}>
              Vola: {(declaration?.remainingAmount || 0).toLocaleString('mg-MG')} Ar
            </Text>
            
            <View style={styles.pinInputContainer}>
              <TextInput
                style={styles.pinInput}
                value={pin}
                onChangeText={handlePinChange}
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                placeholder="1234"
                textAlign="center"
                autoFocus
                editable={!processing}
              />
            </View>

            <View style={styles.pinDotsContainer}>
              {[0, 1, 2, 3].map((index) => (
                <View
                  key={index}
                  style={[
                    styles.pinDot,
                    index < pin.length && styles.pinDotFilled
                  ]}
                />
              ))}
            </View>

            <Text style={styles.pinHint}>
              {processing ? 'Eo am-pandinihana...' : 'Apidiro 4 isa ary tsindrio "Hamarinina"'}
            </Text>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.cancelButton, processing && styles.buttonDisabled]}
              onPress={() => {
                if (!processing) {
                  setShowPinModal(false);
                  setCurrentStep('PROVIDER_SELECTION');
                  setPin('');
                  setPinAttempts(0);
                }
              }}
              disabled={processing}
            >
              <Text style={styles.cancelButtonText}>Aoka ihany</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.confirmButton, 
                     (pin.length !== 4 || processing) && styles.confirmButtonDisabled]}
              onPress={handleCompletePayment}
              disabled={pin.length !== 4 || processing}
            >
              {processing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.confirmButtonText}>
                  Hamarinina
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ✅ ÉTAT DE CHARGEMENT
  if (loading) {
    return (
      <ProfessionalLayout title="Fandoavana Azo Antoka">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Eo am-pakiana ny famaranana...</Text>
        </View>
      </ProfessionalLayout>
    );
  }

  // ✅ ÉTAT SANS DÉCLARATION
  if (!declaration) {
    return (
      <ProfessionalLayout title="Fandoavana Azo Antoka">
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>❌</Text>
          <Text style={styles.emptyTitle}>Tsy hita ny famaranana</Text>
          <Text style={styles.emptyText}>
            Misy olana ny fandraisana ny famaranana.
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Hiverina</Text>
          </TouchableOpacity>
        </View>
      </ProfessionalLayout>
    );
  }

  const amount = declaration.remainingAmount || declaration.taxAmount || 0;
  const activityType = getActivityType(declaration.activityType);
  const period = formatPeriod(declaration.period);

  return (
    <ProfessionalLayout title="Fandoavana Azo Antoka">
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Barre de progression */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${getStepProgress()}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              Dingana {['DETAILS', 'PROVIDER_SELECTION', 'REDIRECTION', 'PIN_ENTRY', 'PROCESSING', 'SUCCESS'].indexOf(currentStep) + 1} amin&apos;ny 6
            </Text>
          </View>

          {/* ÉTAPE 1: Détails */}
          {currentStep === 'DETAILS' && (
            <View style={styles.stepContainer}>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionIcon}>📄</Text>
                  <Text style={styles.sectionTitle}>ANTSIPIRIHAN&apos;NY FAMARANANA</Text>
                </View>
                
                <View style={styles.detailsCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Volana hetra:</Text>
                    <Text style={styles.detailValue}>{period}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Karazana asa:</Text>
                    <Text style={styles.detailValue}>{activityType}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Vola nidina:</Text>
                    <Text style={styles.detailValue}>{(declaration.amount || 0).toLocaleString('mg-MG')} Ar</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Hetra (2%):</Text>
                    <Text style={styles.detailValue}>{(declaration.taxAmount || 0).toLocaleString('mg-MG')} Ar</Text>
                  </View>
                  {declaration.paidAmount && declaration.paidAmount > 0 && (
                    <>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Efa voaloa:</Text>
                        <Text style={styles.detailValue}>{declaration.paidAmount.toLocaleString('mg-MG')} Ar</Text>
                      </View>
                      <View style={[styles.detailRow, styles.remainingRow]}>
                        <Text style={[styles.detailLabel, styles.remainingLabel]}>Mbola tokony haloa:</Text>
                        <Text style={[styles.detailValue, styles.remainingValue]}>
                          {amount.toLocaleString('mg-MG')} Ar
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </View>

              <View style={styles.actionsContainer}>
                <TouchableOpacity 
                  style={styles.continueButton}
                  onPress={() => setCurrentStep('PROVIDER_SELECTION')}
                >
                  <Text style={styles.continueButtonText}>Manohy</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.secondaryButton}
                  onPress={handleGoHome}
                >
                  <Text style={styles.secondaryButtonText}>Hiverina</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ÉTAPE 2: Sélection provider */}
          {currentStep === 'PROVIDER_SELECTION' && (
            <View style={styles.stepContainer}>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionIcon}>💳</Text>
                  <Text style={styles.sectionTitle}>SAFIDY FOMBA FANDOAVANA</Text>
                </View>
                
                <Text style={styles.selectionDescription}>
                  Safidio ny mpampiasa mobile money
                </Text>

                <View style={styles.providersList}>
                  {providers.map((provider) => (
                    <ProviderCard key={provider.id} provider={provider} />
                  ))}
                </View>
              </View>

              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => setCurrentStep('DETAILS')}
              >
                <Text style={styles.secondaryButtonText}>Hiverina</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ÉTAPE 3: Redirection */}
          {currentStep === 'REDIRECTION' && (
            <View style={styles.stepContainer}>
              <View style={styles.redirectionContainer}>
                <ActivityIndicator size="large" color="#3498db" />
                <Text style={styles.redirectionTitle}>
                  Mitondra any amin&apos;ny {
                    selectedProvider === 'ORANGE_MONEY' ? 'Orange Money' : 
                    selectedProvider === 'MVOLA' ? 'Mvola' : 'Airtel Money'
                  }...
                </Text>
              </View>
            </View>
          )}

          {/* ÉTAPE 4: PIN (Modal) */}
          {currentStep === 'PIN_ENTRY' && <PinEntryModal />}

          {/* ÉTAPE 5: Traitement */}
          {currentStep === 'PROCESSING' && (
            <View style={styles.stepContainer}>
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#27ae60" />
                <Text style={styles.processingTitle}>Eo am-pandinihana</Text>
                <Text style={styles.processingText}>
                  Andraso kely...
                </Text>
              </View>
            </View>
          )}

          {/* ÉTAPE 6: Succès */}
          {currentStep === 'SUCCESS' && (
            <View style={styles.stepContainer}>
              <View style={styles.successContainer}>
                <Text style={styles.successIcon}>✅</Text>
                <Text style={styles.successTitle}>Voaloa soamantsara!</Text>
                <Text style={styles.successText}>
                  Voaloa ny {amount.toLocaleString('mg-MG')} Ar.
                </Text>
                <ActivityIndicator size="small" color="#27ae60" style={{ marginTop: 16 }} />
              </View>
            </View>
          )}

          {/* ÉTAPE 7: Échec */}
          {currentStep === 'FAILED' && (
            <View style={styles.stepContainer}>
              <View style={styles.failedContainer}>
                <Text style={styles.failedIcon}>❌</Text>
                <Text style={styles.failedTitle}>Tsy nahomby</Text>
                <Text style={styles.failedText}>
                  Andramo indray na mifandraisa amin&apos;ny mpampiasa anao.
                </Text>

                <View style={styles.failedActions}>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={() => {
                      setCurrentStep('PROVIDER_SELECTION');
                      setPin('');
                      setPinAttempts(0);
                    }}
                  >
                    <Text style={styles.retryButtonText}>Andramo indray</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.homeButton}
                    onPress={handleGoHome}
                  >
                    <Text style={styles.homeButtonText}>Hiverina</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </ProfessionalLayout>
  );
}

// ✅ STYLES (inchangés)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#7f8c8d',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  stepContainer: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    textTransform: 'uppercase',
  },
  detailsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  remainingRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  remainingLabel: {
    fontWeight: 'bold',
  },
  remainingValue: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  actionsContainer: {
    gap: 12,
  },
  continueButton: {
    backgroundColor: '#3498db',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#95a5a6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  selectionDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 20,
    textAlign: 'center',
  },
  providersList: {
    gap: 12,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  providerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  providerIconText: {
    fontSize: 24,
    color: 'white',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  providerDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    lineHeight: 16,
  },
  arrow: {
    fontSize: 24,
    color: '#bdc3c7',
    marginLeft: 8,
  },
  redirectionContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  redirectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 20,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  pinAttempts: {
    fontSize: 12,
    color: '#e74c3c',
    marginTop: 4,
  },
  pinContainer: {
    padding: 20,
    alignItems: 'center',
  },
  pinLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  pinAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 30,
  },
  pinInputContainer: {
    marginBottom: 20,
  },
  pinInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    borderWidth: 2,
    borderColor: '#3498db',
    borderRadius: 12,
    padding: 16,
    width: 120,
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#bdc3c7',
  },
  pinDotFilled: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  pinHint: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#95a5a6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  processingContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 20,
    textAlign: 'center',
  },
  processingText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 8,
  },
  successContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
    lineHeight: 22,
  },
  failedContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  failedIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  failedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 8,
    textAlign: 'center',
  },
  failedText: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  failedActions: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingVertical: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  homeButton: {
    backgroundColor: '#95a5a6',
    paddingVertical: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  homeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});