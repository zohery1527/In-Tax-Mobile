import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import ProfessionalLayout from '../../components/ProfessionalLayout';
import { apiService } from '../../services/api';

// Types
type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'PROCESSING';
type PaymentProvider = 'ORANGE_MONEY' | 'MVOLA' | 'AIRTEL_MONEY';

const STATUS_CONFIG: Record<PaymentStatus, any> = {
  PENDING: { text: 'MIANDRY', color: '#f39c12', icon: '⏳' },
  SUCCESS: { text: 'FAHOMBIAZANA', color: '#27ae60', icon: '✅' },
  FAILED: { text: 'TSY NAHOMBY', color: '#e74c3c', icon: '❌' },
  CANCELLED: { text: 'NOFOANANA', color: '#95a5a6', icon: '🚫' },
  PROCESSING: { text: 'EO AM-PANDINIHA', color: '#3498db', icon: '🔄' },
};

const PROVIDER_CONFIG: Record<PaymentProvider, any> = {
  ORANGE_MONEY: { name: 'ORANGE MONEY', color: '#FF6600', icon: '🟠' },
  MVOLA: { name: 'MVOLA', color: '#00AA13', icon: '🟢' },
  AIRTEL_MONEY: { name: 'AIRTEL MONEY', color: '#E4002B', icon: '🔴' },
};

export default function PaymentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPayment();
  }, [id]);

  const loadPayment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const paymentId = Array.isArray(id) ? id[0] : id;
      
      if (!paymentId) {
        throw new Error('TSY MISY ID NAMPIDIRINA');
      }
      
      console.log('💰 Chargement paiement ID:', paymentId);
      const paymentData = await apiService.getPaymentDetails(paymentId);
      
      if (!paymentData) {
        throw new Error('TSY HITA NY FANDOAVANA');
      }
      
      setPayment(paymentData);
      
    } catch (error: any) {
      console.error('❌ Erreur chargement paiement:', error);
      setError(error.message || 'NISY OLANA NITRANGA');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-MG', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }, []);

  const formatAmount = useCallback((amount: number) => {
    return `${amount?.toLocaleString('mg-MG') || '0'} Ar`;
  }, []);

  const handleRetry = useCallback(() => {
    loadPayment();
  }, [loadPayment]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // États de chargement
  if (loading) {
    return (
      <ProfessionalLayout title="DÉTAILS FANDOAVANA">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>EO AM-PAMAKIANA NY ANTSIPIRIHANY...</Text>
        </View>
      </ProfessionalLayout>
    );
  }

  // Erreur
  if (error || !payment) {
    return (
      <ProfessionalLayout title="DÉTAILS FANDOAVANA">
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorIconText}>⚠️</Text>
          </View>
          <Text style={styles.errorTitle}>HADISOANA</Text>
          <Text style={styles.errorText}>
            {error || 'Tsy afaka maka ny antsipirihan\'ny fandoavana'}
          </Text>
          <View style={styles.errorButtons}>
            <TouchableOpacity 
              style={styles.errorButton}
              onPress={handleRetry}
            >
              <Text style={styles.errorButtonText}>ANDRAMO INDRAY</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.errorButton, styles.secondaryButton]}
              onPress={handleBack}
            >
              <Text style={styles.errorButtonText}>HIVERINA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ProfessionalLayout>
    );
  }

  // Variables pour le rendu
  const status = (payment.status?.toUpperCase() as PaymentStatus) || 'PENDING';
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  
  const provider = (payment.provider?.toUpperCase() as PaymentProvider) || 'ORANGE_MONEY';
  const providerConfig = PROVIDER_CONFIG[provider] || PROVIDER_CONFIG.ORANGE_MONEY;

  return (
    <ProfessionalLayout title="DÉTAILS FANDOAVANA">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* En-tête */}
        <View style={[styles.header, { backgroundColor: statusConfig.color }]}>
          <View style={styles.headerContent}>
            <Text style={styles.headerIcon}>💳</Text>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>FANDOAVANA</Text>
              <Text style={styles.headerSubtitle}>
                {payment.transactionId || payment.id}
              </Text>
            </View>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
            <Text style={styles.statusText}>{statusConfig.text}</Text>
          </View>
        </View>

        {/* Montant */}
        <View style={styles.amountSection}>
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>VOLAN-JAVATRA</Text>
            <Text style={styles.amountValue}>
              {formatAmount(payment.amount || 0)}
            </Text>
          </View>
        </View>

        {/* Informations */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>ANGONA FOTOTRA</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>DATY NATO</Text>
              <Text style={styles.infoValue}>
                {formatDate(payment.createdAt || payment.paidAt || new Date().toISOString())}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>FOMBA FANDOAVANA</Text>
              <View style={[styles.providerBadge, { backgroundColor: `${providerConfig.color}20` }]}>
                <Text style={[styles.providerIcon, { color: providerConfig.color }]}>
                  {providerConfig.icon}
                </Text>
                <Text style={[styles.providerText, { color: providerConfig.color }]}>
                  {providerConfig.name}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>SATA</Text>
              <View style={[styles.infoValue, { flexDirection: 'row', alignItems: 'center' }]}>
                <Text style={styles.statusIconSmall}>{statusConfig.icon}</Text>
                <Text style={{ marginLeft: 4, color: statusConfig.color, fontWeight: '700' }}>
                  {statusConfig.text}
                </Text>
              </View>
            </View>
            
            {payment.transactionId && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>TRANSACTION ID</Text>
                <Text style={[styles.infoValue, styles.transactionId]}>
                  {payment.transactionId}
                </Text>
              </View>
            )}
            
            {payment.declarationId && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>FAMARANANA</Text>
                <Text style={styles.infoValue}>{payment.declarationId}</Text>
              </View>
            )}
          </View>

          {/* Détails additionnels */}
          {payment.description && (
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>FAMARIPARITANA</Text>
              <View style={styles.descriptionBox}>
                <Text style={styles.descriptionText}>
                  {payment.description}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionSection}>
          {status === 'FAILED' && (
            <TouchableOpacity style={styles.retryButton}>
              <Text style={styles.retryButtonText}>ANDRAO MANDOA INDRAY</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <Text style={styles.backButtonText}>HIVERINA ANY AMIN&apos;NY TANTARA</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            📞 RAHA MISY OLANA: +261 34 20 152 72
          </Text>
          <Text style={styles.footerId}>
            ID: {payment.id || 'N/A'}
          </Text>
        </View>
      </ScrollView>
    </ProfessionalLayout>
  );
}

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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f5f7fa',
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorIconText: {
    fontSize: 32,
    color: '#ffffff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e74c3c',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  errorButtons: {
    gap: 12,
    width: '100%',
    maxWidth: 300,
  },
  errorButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#95a5a6',
  },
  errorButtonText: {
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
    fontSize: 32,
    marginRight: 16,
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
    fontFamily: 'monospace',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
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
  statusIconSmall: {
    fontSize: 14,
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
  retryButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c0392b',
  },
  retryButtonText: {
    color: '#ffffff',
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