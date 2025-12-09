import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import ProfessionalLayout from '../../components/ProfessionalLayout';
import { apiService } from '../../services/api';

// ======================
// ✅ TYPES CORRIGÉS
// ======================
type StatusKey = 'PENDING' | 'SUBMITTED' | 'VALIDATED' | 'APPROVED' | 'REJECTED' | 'PAID' | 'PARTIALLY_PAID' | 'COMPLETED' | 'DRAFT' | 'OVERDUE' | 'SUCCESS' | 'SUCCESSFUL' | 'FAILED' | 'CANCELLED' | 'PROCESSING';

type ActivityTypeKey = 'COMMERCE' | 'ALIMENTATION' | 'ARTISANAT' | 'SERVICES' | 'AUTRE' | 'INDUSTRIE' | 'AGRICULTURE';

type PaymentProviderKey = 'ORANGE_MONEY' | 'MVOLA' | 'AIRTEL_MONEY';

type StatusConfig = {
  text: string;
  color: string;
  icon: string;
  gradient: [string, string];
};

type ActivityTypeConfig = {
  name: string;
  icon: string;
  color: string;
};

type PaymentProviderConfig = {
  name: string;
  icon: string;
  color: string;
};

// ======================
// ✅ CONFIGURATIONS CORRIGÉES
// ======================
const STATUS_CONFIG: Record<StatusKey, StatusConfig> = {
  PENDING: { text: 'EO AM-PANDINIHA', color: '#f39c12', icon: '⏳', gradient: ['#f39c12', '#e67e22'] },
  SUBMITTED: { text: 'NALEFA', color: '#3498db', icon: '📤', gradient: ['#3498db', '#2980b9'] },
  VALIDATED: { text: 'VOAMARINA', color: '#27ae60', icon: '✅', gradient: ['#27ae60', '#2ecc71'] },
  APPROVED: { text: 'NEKENA', color: '#27ae60', icon: '✅', gradient: ['#27ae60', '#2ecc71'] },
  REJECTED: { text: 'NOLAVINA', color: '#e74c3c', icon: '❌', gradient: ['#e74c3c', '#c0392b'] },
  PAID: { text: 'VOALOA', color: '#2ecc71', icon: '💰', gradient: ['#2ecc71', '#27ae60'] },
  PARTIALLY_PAID: { text: 'VOALOA AMPAHANY', color: '#3498db', icon: '💸', gradient: ['#3498db', '#2980b9'] },
  COMPLETED: { text: 'VITA', color: '#2ecc71', icon: '✅', gradient: ['#2ecc71', '#27ae60'] },
  DRAFT: { text: 'BOATY', color: '#95a5a6', icon: '📝', gradient: ['#95a5a6', '#7f8c8d'] },
  OVERDUE: { text: 'LASA DATY', color: '#e74c3c', icon: '⚠️', gradient: ['#e74c3c', '#c0392b'] },
  SUCCESS: { text: 'FAHOMBIAZANA', color: '#27ae60', icon: '✅', gradient: ['#27ae60', '#2ecc71'] },
  SUCCESSFUL: { text: 'FAHOMBIAZANA', color: '#27ae60', icon: '✅', gradient: ['#27ae60', '#2ecc71'] },
  FAILED: { text: 'TSY NAHOMBY', color: '#e74c3c', icon: '❌', gradient: ['#e74c3c', '#c0392b'] },
  CANCELLED: { text: 'NOFOANANA', color: '#95a5a6', icon: '🚫', gradient: ['#95a5a6', '#7f8c8d'] },
  PROCESSING: { text: 'EO AM-PANDINIHA', color: '#f39c12', icon: '⏳', gradient: ['#f39c12', '#e67e22'] },
};

const ACTIVITY_TYPES: Record<ActivityTypeKey, ActivityTypeConfig> = {
  COMMERCE: { name: 'VAROTRA', icon: '🏪', color: '#3498db' },
  ALIMENTATION: { name: 'SAKAFA', icon: '🍽️', color: '#e74c3c' },
  ARTISANAT: { name: 'ASA TANANA', icon: '🛠️', color: '#f39c12' },
  SERVICES: { name: 'TOHOTRA', icon: '💼', color: '#9b59b6' },
  AUTRE: { name: 'HAFA', icon: '📦', color: '#95a5a6' },
  INDUSTRIE: { name: 'INDOSTRIA', icon: '🏭', color: '#34495e' },
  AGRICULTURE: { name: 'FAMBOLENA', icon: '🌱', color: '#27ae60' }
};

const PAYMENT_PROVIDERS: Record<PaymentProviderKey, PaymentProviderConfig> = {
  ORANGE_MONEY: { name: 'ORANGE MONEY', icon: '🟠', color: '#FF6600' },
  MVOLA: { name: 'MVOLA', icon: '🟢', color: '#00AA13' },
  AIRTEL_MONEY: { name: 'AIRTEL MONEY', icon: '🔴', color: '#E4002B' }
};

// ======================
// ✅ COMPOSANT PRINCIPAL CORRIGÉ
// ======================
export default function HistoriqueDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // ✅ ÉTATS LOCAUX SIMPLIFIÉS
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [lastRefreshTime, setLastRefreshTime] = useState<string>('');

  // ======================
  // ✅ CHARGEMENT DES DONNÉES CORRIGÉ
  // ======================
  useEffect(() => {
    loadItem();
  }, [params.id, params.type]);

  const loadItem = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      const itemId = Array.isArray(params.id) ? params.id[0] : params.id;
      const itemType = Array.isArray(params.type) ? params.type[0] : params.type;

      if (!itemId || !itemType) {
        throw new Error('TSY AMPY NY ANGONA NAMPIDIRINA');
      }

      console.log('📄 Chargement détail:', { id: itemId, type: itemType });

      if (itemType === 'DECLARATION') {
        const declaration = await apiService.getDeclaration(itemId);
        console.log('✅ Déclaration chargée:', declaration);
        setItem(declaration);
      } else if (itemType === 'PAYMENT') {
        const payment = await apiService.getPaymentDetails(itemId);
        console.log('✅ Paiement chargé:', payment);
        setItem(payment);
      } else {
        throw new Error('KARAZANA TSY FANTATRA: ' + itemType);
      }
      
      const now = new Date();
      setLastUpdated(now);
      setLastRefreshTime(now.toLocaleTimeString('fr-MG', {
        hour: '2-digit',
        minute: '2-digit'
      }));
      
    } catch (error: any) {
      console.error('❌ Erreur chargement détail:', error);
      Alert.alert(
        'HADISOANA', 
        error.message || 'TSY AFAKA MAKA NY ANTSIPIRIHANY. ANDRAMO INDRAY.'
      );
    } finally {
      setLoading(false);
    }
  }, [params.id, params.type]);

  // ✅ Rafraîchissement manuel simplifié
  const handleRefresh = useCallback(async () => {
    try {
      await loadItem(true);
    } catch (error) {
      console.error('Erreur refresh détail:', error);
    }
  }, [loadItem]);

  // ✅ Fonction pour calculer le temps depuis le dernier rafraîchissement
  const getTimeSinceLastRefresh = useCallback(() => {
    if (!lastUpdated) return 'Tsy mbola natao';
    
    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Avy hatrany';
    if (minutes < 60) return `${minutes} min lasa`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ora lasa`;
    
    return lastUpdated.toLocaleDateString('fr-MG', {
      day: '2-digit',
      month: '2-digit'
    });
  }, [lastUpdated]);

  // ======================
  // ✅ FONCTIONS UTILITAIRES CORRIGÉES
  // ======================
  const getStatusConfig = useCallback((status: string): StatusConfig => {
    if (!status) {
      return { 
        text: 'TSY FANTATRA', 
        color: '#7f8c8d', 
        icon: '❓',
        gradient: ['#7f8c8d', '#95a5a6'] as [string, string]
      };
    }
    
    const upperStatus = status.toUpperCase() as StatusKey;
    return STATUS_CONFIG[upperStatus] || { 
      text: status, 
      color: '#7f8c8d', 
      icon: '❓',
      gradient: ['#7f8c8d', '#95a5a6'] as [string, string]
    };
  }, []);

  const formatDate = useCallback((dateString: string | undefined) => {
    if (!dateString) return 'TSY FANTATRA';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      return date.toLocaleDateString('fr-MG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }, []);

  const formatAmount = useCallback((amount: number | undefined) => {
    if (amount === undefined || amount === null) {
      return '0 Ar';
    }
    return `${amount.toLocaleString('mg-MG')} Ar`;
  }, []);

  const getItemAmount = useCallback((item: any): number => {
    if (!item) return 0;
    
    // Pour les déclarations
    if (item.activityType) {
      return item.taxAmount || item.amount || 0;
    }
    // Pour les paiements
    return item.amount || 0;
  }, []);

  // ======================
  // ✅ GESTION DU PAIEMENT CORRIGÉE
  // ======================
  const handlePayment = useCallback(async () => {
    if (!item || !item.activityType) return;

    if (isProcessingPayment) {
      console.log('⏳ Paiement déjà en cours...');
      return;
    }

    // Vérifier si le paiement est possible
    const payableStatuses = ['VALIDATED', 'APPROVED', 'PARTIALLY_PAID'];
    const canMakePayment = payableStatuses.includes(item.status?.toUpperCase());
    
    if (!canMakePayment) {
      Alert.alert(
        'TSY AZO ALOA', 
        'MILA EO AM-PANDINIHA ALOHA NY FAMARANANA NA EFA VOALOA.'
      );
      return;
    }

    // Calculer le montant à payer
    const amountToPay = item.remainingAmount || item.taxAmount || 0;
    
    if (amountToPay <= 0) {
      Alert.alert('VOALOA', 'EFA VOALOA NY HETRA REHETRA.');
      return;
    }

    try {
      setIsProcessingPayment(true);
      
      console.log('💰 Navigation vers paiement pour:', {
        declarationId: item.id,
        amount: amountToPay,
        type: item.activityType
      });
      
      // Navigation vers l'écran de paiement
      router.push({
        pathname: '/payments/realistic',
        params: { 
          declarationId: item.id,
          amount: amountToPay.toString(),
          period: item.period || 'N/A',
          activityType: item.activityType || 'N/A'
        }
      });

      // ✅ Rafraîchir après paiement (après un délai)
      setTimeout(() => {
        loadItem(true);
      }, 2000);

    } catch (error) {
      console.error('❌ Erreur navigation paiement:', error);
      setIsProcessingPayment(false);
      Alert.alert('HADISOANA', 'NISY OLANA NITRANGA. ANDRAMO INDRAY.');
    }
  }, [item, isProcessingPayment, router, loadItem]);

  // ======================
  // ✅ LOGIQUE D'AFFICHAGE CORRIGÉE
  // ======================
  const shouldShowPaymentButton = useCallback(() => {
    if (!item || !item.activityType) return false;
    
    const amountToPay = item.remainingAmount || item.taxAmount || 0;
    const payableStatuses = ['VALIDATED', 'APPROVED', 'PARTIALLY_PAID'];
    const isPayableStatus = payableStatuses.includes(item.status?.toUpperCase());
    
    return isPayableStatus && amountToPay > 0 && !isProcessingPayment;
  }, [item, isProcessingPayment]);

  const getPaymentButtonText = useCallback(() => {
    if (!item || !item.activityType) return '';
    
    const amount = item.remainingAmount || item.taxAmount || 0;
    
    if (isProcessingPayment) {
      return 'EO AM-PANDOA...';
    }
    
    return `HANDOA NY HETEZANA (${formatAmount(amount)})`;
  }, [item, isProcessingPayment, formatAmount]);

  const getDescription = useCallback(() => {
    if (!item) return '';
    
    if (item.activityType) {
      // C'est une déclaration
      const activityConfig = ACTIVITY_TYPES[item.activityType as ActivityTypeKey];
      return `${activityConfig?.name || item.activityType} - ${item.period || ''}`;
    } else {
      // C'est un paiement
      const providerConfig = PAYMENT_PROVIDERS[item.provider as PaymentProviderKey];
      return `${providerConfig?.name || item.provider} - ${item.transactionId || ''}`;
    }
  }, [item]);

  // ======================
  // ✅ COMPOSANTS INTERNES
  // ======================
  const StatusBadge = useCallback(({ status }: { status: string }) => {
    const config = getStatusConfig(status);
    return (
      <View style={[styles.statusBadge, { backgroundColor: config.color }]}>
        <Text style={styles.statusIcon}>{config.icon}</Text>
        <Text style={styles.statusText}>{config.text}</Text>
      </View>
    );
  }, [getStatusConfig]);

  // ======================
  // ✅ ÉTATS DE CHARGEMENT
  // ======================
  if (loading) {
    return (
      <ProfessionalLayout title="ANTSIPIRIHANY">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>EO AM-PAMAKIANA NY ANTSIPIRIHANY...</Text>
          <Text style={styles.loadingSubtext}>Andraso kely azafady</Text>
        </View>
      </ProfessionalLayout>
    );
  }

  if (!item) {
    return (
      <ProfessionalLayout title="ANTSIPIRIHANY">
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>📄</Text>
          </View>
          <Text style={styles.emptyTitle}>TSY HITA NY ANTSIPIRIHANY</Text>
          <Text style={styles.emptyText}>
            Tsy nahitana ny {params.type === 'PAYMENT' ? 'fandoavana' : 'famaranana'} nangatahana.
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => router.back()}
          >
            <Text style={styles.emptyButtonText}>HIVERINA</Text>
          </TouchableOpacity>
        </View>
      </ProfessionalLayout>
    );
  }

  // ======================
  // ✅ VARIABLES DE RENDU
  // ======================
  const isDeclaration = !!item.activityType;
  const statusConfig = getStatusConfig(item.status);
  const showPaymentButton = shouldShowPaymentButton();
  const itemAmount = getItemAmount(item);
  const description = getDescription();

  return (
    <ProfessionalLayout title="ANTSIPIRIHANY">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* ✅ En-tête avec info rafraîchissement locale */}
        <View style={[styles.header, { backgroundColor: statusConfig.color }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Text style={styles.headerIconText}>
                {isDeclaration ? '📄' : '💳'}
              </Text>
            </View>
            
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>
                {isDeclaration ? 'FAMARANANA' : 'FANDOAVANA'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {description}
              </Text>
            </View>
          </View>

          <StatusBadge status={item.status} />
          
          {/* ✅ Info rafraîchissement locale */}
          <View style={styles.refreshInfo}>
            <Text style={styles.refreshInfoText}>
              Farany novaina: {lastRefreshTime}
            </Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={handleRefresh}
              disabled={loading}
            >
              <Text style={styles.refreshButtonText}>🔄 Hamerina</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section montant */}
        <View style={styles.amountSection}>
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>
              {isDeclaration ? 'HETEZANA' : 'VOLAN-JAVATRA'}
            </Text>
            <Text style={styles.amountValue}>
              {formatAmount(itemAmount)}
            </Text>
          </View>

          {isDeclaration && (
            <View style={styles.amountDetails}>
              {(item.paidAmount || 0) > 0 && (
                <View style={styles.amountDetail}>
                  <Text style={styles.amountDetailLabel}>VOALOA</Text>
                  <Text style={[styles.amountDetailValue, { color: '#27ae60' }]}>
                    {formatAmount(item.paidAmount)}
                  </Text>
                </View>
              )}
              
              {(item.remainingAmount || 0) > 0 && (
                <View style={styles.amountDetail}>
                  <Text style={styles.amountDetailLabel}>MBOLA TAVELA</Text>
                  <Text style={[styles.amountDetailValue, { color: '#e74c3c' }]}>
                    {formatAmount(item.remainingAmount)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Informations */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>ANGONA FOTOTRA</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>DATY NATO</Text>
              <Text style={styles.infoValue}>{formatDate(item.createdAt)}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>SATA</Text>
              <View style={[styles.infoValue, { flexDirection: 'row', alignItems: 'center' }]}>
                <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
                <Text style={{ marginLeft: 4 }}>{statusConfig.text}</Text>
              </View>
            </View>
            
            {isDeclaration ? (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>VOLANA/TAONA</Text>
                  <Text style={styles.infoValue}>{item.period || 'TSY FANTATRA'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>KARAZANA ASA</Text>
                  <View style={[styles.activityBadge, { backgroundColor: `${ACTIVITY_TYPES[item.activityType as ActivityTypeKey]?.color}20` }]}>
                    <Text style={[styles.activityIcon, { color: ACTIVITY_TYPES[item.activityType as ActivityTypeKey]?.color }]}>
                      {ACTIVITY_TYPES[item.activityType as ActivityTypeKey]?.icon || '📊'}
                    </Text>
                    <Text style={[styles.activityText, { color: ACTIVITY_TYPES[item.activityType as ActivityTypeKey]?.color }]}>
                      {ACTIVITY_TYPES[item.activityType as ActivityTypeKey]?.name || item.activityType || 'TSY FANTATRA'}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>FOMBA FANDOAVANA</Text>
                  <View style={[styles.providerBadge, { backgroundColor: `${PAYMENT_PROVIDERS[item.provider as PaymentProviderKey]?.color}20` }]}>
                    <Text style={[styles.providerIcon, { color: PAYMENT_PROVIDERS[item.provider as PaymentProviderKey]?.color }]}>
                      {PAYMENT_PROVIDERS[item.provider as PaymentProviderKey]?.icon || '💳'}
                    </Text>
                    <Text style={[styles.providerText, { color: PAYMENT_PROVIDERS[item.provider as PaymentProviderKey]?.color }]}>
                      {PAYMENT_PROVIDERS[item.provider as PaymentProviderKey]?.name || item.provider || 'TSY FANTATRA'}
                    </Text>
                  </View>
                </View>
                
                {item.transactionId && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>TRANSACTION ID</Text>
                    <Text style={[styles.infoValue, styles.transactionId]} numberOfLines={1}>
                      {item.transactionId}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Description (déclarations seulement) */}
          {isDeclaration && item.description && (
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>FAMARIPARITANA</Text>
              <View style={styles.descriptionBox}>
                <Text style={styles.descriptionText}>
                  {item.description}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionSection}>
          {isDeclaration && (
            showPaymentButton ? (
              <TouchableOpacity 
                style={styles.payButton}
                onPress={handlePayment}
                disabled={isProcessingPayment}
              >
                <View style={[styles.payButtonGradient, { backgroundColor: '#27ae60' }]}>
                  {isProcessingPayment ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.payButtonIcon}>💳</Text>
                  )}
                  <Text style={styles.payButtonText}>
                    {getPaymentButtonText()}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : item.status?.toUpperCase() === 'PAID' ? (
              <View style={styles.successBadge}>
                <Text style={styles.successIcon}>✅</Text>
                <Text style={styles.successText}>EFA VOALOA NY HETRA REHETRA</Text>
              </View>
            ) : (
              <View style={styles.infoBadge}>
                <Text style={styles.infoIcon}>ℹ️</Text>
                <Text style={styles.infoText}>
                  {item.status?.toUpperCase() === 'PENDING' ? 'EO AM-PANDINIHA' : 'TSY AZO ALOA AMIN\'IZAO'}
                </Text>
              </View>
            )
          )}
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>HIVERINA ANY AMIN&apos;NY TANTARA</Text>
          </TouchableOpacity>
        </View>

        {/* ✅ Footer avec info locale */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            📞 RAHA MISY OLANA: +261 34 20 152 72
          </Text>
          <Text style={styles.footerId}>
            ID: {item.id || 'N/A'} • Farany novaina: {getTimeSinceLastRefresh()}
          </Text>
        </View>
      </ScrollView>
    </ProfessionalLayout>
  );
}

// ======================
// ✅ STYLES SIMPLIFIÉS POUR PUBLIC ÂGÉ
// ======================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    padding: 20,
  },
  loadingText: { 
    fontSize: 18,
    color: '#2c3e50',
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f5f7fa',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#2980b9',
  },
  emptyIconText: {
    fontSize: 32,
    color: '#ffffff',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2980b9',
  },
  emptyButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  header: {
    padding: 20,
    margin: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  headerIconText: {
    fontSize: 24,
    color: '#ffffff',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  statusIcon: {
    fontSize: 16,
    color: '#ffffff',
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  refreshInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  refreshInfoText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  refreshButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  amountSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  amountCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e6ed',
  },
  amountLabel: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '600',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2c3e50',
  },
  amountDetails: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  amountDetail: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e6ed',
  },
  amountDetailLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
    fontWeight: '600',
  },
  amountDetailValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  infoSection: {
    paddingHorizontal: 16,
    gap: 16,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e6ed',
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2c3e50',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'right',
    maxWidth: '60%',
  },
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  activityIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  activityText: {
    fontSize: 12,
    fontWeight: '700',
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  providerIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  providerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  transactionId: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  descriptionBox: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  descriptionText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
  actionSection: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 24,
    gap: 12,
  },
  payButton: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#27ae60',
  },
  payButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  payButtonIcon: {
    fontSize: 20,
    marginRight: 8,
    color: '#ffffff',
  },
  payButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f5e8',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#27ae60',
  },
  successIcon: {
    fontSize: 20,
    marginRight: 8,
    color: '#27ae60',
  },
  successText: {
    color: '#27ae60',
    fontWeight: '700',
    fontSize: 16,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2196f3',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 8,
    color: '#2196f3',
  },
  infoText: {
    color: '#2196f3',
    fontWeight: '700',
    fontSize: 16,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#95a5a6',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7f8c8d',
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerId: {
    fontSize: 12,
    color: '#bdc3c7',
    fontFamily: 'monospace',
  },
});