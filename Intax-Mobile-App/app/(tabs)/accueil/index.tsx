import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Icons } from '../../../components/Icons';
import ProfessionalLayout from '../../../components/ProfessionalLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { apiService, Declaration } from '../../../services/api';

const { width } = Dimensions.get('window');

// Interface pour les statistiques
interface DashboardStats {
  total: number;
  paid: number;
  pending: number;
  validated: number;
  payable?: number;
}

export default function AccueilScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    paid: 0,
    pending: 0,
    validated: 0,
    payable: 0,
  });
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

  // ✅ Charger les données
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [declarations, statsResponse] = await Promise.all([
        apiService.getUserDeclarations(),
        apiService.getDeclarationsStats()
      ]);

      const statsData: DashboardStats = {
        total: declarations.length,
        paid: declarations.filter((d: Declaration) => d.status === 'PAID').length,
        pending: declarations.filter((d: Declaration) => 
          d.status === 'PENDING' || d.status === 'PARTIALLY_PAID'
        ).length,
        validated: declarations.filter((d: Declaration) => 
          d.status === 'VALIDATED'
        ).length,
        payable: declarations.filter((d: Declaration) => 
          (d.status === 'VALIDATED' || d.status === 'PARTIALLY_PAID') && 
          d.remainingAmount > 0
        ).length,
      };

      setStats(statsData);
      setLastRefresh(new Date());
      
    } catch (error: any) {
      console.error('Erreur chargement accueil:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Rafraîchissement manuel
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (error) {
      console.error('Erreur refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  // ✅ Chargement automatique
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ✅ Calcul du temps depuis le dernier rafraîchissement
  const getTimeSinceLastRefresh = useCallback(() => {
    if (!lastRefresh) return 'Tsy mbola natao';
    
    const now = new Date();
    const diff = now.getTime() - lastRefresh.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Avy hatrany';
    if (minutes < 60) return `${minutes} min lasa`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ora lasa`;
    
    return lastRefresh.toLocaleTimeString('fr-MG', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [lastRefresh]);

  // ✅ Configuration des actions rapides - SIMPLES ET CLAIRES
  const quickActions = [
    {
      id: 1,
      title: "HANATO FAMARANANA",
      subtitle: "Ampidiro ny varotrao",
      icon: <Icons.FileText size={32} color="#fff" />,
      bgColor: "#2c3e50", // Couleur sobre
      route: '/(tabs)/declarer'
    },
    {
      id: 2,
      title: "HIJERY TANTARA", 
      subtitle: "Jereo ny famaranana rehetra",
      icon: <Icons.History size={32} color="#fff" />,
      bgColor: "#34495e",
      route: '/historique'
    },
    {
      id: 3,
      title: "HANDOA VOLA",
      subtitle: stats.payable ? `${stats.payable} azo aloa` : "Hanofa vola",
      icon: <Icons.CreditCard size={32} color="#fff" />,
      bgColor: "#27ae60",
      route: '/payments/realistic'
    },
    {
      id: 4,
      title: "HAFATRA",
      subtitle: "Ny hafatra rehetra", 
      icon: <Icons.Bell size={32} color="#fff" />,
      bgColor: "#e67e22",
      route: '/notifications'
    }
  ];

  // ✅ Formatage des nombres
  const formatNumber = (num: number): string => {
    return num.toLocaleString('mg-MG');
  };

  // ✅ Loading
  if (loading && !refreshing) {
    return (
      <ProfessionalLayout showHeader={true}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Eo am-pamakiana ny angona...</Text>
          <Text style={styles.loadingSubtext}>Andraso kely azafady</Text>
        </View>
      </ProfessionalLayout>
    );
  }

  return (
    <ProfessionalLayout showHeader={true}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3498db']}
            tintColor="#3498db"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ✅ Section Bienvenue - SIMPLE ET CLAIRE */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeHeader}>
            <View style={styles.welcomeTextContainer}>
              <Text style={styles.greetingText}>{greeting}</Text>
              <Text style={styles.userName}>
                {user?.firstName || 'Mpampiasa'} {user?.lastName || ''}
              </Text>
              <View style={styles.nifBadge}>
                <Text style={styles.nifLabel}>LAHARANA NIF:</Text>
                <Text style={styles.nifValue}>
                  {user?.nifNumber || '--/--/----'}
                </Text>
                {user?.nifStatus === 'VALIDATED' ? (
                  <View style={[styles.statusDot, styles.statusValid]} />
                ) : (
                  <View style={[styles.statusDot, styles.statusPending]} />
                )}
              </View>
            </View>
            
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/profil')} 
              style={styles.avatarContainer}
            >
              <View style={styles.avatar}>
                <Icons.User size={28} color="#3498db" />
              </View>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.refreshInfo}>
            Farany novaina: {getTimeSinceLastRefresh()}
          </Text>
        </View>

        {/* ✅ Section Statistiques - GRAND ET CLAIR */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icons.BarChart3 size={24} color="#2c3e50" />
            <Text style={styles.sectionTitle}>STATISTIKA FAMARANANA</Text>
          </View>
          
          <View style={styles.statsGrid}>
            {/* Carte Stat 1 - Total */}
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => router.push('/historique')}
            >
              <View style={[styles.statIcon, { backgroundColor: '#3498db' }]}>
                <Icons.FileText size={24} color="#fff" />
              </View>
              <Text style={styles.statNumber}>{formatNumber(stats.total)}</Text>
              <Text style={styles.statLabel}>FAMARANANA</Text>
              <Text style={styles.statSubtitle}>Total</Text>
            </TouchableOpacity>

            {/* Carte Stat 2 - Payés */}
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => router.push('/historique?status=PAID')}
            >
              <View style={[styles.statIcon, { backgroundColor: '#27ae60' }]}>
                <Icons.CheckCircle size={24} color="#fff" />
              </View>
              <Text style={styles.statNumber}>{formatNumber(stats.paid)}</Text>
              <Text style={styles.statLabel}>VOALOA</Text>
              <Text style={styles.statSubtitle}>Tapitra</Text>
            </TouchableOpacity>

            {/* Carte Stat 3 - Validés */}
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => router.push('/historique?status=VALIDATED')}
            >
              <View style={[styles.statIcon, { backgroundColor: '#f39c12' }]}>
                <Icons.Verified size={24} color="#fff" />
              </View>
              <Text style={styles.statNumber}>{formatNumber(stats.validated)}</Text>
              <Text style={styles.statLabel}>VOAMARINA</Text>
              <Text style={styles.statSubtitle}>Azo aloa</Text>
            </TouchableOpacity>

            {/* Carte Stat 4 - En attente */}
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => router.push('/historique?status=PENDING')}
            >
              <View style={[styles.statIcon, { backgroundColor: '#e74c3c' }]}>
                <Icons.Clock size={24} color="#fff" />
              </View>
              <Text style={styles.statNumber}>{formatNumber(stats.pending)}</Text>
              <Text style={styles.statLabel}>MIANDRY</Text>
              <Text style={styles.statSubtitle}>Eo am-pandinihana</Text>
            </TouchableOpacity>
          </View>
          
          {/* Barre de progression simple */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>Fahafenoan&apos;ny famaranana:</Text>
              <Text style={styles.progressPercent}>
                {stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${stats.total > 0 ? (stats.paid / stats.total) * 100 : 0}%` 
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressInfo}>
              {stats.paid} voaloa amin&apos;ny {stats.total}
            </Text>
          </View>
        </View>

        {/* ✅ Actions Rapides - GRANDES TOUCHES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icons.Zap size={24} color="#2c3e50" />
            <Text style={styles.sectionTitle}>ASA HAINGANA</Text>
          </View>
          
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.actionCard, { backgroundColor: action.bgColor }]}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.9}
              >
                <View style={styles.actionIcon}>
                  {action.icon}
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ✅ Rappels - IMPORTANT */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icons.Bell size={24} color="#2c3e50" />
            <Text style={styles.sectionTitle}>ZAVA-DEHIBE</Text>
          </View>
          
          {stats.pending > 0 && (
            <View style={styles.reminderCard}>
              <View style={styles.reminderIconContainer}>
                <Icons.AlertTriangle size={28} color="#e74c3c" />
              </View>
              <View style={styles.reminderContent}>
                <Text style={styles.reminderTitle}>
                  {stats.pending} famaranana miandry
                </Text>
                <Text style={styles.reminderSubtitle}>
                  Eo am-pandinihana - Jereo ao @ tantara
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.reminderButton}
                onPress={() => router.push('/historique?status=PENDING')}
              >
                <Icons.ChevronRight size={24} color="#3498db" />
              </TouchableOpacity>
            </View>
          )}

          {(stats.payable || 0) > 0 && (
            <View style={styles.reminderCard}>
              <View style={styles.reminderIconContainer}>
                <Icons.DollarSign size={28} color="#27ae60" />
              </View>
              <View style={styles.reminderContent}>
                <Text style={styles.reminderTitle}>
                  {stats.payable} famaranana azo aloa
                </Text>
                <Text style={styles.reminderSubtitle}>
                  Mandeha hanofa eto
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.reminderButton}
                onPress={() => router.push('/payments/realistic')}
              >
                <Icons.ChevronRight size={24} color="#3498db" />
              </TouchableOpacity>
            </View>
          )}

          {user?.nifStatus === 'PENDING' && (
            <View style={styles.reminderCard}>
              <View style={styles.reminderIconContainer}>
                <Icons.Info size={28} color="#f39c12" />
              </View>
              <View style={styles.reminderContent}>
                <Text style={styles.reminderTitle}>
                  NIF mbola miandry
                </Text>
                <Text style={styles.reminderSubtitle}>
                  Jereo ny toeranao ao @ profil
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.reminderButton}
                onPress={() => router.push('/(tabs)/profil')}
              >
                <Icons.ChevronRight size={24} color="#3498db" />
              </TouchableOpacity>
            </View>
          )}

          {stats.pending === 0 && (stats.payable || 0) === 0 && user?.nifStatus !== 'PENDING' && (
            <View style={styles.noReminders}>
              <Icons.CheckCircle size={48} color="#27ae60" />
              <Text style={styles.noRemindersText}>
                Tsy misy zavatra ilaina ankehitriny
              </Text>
              <Text style={styles.noRemindersSubtext}>
                Efa vita ny asa rehetra!
              </Text>
            </View>
          )}
        </View>

        {/* ✅ Information utile */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Icons.Info size={24} color="#3498db" />
            <Text style={styles.infoTitle}>TOROHEVITRA</Text>
          </View>
          <Text style={styles.infoText}>
            Ny famaranana atao voalohany isam-bolana dia manome fahafahana 
            miditra amin&apos;ny fanampiana manokana ho an&apos;ny mpanorina.
          </Text>
          <TouchableOpacity 
            style={styles.infoButton}
            onPress={() => router.push('/Assistant')}
          >
            <Text style={styles.infoButtonText}>Fanamarihana bebe kokoa</Text>
            <Icons.ExternalLink size={16} color="#3498db" />
          </TouchableOpacity>
        </View>

        {/* ✅ Pied de page simple */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            In-Tax - Ny fitaovana fisoratana anarana malagasy
          </Text>
          <Text style={styles.footerCopyright}>
            © {new Date().getFullYear()} • Version 2.0
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
  scrollContent: {
    paddingBottom: 30,
    paddingTop: 10,
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
  welcomeCard: {
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
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
  },
  nifBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignSelf: 'flex-start',
  },
  nifLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '600',
    marginRight: 8,
  },
  nifValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '700',
    marginRight: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusValid: {
    backgroundColor: '#27ae60',
  },
  statusPending: {
    backgroundColor: '#f39c12',
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
  refreshInfo: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
  },
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginLeft: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 2,
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  progressContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: '800',
    color: '#27ae60',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#27ae60',
    borderRadius: 4,
  },
  progressInfo: {
    fontSize: 13,
    color: '#7f8c8d',
    textAlign: 'center',
  },
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
  reminderIconContainer: {
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
  reminderButton: {
    padding: 8,
  },
  noReminders: {
    alignItems: 'center',
    padding: 30,
  },
  noRemindersText: {
    fontSize: 16,
    color: '#27ae60',
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  noRemindersSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  infoCard: {
    backgroundColor: '#e8f4fc',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bde0fe',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginLeft: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 22,
    marginBottom: 15,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  infoButtonText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600',
    marginRight: 6,
  },
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