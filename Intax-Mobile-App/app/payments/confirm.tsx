// app/payment/confirm.tsx - VERSION CORRIGÉE
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProfessionalLayout from '../../components/ProfessionalLayout';
import { apiService, PaymentProvider } from '../../services/api';

// ✅ Types pour TypeScript
type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CONFIRMING';

export default function PaymentConfirmationScreen() {
  const router = useRouter();
  
  // ✅ CORRECTION : Typage correct des params
  const params = useLocalSearchParams<{
    transactionId?: string;
    provider?: string;
  }>();
  
  const { transactionId, provider } = params;
  
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PENDING');
  const [retryCount, setRetryCount] = useState(0);

  // ✅ CORRECTION: useCallback avec dépendances correctes
  const confirmPayment = useCallback(async () => {
    if (!transactionId || !provider) {
      Alert.alert('Hadisoana', 'Tsy ampy ny angona nampidirina.');
      setLoading(false);
      return;
    }

    setPaymentStatus('CONFIRMING');
    
    try {
      console.log('🔍 Confirmation du paiement:', { 
        transactionId, 
        provider,
        retryCount 
      });
      
      // ✅ CORRECTION : Conversion du provider
      let providerEnum: PaymentProvider;
      switch (provider.toLowerCase()) {
        case 'orange':
        case 'orange_money':
        case 'orangemoney':
          providerEnum = 'ORANGE_MONEY';
          break;
        case 'mvola':
          providerEnum = 'MVOLA';
          break;
        case 'airtel':
        case 'airtel_money':
        case 'airtelmoney':
          providerEnum = 'AIRTEL_MONEY';
          break;
        default:
          providerEnum = provider.toUpperCase() as PaymentProvider;
      }
      
      const result = await apiService.confirmPayment({
        transactionId,
        provider: providerEnum
      });

      console.log('✅ Réponse confirmation:', result);

      // ✅ CORRECTION : Vérification selon le type de réponse de votre API
      if (result) {
        const status = result.status || 'COMPLETED';
        
        if (status === 'COMPLETED' || status === 'SUCCESS') {
          setPaymentStatus('COMPLETED');
        } else if (status === 'PENDING' || status === 'PROCESSING') {
          setPaymentStatus('PENDING');
          if (retryCount < 2) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              confirmPayment();
            }, 3000);
          } else {
            Alert.alert('Mbola miandry', 'Mbola andraso ny fahombiazan\'ny fandoavana. Azonao atao ny manamarina indray.');
          }
        } else {
          setPaymentStatus('FAILED');
          Alert.alert('Hadisoana', 'Nisy olana ny fandoavana. Andramo indray.');
        }
      } else {
        throw new Error('Nisy olana ny fanamarinana');
      }
    } catch (error: any) {
      console.error('❌ Erreur confirmation:', error);
      
      if (error.message?.includes('network') || error.message?.includes('timeout')) {
        Alert.alert(
          'Fampahatsiahivana', 
          'Misy olana amin\'ny tambajotra. Andramo indray rehefa misy connexion.'
        );
      } else {
        Alert.alert('Hadisoana', error.message || 'Nisy olana ny fanamarinana. Andramo indray.');
      }
      
      setPaymentStatus('FAILED');
    } finally {
      setLoading(false);
    }
  }, [transactionId, provider, retryCount]);

  // ✅ CORRECTION : useEffect avec confirmation
  useEffect(() => {
    if (transactionId && provider) {
      confirmPayment();
    } else {
      setLoading(false);
      Alert.alert('Hadisoana', 'Tsy ampy ny angona nampidirina.');
    }
  }, [confirmPayment, transactionId, provider]);

  const getStatusInfo = () => {
    switch (paymentStatus) {
      case 'COMPLETED':
        return { 
          text: 'Voaloa', 
          color: '#27ae60', 
          icon: '✅',
          message: 'Voamarina ny fandoavana. Misaotra anao!'
        };
      case 'FAILED':
        return { 
          text: 'Tsy nahomby', 
          color: '#e74c3c', 
          icon: '❌',
          message: 'Nisy olana ny fandoavana. Azonao atao ny manandrana indray.'
        };
      case 'CONFIRMING':
        return { 
          text: 'Eo am-panamarinana', 
          color: '#3498db', 
          icon: '⏳',
          message: 'Eo am-panamarinana ny fandoavana...'
        };
      default:
        return { 
          text: 'Eo am-pandinihana', 
          color: '#f39c12', 
          icon: '🔍',
          message: 'Mbola eo am-pandinihana ny fandoavana.'
        };
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    confirmPayment();
  };

  const statusInfo = getStatusInfo();

  if (loading) {
    return (
      <ProfessionalLayout title="Fanamarinana">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Eo am-pamakiana ny fandoavana...</Text>
        </View>
      </ProfessionalLayout>
    );
  }

  return (
    <ProfessionalLayout title="Fanamarinana">
      <View style={styles.container}>
        <View style={styles.statusCard}>
          <Text style={[styles.statusIcon, { color: statusInfo.color }]}>
            {statusInfo.icon}
          </Text>
          <Text style={styles.statusTitle}>{statusInfo.text}</Text>
          <Text style={styles.statusMessage}>{statusInfo.message}</Text>
          
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionLabel}>Transaction ID:</Text>
            <Text style={styles.transactionId}>{transactionId}</Text>
          </View>

          <View style={styles.providerInfo}>
            <Text style={styles.providerLabel}>Fomba fandoavana:</Text>
            <Text style={styles.providerText}>
              {provider?.toLowerCase().includes('orange') ? 'Orange Money' : 
               provider?.toLowerCase().includes('airtel') ? 'Airtel Money' : 
               provider?.toUpperCase()}
            </Text>
          </View>

          {retryCount > 0 && (
            <Text style={styles.retryText}>
              Andramana faharoa: {retryCount}/3
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          {paymentStatus !== 'COMPLETED' && (
            <TouchableOpacity 
              style={[
                styles.confirmButton, 
                { 
                  backgroundColor: paymentStatus === 'FAILED' ? '#e74c3c' : '#3498db'
                }
              ]}
              onPress={handleRetry}
              disabled={paymentStatus === 'CONFIRMING'}
            >
              {paymentStatus === 'CONFIRMING' ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>
                  {paymentStatus === 'FAILED' ? 'Andramana indray' : 'Hanamarina indray'}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {paymentStatus === 'COMPLETED' && (
            <TouchableOpacity 
              style={styles.successButton}
              onPress={() => router.push('/historique')}
            >
              <Text style={styles.successButtonText}>Hijery ny fandoavana</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.historyButton}
            onPress={() => router.push('/historique')}
          >
            <Text style={styles.historyButtonText}>Hijery ny tantara</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.homeButton}
            onPress={() => router.push('/(tabs)/accueil')}
          >
            <Text style={styles.homeButtonText}>Hiverina any amin&apos;ny fandraisana</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Misy olana?</Text>
          <Text style={styles.helpText}>
            Raha misy olana amin&apos;ny fandoavana, antsoy ny fanampiana amin&apos;ny {`\n`}
            <Text style={styles.helpPhone}>034 20 152 72</Text>
          </Text>
        </View>
      </View>
    </ProfessionalLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#7f8c8d',
    fontSize: 14,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignSelf: 'stretch',
  },
  transactionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginRight: 8,
  },
  transactionId: {
    fontSize: 12,
    color: '#7f8c8d',
    fontFamily: 'monospace',
    flex: 1,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignSelf: 'stretch',
  },
  providerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginRight: 8,
  },
  providerText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  retryText: {
    fontSize: 12,
    color: '#f39c12',
    fontStyle: 'italic',
    marginTop: 8,
  },
  actions: {
    gap: 12,
    marginBottom: 20,
  },
  confirmButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  successButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyButton: {
    backgroundColor: '#3498db',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  historyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  homeButton: {
    backgroundColor: '#95a5a6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  homeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
  },
  helpPhone: {
    color: '#3498db',
    fontWeight: 'bold',
  },
});