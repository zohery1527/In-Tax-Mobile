import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import ProfessionalLayout from '../../../components/ProfessionalLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { apiService } from '../../../services/api';

const { width } = Dimensions.get('window');

// Types pour les statistiques
interface StatsData {
  summary?: {
    totalDeclarations?: number;
    totalTaxAmount?: number;
    totalPaidAmount?: number;
    pendingAmount?: number;
  };
  byStatus?: {
    status: string;
    count: string;
    totalTax: string;
    totalPaid: string;
  }[];
  totalDeclarations?: number;
  paidDeclarations?: number;
  paymentRate?: string;
  stats?: {
    status: string;
    count: string;
    totalAmount?: string;
    totalTaxAmount?: string;
  }[];
}

export default function AccueilSimpleScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<StatsData>({});
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Déterminer la salutation selon l'heure
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Miarakaria ankafizana');
    else if (hour < 18) setGreeting('Manao ahoana e');
    else setGreeting('Manao ahoana ny hariva');
  }, []);

  // Charger les données
  const loadData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      const [declarationsData, statsData] = await Promise.all([
        apiService.getUserDeclarations(),
        apiService.getDeclarationsStats()
      ]);

      setStats(statsData || {});
      setLastRefresh(new Date());
      
    } catch (error) {
      console.error('Erreur chargement simple:', error);
      
      if (!forceRefresh) {
        Alert.alert('Hadisoana', 'Nisy olana ny fakana ny mombamomba. Andramo indray.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Rafraîchissement manuel
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData(true);
    } catch (error) {
      console.error('Erreur refresh simple:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Chargement automatique
  useEffect(() => {
    loadData();
  }, []);

  // Calcul du temps depuis le dernier rafraîchissement
  const getTimeSinceLastRefresh = () => {
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
      month: '2-digit'
    });
  };

  // Calcul des statistiques
  const calculateStats = () => {
    let pendingCount = 0;
    let payableCount = 0;
    let totalCount = 0;

    if (stats.byStatus && Array.isArray(stats.byStatus)) {
      stats.byStatus.forEach((item: any) => {
        const count = parseInt(item.count) || 0;
        totalCount += count;
        
        if (item.status === 'PENDING' || item.status === 'VALIDATED') {
          pendingCount += count;
        }
        if (item.status === 'VALIDATED' || item.status === 'PARTIALLY_PAID') {
          payableCount += count;
        }
      });
    } else if (stats.stats && Array.isArray(stats.stats)) {
      stats.stats.forEach((item: any) => {
        const count = parseInt(item.count) || 0;
        totalCount += count;
        
        if (item.status === 'PENDING' || item.status === 'VALIDATED') {
          pendingCount += count;
        }
        if (item.status === 'VALIDATED' || item.status === 'PARTIALLY_PAID') {
          payableCount += count;
        }
      });
    } else {
      totalCount = stats.totalDeclarations || 0;
      pendingCount = stats.totalDeclarations ? Math.floor(stats.totalDeclarations * 0.3) : 0;
      payableCount = stats.paidDeclarations || 0;
    }

    return {
      pendingDeclarations: pendingCount,
      payableDeclarations: payableCount,
      totalDeclarations: totalCount
    };
  };

  const { pendingDeclarations, payableDeclarations, totalDeclarations } = calculateStats();

  // Fonction pour ouvrir les liens
  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Hadisoana', 'Tsy afaka sokafana io rohy io');
      }
    } catch (error) {
      console.error('Erreur ouverture lien:', error);
      Alert.alert('Hadisoana', 'Nisy olana ny fanokafana ny rohy');
    }
  };

  // Actions principales - SIMPLES ET CLAIRES
  const mainActions = [
    {
      id: 1,
      title: "HANATO FAMARANANA",
      subtitle: "Ampidiro ny varotrao",
      route: '/(tabs)/declarer',
      color: "#2c3e50",
      icon: "📝"
    },
    {
      id: 2,
      title: "HIJERY TANTARA", 
      subtitle: "Jereo ny famaranana rehetra",
      route: '/historique',
      color: "#34495e",
      icon: "📋"
    },
    {
      id: 3,
      title: "HANDOA VOLA",
      subtitle: "Hanofa vola",
      route: '/payment',
      color: "#27ae60",
      icon: "💳"
    },
    {
      id: 4,
      title: "HAFATRA",
      subtitle: "Ny hafatra rehetra", 
      route: '/notifications',
      color: "#e67e22",
      icon: "🔔"
    }
  ];

  // Aide rapide
  const helpActions = [
    {
      id: 1,
      title: "Antsoy fanampiana",
      subtitle: "034 20 152 72",
      action: () => openLink('tel:+261342015272'),
      icon: "📞",
      color: "#3498db"
    },
    {
      id: 2,
      title: "Fanazavana",
      subtitle: "Fanamarihana momba ny fandoavana",
      action: () => router.push('/Assistant'),
      icon: "❓",
      color: "#9b59b6"
    },
    {
      id: 3,
      title: "Kajy ny hetra",
      subtitle: "Simulateur",
      action: () => router.push('/simulateur'),
      icon: "🧮",
      color: "#f39c12"
    }
  ];

  // Loading
  if (loading && totalDeclarations === 0) {
    return (
      <ProfessionalLayout showHeader={true}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Eo am-pamakiana...</Text>
          <Text style={styles.loadingSubtext}>Andraso kely azafady</Text>
        </View>
      </ProfessionalLayout>
    );
  }

  return (
    <ProfessionalLayout showHeader={true}>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3498db']}
            tintColor="#3498db"
          />
        }
      >
        {/* ✅ Section Bienvenue - SIMPLE */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeHeader}>
            <View style={styles.welcomeTextContainer}>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.userName}>
                {user?.firstName || 'Mpampiasa'} {user?.lastName || ''}
              </Text>
            </View>
            
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/profil')} 
              style={styles.avatarContainer}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>👤</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Informations NIF */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>LAHARANA NIF</Text>
              <Text style={styles.infoValue}>
                {user?.nifNumber || '--/--/----'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>TOERANA</Text>
              <View style={[
                styles.statusBadge,
                user?.nifStatus === 'VALIDATED' 
                  ? styles.statusValid 
                  : styles.statusPending
              ]}>
                <Text style={styles.statusText}>
                  {user?.nifStatus === 'VALIDATED' ? 'EKENA' : 'MIANDRY'}
                </Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.refreshInfo}>
            Farany novaina: {getTimeSinceLastRefresh()}
          </Text>
        </View>

        {/* ✅ Statistiques - SIMPLES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📊</Text>
            <Text style={styles.sectionTitle}>STATISTIKA FAMARANANA</Text>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{totalDeclarations}</Text>
              <Text style={styles.statLabel}>FAMARANANA</Text>
              <Text style={styles.statSubtitle}>Total</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, pendingDeclarations > 0 && styles.statPending]}>
                {pendingDeclarations}
              </Text>
              <Text style={styles.statLabel}>MIANDRY</Text>
              <Text style={styles.statSubtitle}>Eo am-pandinihana</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, payableDeclarations > 0 && styles.statPayable]}>
                {payableDeclarations}
              </Text>
              <Text style={styles.statLabel}>AZO ALOA</Text>
              <Text style={styles.statSubtitle}>Voamarina</Text>
            </View>
          </View>
          
          {/* Barre de progression simple */}
          {totalDeclarations > 0 && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Fahafenoan&apos;ny famaranana: {Math.round((payableDeclarations / totalDeclarations) * 100)}%
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${(payableDeclarations / totalDeclarations) * 100}%` }
                  ]} 
                />
              </View>
            </View>
          )}
        </View>

        {/* ✅ Actions Principales - GRANDES TOUCHES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⚡</Text>
            <Text style={styles.sectionTitle}>ASA ATAO</Text>
          </View>
          
          <View style={styles.actionsGrid}>
            {mainActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.actionCard, { backgroundColor: action.color }]}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.9}
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ✅ Rappels Importants */}
        {(pendingDeclarations > 0 || payableDeclarations > 0 || user?.nifStatus === 'PENDING') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>⚠️</Text>
              <Text style={styles.sectionTitle}>ZAVA-DEHIBE</Text>
            </View>
            
            {pendingDeclarations > 0 && (
              <TouchableOpacity 
                style={styles.reminderCard}
                onPress={() => router.push('/historique?status=PENDING')}
                activeOpacity={0.8}
              >
                <Text style={styles.reminderIcon}>📅</Text>
                <View style={styles.reminderContent}>
                  <Text style={styles.reminderTitle}>
                    {pendingDeclarations} famaranana miandry
                  </Text>
                  <Text style={styles.reminderSubtitle}>
                    Eo am-pandinihana - Jereo ao @ tantara
                  </Text>
                </View>
                <Text style={styles.arrow}>→</Text>
              </TouchableOpacity>
            )}

            {payableDeclarations > 0 && (
              <TouchableOpacity 
                style={styles.reminderCard}
                onPress={() => router.push('/payments/realistic')}
                activeOpacity={0.8}
              >
                <Text style={styles.reminderIcon}>💰</Text>
                <View style={styles.reminderContent}>
                  <Text style={styles.reminderTitle}>
                    {payableDeclarations} azo aloa
                  </Text>
                  <Text style={styles.reminderSubtitle}>
                    Mandeha hanofa eto
                  </Text>
                </View>
                <Text style={styles.arrow}>→</Text>
              </TouchableOpacity>
            )}

            {user?.nifStatus === 'PENDING' && (
              <TouchableOpacity 
                style={styles.reminderCard}
                onPress={() => router.push('/(tabs)/profil')}
                activeOpacity={0.8}
              >
                <Text style={styles.reminderIcon}>🆔</Text>
                <View style={styles.reminderContent}>
                  <Text style={styles.reminderTitle}>
                    NIF mbola miandry
                  </Text>
                  <Text style={styles.reminderSubtitle}>
                    Jereo ny toeranao ao @ profil
                  </Text>
                </View>
                <Text style={styles.arrow}>→</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ✅ Aide Rapide */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>❓</Text>
            <Text style={styles.sectionTitle}>FANAMPIANA</Text>
          </View>
          
          {helpActions.map((help) => (
            <TouchableOpacity
              key={help.id}
              style={styles.helpCard}
              onPress={help.action}
              activeOpacity={0.8}
            >
              <Text style={styles.helpIcon}>{help.icon}</Text>
              <View style={styles.helpContent}>
                <Text style={styles.helpTitle}>{help.title}</Text>
                <Text style={styles.helpSubtitle}>{help.subtitle}</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ✅ Option mode complet */}
        <TouchableOpacity 
          style={styles.modeSwitch}
          onPress={() => router.push('/(tabs)/accueil')}
          activeOpacity={0.9}
        >
          <Text style={styles.modeIcon}>📈</Text>
          <View style={styles.modeTextContainer}>
            <Text style={styles.modeTitle}>Hijery ny endrika feno</Text>
            <Text style={styles.modeSubtitle}>Statistika sy angona bebe kokoa</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        {/* ✅ Pied de page */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            In-Tax - Ny fitaovana fisoratana anarana malagasy
          </Text>
          <Text style={styles.footerCopyright}>
            Version Simplifiée • {new Date().getFullYear()}
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
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  loadingSubtext: { 
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  // SECTION BIENVENUE
  welcomeCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e6ed',
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
  },
  avatarContainer: {
    marginLeft: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e8f4fc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3498db',
  },
  avatarText: {
    fontSize: 28,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '700',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusValid: {
    backgroundColor: '#d4edda',
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  statusPending: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2c3e50',
  },
  refreshInfo: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
  },
  // SECTIONS
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e6ed',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  // STATISTIQUES
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 10,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2c3e50',
    marginBottom: 8,
  },
  statPending: {
    color: '#e74c3c',
  },
  statPayable: {
    color: '#27ae60',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 15,
  },
  progressText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#27ae60',
    borderRadius: 4,
  },
  // ACTIONS
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    padding: 20,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
    minHeight: 140,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  actionSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  // RAPPELS
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  reminderIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  reminderSubtitle: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  arrow: {
    fontSize: 20,
    color: '#95a5a6',
  },
  // AIDE
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  helpIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  helpSubtitle: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  // MODE SWITCH
  modeSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#34495e',
  },
  modeIcon: {
    fontSize: 28,
    color: '#fff',
    marginRight: 15,
  },
  modeTextContainer: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modeSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  // PIED DE PAGE
  footer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 10,
  },
  footerText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 6,
  },
  footerCopyright: {
    fontSize: 12,
    color: '#bdc3c7',
    textAlign: 'center',
  },
});