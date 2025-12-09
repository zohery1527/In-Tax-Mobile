import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import ProfessionalLayout from '../../components/ProfessionalLayout';
import { apiService } from '../../services/api';

// Types simplifiés
type HistoryItem = {
  id: string;
  type: 'DECLARATION' | 'PAYMENT';
  date: string;
  amount: number;
  status: string;
  description: string;
  details: any;
  isPayment: boolean;
  transactionId?: string; // AJOUT: pour les paiements
};

type FilterType = 'ALL' | 'PENDING' | 'PAID' | 'VALIDATED' | 'REJECTED';
type ItemType = 'ALL' | 'DECLARATION' | 'PAYMENT';

// Constantes simplifiées
const STATUS_CONFIG: Record<string, any> = {
  PENDING: { text: 'MIANDRY', color: '#f39c12', icon: '⏳' },
  SUBMITTED: { text: 'NALEFA', color: '#3498db', icon: '📤' },
  VALIDATED: { text: 'VOAMARINA', color: '#27ae60', icon: '✅' },
  APPROVED: { text: 'NEKENA', color: '#27ae60', icon: '✅' },
  REJECTED: { text: 'NOLAVINA', color: '#e74c3c', icon: '❌' },
  PAID: { text: 'VOALOA', color: '#2ecc71', icon: '💰' },
  COMPLETED: { text: 'VOALOA', color: '#2ecc71', icon: '💰' }, // AJOUT: pour paiements
  SUCCESS: { text: 'FAHOMBIAZANA', color: '#27ae60', icon: '✅' },
  FAILED: { text: 'TSY NAHOMBY', color: '#e74c3c', icon: '❌' },
  PROCESSING: { text: 'EO AM-PANDINIHA', color: '#f39c12', icon: '⏳' },
  DEFAULT: { text: 'TSY FANTATRA', color: '#95a5a6', icon: '❓' }
};

const ACTIVITY_TYPES: Record<string, string> = {
  COMMERCE: 'VAROTRA',
  ALIMENTATION: 'SAKAFA',
  ARTISANAT: 'ASA TANANA',
  SERVICES: 'TOHOTRA',
  AUTRE: 'HAFA'
};

export default function HistoriqueScreen() {
  const router = useRouter();
  
  // États simplifiés
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [activeType, setActiveType] = useState<ItemType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // Chargement des données avec gestion d'erreur améliorée
  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      const [decls, paymentResult] = await Promise.all([
        apiService.getUserDeclarations(),
        apiService.getPaymentHistory()
      ]);
      
      // ✅ CORRECTION: Vérifier si payments existe
      setDeclarations(decls || []);
      setPayments(paymentResult?.payments || []);
      setLastRefresh(new Date());
      
      console.log('✅ Données historiques chargées:', {
        declarations: decls?.length || 0,
        payments: paymentResult?.payments?.length || 0
      });
      
    } catch (error: any) {
      console.error('❌ Erreur chargement données:', error);
      
      // ✅ CORRECTION: Meilleure gestion d'erreur
      if (!forceRefresh) {
        // Si c'est le premier chargement, essayer de continuer avec données vides
        if (declarations.length === 0 && payments.length === 0) {
          setDeclarations([]);
          setPayments([]);
        }
        
        // Seulement afficher l'alerte si c'est un rafraîchissement manuel
        if (forceRefresh || isManualRefreshing) {
          Alert.alert(
            'Hadisoana', 
            error.message || 'Tsy afaka naka ny tantara. Andramo indray.',
            [{ text: 'OK' }]
          );
        }
      }
    } finally {
      setLoading(false);
      setIsManualRefreshing(false);
    }
  }, [declarations.length, payments.length, isManualRefreshing]);

  // Chargement initial
  useEffect(() => {
    loadData();
  }, []);

  // Calcul du temps depuis le dernier rafraîchissement
  const getTimeSinceLastRefresh = useCallback(() => {
    if (!lastRefresh) return 'Tsy mbola natao';
    
    const now = new Date();
    const diff = now.getTime() - lastRefresh.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Avy hatrany';
    if (minutes < 60) return `${minutes} min lasa`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ora lasa`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} andro lasa`;
    
    return lastRefresh.toLocaleDateString('fr-MG', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  }, [lastRefresh]);

  // Rafraîchissement manuel
  const onRefresh = useCallback(async () => {
    setIsManualRefreshing(true);
    setRefreshing(true);
    try {
      await loadData(true);
    } catch (error) {
      console.error('Erreur refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  // Préparation des données historiques avec gestion des erreurs
  const historyItems = React.useMemo(() => {
    try {
      const declarationItems: HistoryItem[] = (declarations || []).map(decl => ({
        id: `decl_${decl.id}`,
        type: 'DECLARATION',
        date: decl.createdAt || decl.updatedAt || new Date().toISOString(),
        amount: decl.taxAmount || 0,
        status: decl.status?.toUpperCase() || 'UNKNOWN',
        description: `FAMARANANA - ${ACTIVITY_TYPES[decl.activityType] || decl.activityType || 'TSY FANTATRA'}`,
        details: decl,
        isPayment: false
      }));

      const paymentItems: HistoryItem[] = (payments || []).map(payment => ({
        id: `pay_${payment.id}`,
        type: 'PAYMENT',
        date: payment.createdAt || payment.paidAt || new Date().toISOString(),
        amount: payment.amount || 0,
        status: payment.status?.toUpperCase() || 'UNKNOWN',
        description: `FANDOAVANA (${payment.provider || 'TSY FANTATRA'})`,
        details: payment,
        isPayment: true,
        transactionId: payment.transactionId // AJOUT: pour navigation
      }));

      return [...declarationItems, ...paymentItems]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('❌ Erreur préparation données historiques:', error);
      return [];
    }
  }, [declarations, payments]);

  // Fonctions utilitaires
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-MG', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }, []);

  const formatAmount = useCallback((amount: number) => {
    return `${amount?.toLocaleString('mg-MG') || '0'} Ar`;
  }, []);

  const getStatusConfig = useCallback((status: string) => {
    const upperStatus = status.toUpperCase();
    return STATUS_CONFIG[upperStatus] || STATUS_CONFIG.DEFAULT;
  }, []);

  // Filtrage des items
  const filteredItems = React.useMemo(() => {
    let filtered = historyItems;

    // Filtre par type
    if (activeType !== 'ALL') {
      filtered = filtered.filter(item => item.type === activeType);
    }

    // Filtre par statut
    if (activeFilter !== 'ALL') {
      filtered = filtered.filter(item => {
        const status = item.status;
        
        switch (activeFilter) {
          case 'PENDING':
            return ['PENDING', 'SUBMITTED', 'PROCESSING'].includes(status);
          case 'PAID':
            return ['PAID', 'COMPLETED', 'SUCCESS', 'SUCCESSFUL'].includes(status); // AJOUT: 'COMPLETED'
          case 'VALIDATED':
            return ['VALIDATED', 'APPROVED'].includes(status);
          case 'REJECTED':
            return ['REJECTED', 'FAILED'].includes(status);
          default:
            return true;
        }
      });
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.description.toLowerCase().includes(query) ||
        item.amount.toString().includes(query) ||
        formatDate(item.date).toLowerCase().includes(query) ||
        item.details?.nifNumber?.toLowerCase()?.includes(query) || // AJOUT: recherche par NIF
        (item.type === 'PAYMENT' && item.transactionId?.toLowerCase()?.includes(query)) // AJOUT: recherche par transactionId
      );
    }

    return filtered;
  }, [historyItems, activeFilter, activeType, searchQuery, formatDate]);

  const resetFilters = useCallback(() => {
    setActiveFilter('ALL');
    setActiveType('ALL');
    setSearchQuery('');
  }, []);

  // ✅ CORRECTION: Navigation améliorée
  const handleItemPress = useCallback((item: HistoryItem) => {
    if (!item.details?.id) {
      Alert.alert('Hadisoana', 'Tsy hita ny antsipiriany.');
      return;
    }

    // Navigation différente selon le type
    if (item.type === 'DECLARATION') {
      router.push({
        pathname: '/historique/[id]',
        params: {
           id: item.details.id,
            type: item.type
         }
      });
    } else if (item.type === 'PAYMENT') {
      // Pour les paiements, utiliser transactionId si disponible
      // const transactionId = item.details.transactionId || item.details.id;
      router.push({
        pathname: '/payments/[id]',
        params: {
           id: item.details.id,
          type: item.type
         }
      });
    }
  }, [router]);

  // Composant pour un item historique
  const renderItem = useCallback(({ item }: { item: HistoryItem }) => {
    const statusConfig = getStatusConfig(item.status);
    
    return (
      <TouchableOpacity 
        style={styles.itemCard}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.itemHeader}>
          <View style={[styles.itemTypeIcon, 
            item.type === 'DECLARATION' ? styles.declarationIcon : styles.paymentIcon
          ]}>
            <Text style={styles.typeIconText}>
              {item.type === 'DECLARATION' ? '📝' : '💳'}
            </Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemDescription} numberOfLines={1}>
              {item.description}
            </Text>
            <Text style={styles.itemDate}>
              {formatDate(item.date)}
            </Text>
            {/* AJOUT: Afficher le NIF pour les déclarations */}
            {item.type === 'DECLARATION' && item.details?.nifNumber && (
              <Text style={styles.itemNif} numberOfLines={1}>
                {item.details.nifNumber}
              </Text>
            )}
            {/* AJOUT: Afficher le transactionId pour les paiements */}
            {item.type === 'PAYMENT' && item.details?.transactionId && (
              <Text style={styles.itemTransactionId} numberOfLines={1}>
                ID: {item.details.transactionId.substring(0, 8)}...
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.itemFooter}>
          <Text style={[
            styles.itemAmount,
            item.isPayment && styles.paymentAmount
          ]}>
            {formatAmount(item.amount)}
          </Text>
          
          <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}20` }]}>
            <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.text}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [getStatusConfig, handleItemPress, formatAmount, formatDate]);

  // Header avec info rafraîchissement
  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      {/* Barre de recherche avec info rafraîchissement */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Hikaroka famaranana, fandoavana, NIF, ID..."
            placeholderTextColor="#95a5a6"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>
        
        {/* Info rafraîchissement locale */}
        <View style={styles.refreshInfo}>
          <Text style={styles.refreshInfoText}>
            Farany novaina: {getTimeSinceLastRefresh()}
          </Text>
          {isManualRefreshing && (
            <View style={styles.refreshingContainer}>
              <ActivityIndicator size="small" color="#3498db" />
              <Text style={styles.refreshingText}>Rafraîchissement...</Text>
            </View>
          )}
        </View>
      </View>

      {/* Filtres principaux */}
      <View style={styles.filterRow}>
        {['ALL', 'PENDING', 'PAID'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              activeFilter === filter && styles.filterButtonActive
            ]}
            onPress={() => setActiveFilter(filter as FilterType)}
          >
            <Text style={[
              styles.filterButtonText,
              activeFilter === filter && styles.filterButtonTextActive
            ]}>
              {filter === 'ALL' ? 'REHETRA' : 
               filter === 'PENDING' ? 'MIANDRY' : 'VOALOA'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Type d'items */}
      <View style={styles.typeRow}>
        {['ALL', 'DECLARATION', 'PAYMENT'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeButton,
              activeType === type && styles.typeButtonActive
            ]}
            onPress={() => setActiveType(type as ItemType)}
          >
            <Text style={[
              styles.typeButtonText,
              activeType === type && styles.typeButtonTextActive
            ]}>
              {type === 'ALL' ? '📊 REHETRA' : 
               type === 'DECLARATION' ? '📝 FAMARANANA' : '💳 FANDOAVANA'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Statistiques */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>TOTAL</Text>
          <Text style={styles.statValue}>{filteredItems.length}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>FAMARANANA</Text>
          <Text style={styles.statValue}>
            {filteredItems.filter(item => item.type === 'DECLARATION').length}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>FANDOAVANA</Text>
          <Text style={styles.statValue}>
            {filteredItems.filter(item => item.type === 'PAYMENT').length}
          </Text>
        </View>
      </View>

      {/* Reset des filtres */}
      {(activeFilter !== 'ALL' || activeType !== 'ALL' || searchQuery.trim() !== '') && (
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={resetFilters}
        >
          <Text style={styles.resetButtonText}>HAMERINA FILTRE</Text>
        </TouchableOpacity>
      )}
    </View>
  ), [
    searchQuery, 
    activeFilter, 
    activeType, 
    filteredItems.length, 
    resetFilters, 
    getTimeSinceLastRefresh,
    isManualRefreshing
  ]);

  // États de chargement
  if (loading && historyItems.length === 0) {
    return (
      <ProfessionalLayout title="TANTARAN'NY FAMARANANA">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>EO AM-PAMAKIANA NY TANTARA...</Text>
          <Text style={styles.loadingSubtext}>
            Andraso kely azafady
          </Text>
        </View>
      </ProfessionalLayout>
    );
  }

  // État vide
  if (filteredItems.length === 0) {
    const hasActiveFilters = activeFilter !== 'ALL' || activeType !== 'ALL' || searchQuery.trim() !== '';
    
    return (
      <ProfessionalLayout title="TANTARAN'NY FAMARANANA">
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, hasActiveFilters && styles.emptyIconSearch]}>
            <Text style={styles.emptyIconText}>
              {hasActiveFilters ? '🔍' : '📊'}
            </Text>
          </View>
          
          <Text style={styles.emptyTitle}>
            {hasActiveFilters ? 'TSY NAHITANA ZAVATRA' : 'MBOLA TSY MISY TANTARA'}
          </Text>
          
          <Text style={styles.emptyText}>
            {hasActiveFilters 
              ? 'Tsy nahitana zavatra mifanaraka amin\'ny safidy natao.'
              : 'Mbola tsy nisy famaranana na fandoavana natao.'
            }
          </Text>
          
          {/* Info rafraîchissement locale */}
          {lastRefresh && (
            <Text style={styles.emptyRefreshInfo}>
              Farany novaina: {getTimeSinceLastRefresh()}
            </Text>
          )}
          
          <View style={styles.emptyButtons}>
            {hasActiveFilters ? (
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={resetFilters}
              >
                <Text style={styles.emptyButtonText}>HAMERINA FILTRE</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={() => router.push('/(tabs)/declarer')}
                >
                  <Text style={styles.emptyButtonText}>HANATO FAMARANANA</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.emptyButton, styles.secondaryButton]}
                  onPress={onRefresh}
                  disabled={isManualRefreshing}
                >
                  {isManualRefreshing ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.emptyButtonText}>HAMERINA</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ProfessionalLayout>
    );
  }

  // Rendu principal
  return (
    <ProfessionalLayout title="TANTARAN'NY FAMARANANA">
      <View style={styles.container}>
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3498db']}
              tintColor="#3498db"
            />
          }
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
        />
      </View>
    </ProfessionalLayout>
  );
}

// ✅ Styles mis à jour avec corrections
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
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e6ed',
  },
  searchSection: {
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 10,
    fontSize: 16,
    color: '#2c3e50',
    borderWidth: 1,
    borderColor: '#e0e6ed',
  },
  refreshInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refreshInfoText: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  refreshingText: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '700',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#2c3e50',
    borderColor: '#2c3e50',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '700',
  },
  typeButtonTextActive: {
    color: '#ffffff',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2c3e50',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e9ecef',
  },
  resetButton: {
    backgroundColor: '#95a5a6',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7f8c8d',
  },
  resetButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },
  listContent: { 
    paddingBottom: 20,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e6ed',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
  },
  declarationIcon: {
    backgroundColor: '#e8f4fc',
    borderColor: '#3498db',
  },
  paymentIcon: {
    backgroundColor: '#fde8e8',
    borderColor: '#e74c3c',
  },
  typeIconText: {
    fontSize: 20,
  },
  itemInfo: {
    flex: 1,
  },
  itemDescription: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
    marginBottom: 4,
  },
  itemNif: {
    fontSize: 12,
    color: '#95a5a6',
    fontFamily: 'monospace',
  },
  itemTransactionId: {
    fontSize: 12,
    color: '#3498db',
    fontFamily: 'monospace',
    backgroundColor: '#e8f4fc',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  itemAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2c3e50',
  },
  paymentAmount: {
    color: '#e74c3c',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statusIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
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
  emptyIconSearch: {
    backgroundColor: '#95a5a6',
    borderColor: '#7f8c8d',
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
    lineHeight: 22,
    marginBottom: 12,
  },
  emptyRefreshInfo: {
    fontSize: 14,
    color: '#95a5a6',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  emptyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2980b9',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#95a5a6',
    borderColor: '#7f8c8d',
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});