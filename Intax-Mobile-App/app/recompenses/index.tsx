import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import ProfessionalLayout from '../../components/ProfessionalLayout';
import { apiService } from '../../services/api';

// Interface pour les badges
interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradient: string[];
  unlocked: boolean;
  progress: number;
  reward: string;
  requirement: string;
  currentValue: string;
}

// Interface pour les statistiques
interface UserStats {
  totalDeclarations: number;
  pendingDeclarations: number;
  paidDeclarations: number;
  rejectedDeclarations: number;
  totalAmountDeclared: number;
  totalPaidAmount: number;
  paymentRate: number;
  monthsSinceCreation: number;
  isNewUser: boolean;
  totalPayments: number;
  successfulPayments: number;
}

export default function RecompensesScreen() {
  const router = useRouter();
  
  // ✅ ÉTATS LOCAUX SIMPLIFIÉS
  const [declarations, setDeclarations] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // ======================
  // ✅ CHARGEMENT DES DONNÉES
  // ======================
  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      console.log('📥 Chargement des données récompenses...');
      
      const [userProfile, userDeclarations, userPayments] = await Promise.all([
        apiService.getProfile(),
        apiService.getUserDeclarations(),
        apiService.getPaymentHistory()
      ]);
      
      setUser(userProfile);
      setDeclarations(userDeclarations);
      setPayments(userPayments.payments || []);
      setLastRefresh(new Date());
      
      console.log('✅ Données récompenses chargées:', { 
        user: !!userProfile, 
        declarations: userDeclarations.length, 
        payments: (userPayments.payments || []).length 
      });
      
    } catch (error: any) {
      console.error('❌ Erreur chargement récompenses:', error);
      Alert.alert('Hadisoana', 'Tsy afaka naka ny angona valisoa. Andramo indray.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Chargement initial
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ✅ Rafraîchissement manuel simplifié
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData(true);
    } catch (error) {
      console.error('❌ Erreur refresh récompenses:', error);
    } finally {
      setRefreshing(false);
    }
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
    
    return lastRefresh.toLocaleDateString('fr-MG', {
      day: '2-digit',
      month: '2-digit'
    });
  }, [lastRefresh]);

  // ======================
  // ✅ CALCUL DES STATISTIQUES
  // ======================
  const calculateRealStats = useCallback((): UserStats => {
    const safeDeclarations = Array.isArray(declarations) ? declarations : [];
    const totalDeclarations = safeDeclarations.length;

    const pendingDeclarations = safeDeclarations.filter(decl => {
      const status = decl?.status?.toUpperCase?.() || '';
      return ['PENDING', 'SUBMITTED', 'EN_ATTENTE', 'DRAFT'].includes(status);
    }).length;

    const paidDeclarations = safeDeclarations.filter(decl => {
      const status = decl?.status?.toUpperCase?.() || '';
      return ['PAID', 'VALIDATED', 'APPROVED', 'COMPLETED'].includes(status);
    }).length;

    const rejectedDeclarations = safeDeclarations.filter(decl => {
      const status = decl?.status?.toUpperCase?.() || '';
      return ['REJECTED'].includes(status);
    }).length;

    // Calcul des montants
    const totalAmountDeclared = safeDeclarations.reduce((sum, decl) => {
      const amount = Number(decl?.taxAmount) || Number(decl?.amount) || 0;
      return isNaN(amount) ? sum : sum + amount;
    }, 0);

    const totalPaidAmount = safeDeclarations
      .filter(decl => ['PAID', 'VALIDATED', 'COMPLETED'].includes(decl?.status?.toUpperCase?.()))
      .reduce((sum, decl) => {
        const amount = Number(decl?.taxAmount) || Number(decl?.amount) || 0;
        return isNaN(amount) ? sum : sum + amount;
      }, 0);

    // Taux basé sur les déclarations payées
    const paymentRate = totalDeclarations > 0 ? Math.round((paidDeclarations / totalDeclarations) * 100) : 0;

    // Estimation de l'ancienneté
    const monthsSinceCreation = user?.createdAt ? 
      Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 3;

    const safePayments = Array.isArray(payments) ? payments : [];
    const totalPayments = safePayments.length;
    const successfulPayments = safePayments.filter(p => 
      p.status === 'SUCCESS' || p.status === 'COMPLETED' || p.status === 'PAID'
    ).length;

    return {
      totalDeclarations,
      pendingDeclarations,
      paidDeclarations,
      rejectedDeclarations,
      totalAmountDeclared,
      totalPaidAmount,
      paymentRate,
      monthsSinceCreation,
      isNewUser: monthsSinceCreation < 1,
      totalPayments,
      successfulPayments
    };
  }, [declarations, payments, user]);

  // ======================
  // ✅ GÉNÉRATION DES BADGES
  // ======================
  const generateRealBadges = useCallback((): Badge[] => {
    const userStats = calculateRealStats();
    const {
      totalDeclarations,
      paidDeclarations,
      paymentRate,
      totalPayments,
      monthsSinceCreation,
      totalPaidAmount,
      pendingDeclarations,
      successfulPayments
    } = userStats;

    const badges: Badge[] = [
      {
        id: 1,
        name: 'MPIVAROTRA VAOVAO',
        description: 'Nanao famaranana voalohany',
        icon: '🎯',
        color: '#667eea',
        gradient: ['#667eea', '#764ba2'],
        unlocked: totalDeclarations >= 1,
        progress: Math.min((totalDeclarations / 1) * 100, 100),
        reward: 'Mari-pankasitrahana',
        requirement: '1 famaranana',
        currentValue: `${totalDeclarations}/1`
      },
      {
        id: 2,
        name: 'MPIVAROTRA MAZOTO',
        description: 'Nanao famaranana 5',
        icon: '⭐',
        color: '#f39c12',
        gradient: ['#f39c12', '#e67e22'],
        unlocked: totalDeclarations >= 5,
        progress: Math.min((totalDeclarations / 5) * 100, 100),
        reward: 'Tombony 5%',
        requirement: '5 famaranana',
        currentValue: `${totalDeclarations}/5`
      },
      {
        id: 3,
        name: 'MPIVAROTRA AMBONY',
        description: 'Nanao famaranana 10',
        icon: '🏆',
        color: '#e74c3c',
        gradient: ['#e74c3c', '#c0392b'],
        unlocked: totalDeclarations >= 10,
        progress: Math.min((totalDeclarations / 10) * 100, 100),
        reward: 'Tombony 10%',
        requirement: '10 famaranana',
        currentValue: `${totalDeclarations}/10`
      },
      {
        id: 4,
        name: 'MPANDOA TSARA',
        description: 'Tahan\'ny fandoavana 100%',
        icon: '💰',
        color: '#27ae60',
        gradient: ['#27ae60', '#2ecc71'],
        unlocked: paymentRate >= 100 && totalDeclarations > 0,
        progress: paymentRate,
        reward: 'Fahafahana manokana',
        requirement: '100% fandoavana',
        currentValue: `${paymentRate}%`
      },
      {
        id: 5,
        name: 'MPANAO FAMARANANA MATETIKA',
        description: 'Nanao famaranana 3 volana misesy',
        icon: '📅',
        color: '#9b59b6',
        gradient: ['#9b59b6', '#8e44ad'],
        unlocked: monthsSinceCreation >= 3 && totalDeclarations >= 3,
        progress: Math.min((monthsSinceCreation / 3) * 100, 100),
        reward: 'Laharana VIP',
        requirement: '3 volana misesy',
        currentValue: `${monthsSinceCreation} volana`
      },
      {
        id: 6,
        name: 'MPANDOA BE',
        description: 'Nandoa hetra 500,000 Ar',
        icon: '💎',
        color: '#1abc9c',
        gradient: ['#1abc9c', '#16a085'],
        unlocked: totalPaidAmount >= 500000,
        progress: Math.min((totalPaidAmount / 500000) * 100, 100),
        reward: 'Sata manokana',
        requirement: '500,000 Ar voaloa',
        currentValue: `${Math.floor(totalPaidAmount / 1000)}k Ar`
      },
      {
        id: 7,
        name: 'MPIKAMBANA VAOVAO',
        description: 'Nisoratra anarana vao haingana',
        icon: '👋',
        color: '#3498db',
        gradient: ['#3498db', '#2980b9'],
        unlocked: userStats.isNewUser,
        progress: userStats.isNewUser ? 100 : 0,
        reward: 'Fiarahabana',
        requirement: 'Mpikambana vaovao',
        currentValue: userStats.isNewUser ? 'VAOVAO' : 'EFA ELA'
      },
      {
        id: 8,
        name: 'MPANARA-DALÀNA',
        description: 'Tsy nisy famaranana tara',
        icon: '⚖️',
        color: '#2c3e50',
        gradient: ['#2c3e50', '#34495e'],
        unlocked: pendingDeclarations === 0 && totalDeclarations > 0,
        progress: pendingDeclarations === 0 && totalDeclarations > 0 ? 100 : 0,
        reward: 'Mari-pankasitrahana',
        requirement: 'Tsy misy tara',
        currentValue: `${pendingDeclarations} mbola andrasana`
      },
      {
        id: 9,
        name: 'MPAMPIASA MAHAY',
        description: 'Nampiasa ny aplikasiona 3 volana',
        icon: '📱',
        color: '#e67e22',
        gradient: ['#e67e22', '#d35400'],
        unlocked: monthsSinceCreation >= 3,
        progress: Math.min((monthsSinceCreation / 3) * 100, 100),
        reward: 'Mpitandrina',
        requirement: '3 volana mpikambana',
        currentValue: `${monthsSinceCreation} volana`
      },
      {
        id: 10,
        name: 'MPANOHY FOANA',
        description: 'Nanao fandoavana 5',
        icon: '💳',
        color: '#27ae60',
        gradient: ['#27ae60', '#2ecc71'],
        unlocked: successfulPayments >= 5,
        progress: Math.min((successfulPayments / 5) * 100, 100),
        reward: 'Fahafahana manokana',
        requirement: '5 fandoavana',
        currentValue: `${successfulPayments}/5`
      }
    ];

    return badges;
  }, [calculateRealStats]);

  // ======================
  // ✅ COMPOSANT BADGE
  // ======================
  const BadgeCard = React.useCallback(({ badge }: { badge: Badge }) => (
    <TouchableOpacity 
      style={[styles.badgeCard, !badge.unlocked && styles.badgeLocked]}
      onPress={() => {
        if (badge.unlocked) {
          Alert.alert(
            '🎉 VALISOA VOAHAZO!',
            `Tonga soa! Nahazo ny mari-boninahitra "${badge.name}" ianao.\n\n${badge.description}`,
            [{ text: 'OK', style: 'default' }]
          );
        } else {
          Alert.alert(
            '🔒 MBOLA TSY VOAHAZO',
            `${badge.description}\n\nTAKIANA: ${badge.requirement}\n\nEFA NAHAZO: ${badge.currentValue}`,
            [{ text: 'OK', style: 'default' }]
          );
        }
      }}
    >
      <View style={[styles.badgeIcon, { backgroundColor: badge.color }]}>
        <Text style={styles.badgeIconText}>{badge.icon}</Text>
      </View>
      
      <View style={styles.badgeContent}>
        <Text style={styles.badgeName}>{badge.name}</Text>
        <Text style={styles.badgeDescription}>{badge.description}</Text>
        <Text style={styles.badgeReward}>🎁 {badge.reward}</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill, 
                { width: `${badge.progress}%`, backgroundColor: badge.color }
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(badge.progress)}%</Text>
        </View>

        <Text style={styles.currentValueText}>EFA NAHAZO: {badge.currentValue}</Text>
        {!badge.unlocked && (
          <Text style={styles.requirementText}>TAKIANA: {badge.requirement}</Text>
        )}
      </View>

      {badge.unlocked ? (
        <View style={[styles.statusBadge, { backgroundColor: badge.color }]}>
          <Text style={styles.statusBadgeText}>✅</Text>
        </View>
      ) : (
        <View style={styles.statusBadgeLocked}>
          <Text style={styles.statusBadgeText}>🔒</Text>
        </View>
      )}
    </TouchableOpacity>
  ), []);

  // ======================
  // ✅ NIVEAU UTILISATEUR
  // ======================
  const getUserLevel = useCallback(() => {
    const userStats = calculateRealStats();
    const { totalDeclarations, paymentRate, monthsSinceCreation } = userStats;

    if (totalDeclarations >= 10 && paymentRate >= 80 && monthsSinceCreation >= 6) {
      return { 
        level: 'MASTER', 
        color: '#e74c3c', 
        gradient: ['#e74c3c', '#c0392b'], 
        description: 'MPIVAROTRA AMBONY' 
      };
    }
    if (totalDeclarations >= 5 && paymentRate >= 60 && monthsSinceCreation >= 3) {
      return { 
        level: 'EXPERT', 
        color: '#f39c12', 
        gradient: ['#f39c12', '#e67e22'], 
        description: 'MPIVAROTRA MAHAY' 
      };
    }
    if (totalDeclarations >= 2 && paymentRate >= 40) {
      return { 
        level: 'INTERMEDIAIRE', 
        color: '#3498db', 
        gradient: ['#3498db', '#2980b9'], 
        description: 'MPIVAROTRA MAZOTO' 
      };
    }
    return { 
      level: 'DEBUTANT', 
      color: '#27ae60', 
      gradient: ['#27ae60', '#2ecc71'], 
      description: 'MPIVAROTRA VAOVAO' 
    };
  }, [calculateRealStats]);

  // ======================
  // ✅ ÉTATS DE CHARGEMENT
  // ======================
  if (loading && declarations.length === 0) {
    return (
      <ProfessionalLayout title="VALISOA">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>EO AM-PAMAKIANA NY VALISOA...</Text>
          <Text style={styles.loadingSubtext}>
            Andraso kely azafady
          </Text>
        </View>
      </ProfessionalLayout>
    );
  }

  // ======================
  // ✅ CALCUL DES DONNÉES FINALES
  // ======================
  const userStats = calculateRealStats();
  const badges = generateRealBadges();
  const unlockedBadges = badges.filter(badge => badge.unlocked).length;
  const totalBadges = badges.length;
  const completionRate = totalBadges > 0 ? Math.round((unlockedBadges / totalBadges) * 100) : 0;
  const userLevel = getUserLevel();

  // Formater le montant pour l'affichage
  const formatAmount = (amount: number): string => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M Ar`;
    } else if (amount >= 1000) {
      return `${Math.floor(amount / 1000)}k Ar`;
    }
    return `${amount} Ar`;
  };

  return (
    <ProfessionalLayout title="VALISOA">
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
        {/* ✅ En-tête avec info rafraîchissement locale */}
        <View style={[styles.headerCard, { backgroundColor: userLevel.color }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.headerTitle}>ETO NY VALISOA! 🎉</Text>
                <Text style={styles.headerSubtitle}>
                  {user?.firstName} {user?.lastName} - {userLevel.description}
                </Text>
              </View>
              
              {/* ✅ Info rafraîchissement locale */}
              <View style={styles.refreshInfo}>
                <Text style={styles.refreshInfoText}>
                  Farany novaina: {getTimeSinceLastRefresh()}
                </Text>
              </View>
            </View>
            
            <View style={styles.realStats}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>FAMARANANA:</Text>
                <Text style={styles.statValue}>{userStats.totalDeclarations}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>VOALOA:</Text>
                <Text style={styles.statValue}>{userStats.paidDeclarations}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>TAHAN-DANDOA:</Text>
                <Text style={styles.statValue}>{userStats.paymentRate}%</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>TOTAL VOALOA:</Text>
                <Text style={styles.statValue}>{formatAmount(userStats.totalPaidAmount)}</Text>
              </View>
            </View>

            <View style={styles.userLevelBadge}>
              <View style={[styles.levelBadge, { backgroundColor: userLevel.color }]}>
                <Text style={styles.levelText}>HALAVAN-TSATA {userLevel.level}</Text>
              </View>
            </View>
          </View>
          <View style={styles.trophyContainer}>
            <Text style={styles.trophyIcon}>🏆</Text>
            <Text style={styles.trophyText}>{unlockedBadges}</Text>
          </View>
        </View>

        {/* Statistiques des récompenses */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <View style={[styles.statCircle, { backgroundColor: '#3498db' }]}>
              <Text style={styles.statNumber}>{unlockedBadges}</Text>
            </View>
            <Text style={styles.statLabel}>VOAHAZO</Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statCircle, { backgroundColor: '#9b59b6' }]}>
              <Text style={styles.statNumber}>{totalBadges}</Text>
            </View>
            <Text style={styles.statLabel}>TOTAL</Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statCircle, { backgroundColor: '#27ae60' }]}>
              <Text style={styles.statNumber}>{completionRate}%</Text>
            </View>
            <Text style={styles.statLabel}>VITA</Text>
          </View>
        </View>

        {/* Progression générale */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>FANDROSOANA ANKAPOBENY</Text>
            <Text style={styles.progressPercent}>{completionRate}%</Text>
          </View>
          <View style={styles.progressBarLarge}>
            <View 
              style={[styles.progressFillLarge, { 
                width: `${completionRate}%`, 
                backgroundColor: '#27ae60' 
              }]}
            />
          </View>
          <Text style={styles.progressSubtitle}>
            {unlockedBadges} amin&apos;ny {totalBadges} mari-boninahitra voalohany
          </Text>
        </View>

        {/* Badges */}
        <View style={styles.badgesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⭐</Text>
            <Text style={styles.sectionTitle}>MARI-BONINAHITRA ({totalBadges} TOTAL)</Text>
          </View>
          
          <View style={styles.badgesGrid}>
            {badges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/declarer')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#3498db' }]}>
              <Text style={styles.quickActionIconText}>📝</Text>
            </View>
            <Text style={styles.quickActionText}>HANATO</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('/historique')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#9b59b6' }]}>
              <Text style={styles.quickActionIconText}>📊</Text>
            </View>
            <Text style={styles.quickActionText}>TANTARA</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('/payments/realistic')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#27ae60' }]}>
              <Text style={styles.quickActionIconText}>💳</Text>
            </View>
            <Text style={styles.quickActionText}>HANDOA</Text>
          </TouchableOpacity>
        </View>

        {/* Message de motivation */}
        <View style={styles.motivationSection}>
          <View style={[styles.motivationCard, { backgroundColor: '#3498db' }]}>
            <Text style={styles.motivationIcon}>🚀</Text>
            <Text style={styles.motivationTitle}>ANDRAMO BE KOKOA!</Text>
            <Text style={styles.motivationText}>
              Isaky ny famaranana ataonao dia manandratra ny laharanao ianao 
              ary mahazo valisoa tsara kokoa. Efa nahazo {unlockedBadges} mari-boninahitra ianao!
            </Text>
          </View>
        </View>
        
        {/* ✅ Pied de page avec info rafraîchissement locale */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Ny statistika dia mifototra amin&apos;ny angona azo.
          </Text>
          <Text style={styles.footerRefreshInfo}>
            Farany novaina: {getTimeSinceLastRefresh()}
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
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flex: 1,
  },
  headerTop: {
    marginBottom: 16,
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
    marginBottom: 8,
  },
  refreshInfo: {
    marginTop: 8,
  },
  refreshInfoText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
  },
  realStats: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  userLevelBadge: {
    alignSelf: 'flex-start',
  },
  levelBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  trophyContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  trophyIcon: {
    fontSize: 28,
    color: '#ffffff',
  },
  trophyText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 4,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e6ed',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  progressSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e6ed',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: '800',
    color: '#27ae60',
  },
  progressBarLarge: {
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFillLarge: {
    height: '100%',
    borderRadius: 4,
  },
  progressSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  badgesSection: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2c3e50',
    textTransform: 'uppercase',
  },
  badgesGrid: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e6ed',
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  badgeLocked: {
    opacity: 0.7,
  },
  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeIconText: {
    fontSize: 24,
    color: '#ffffff',
  },
  badgeContent: {
    flex: 1,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2c3e50',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  badgeReward: {
    fontSize: 11,
    color: '#27ae60',
    fontWeight: '700',
    marginBottom: 6,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: '#7f8c8d',
    fontWeight: '700',
    minWidth: 30,
  },
  currentValueText: {
    fontSize: 10,
    color: '#3498db',
    fontWeight: '700',
    marginBottom: 2,
  },
  requirementText: {
    fontSize: 10,
    color: '#e74c3c',
    fontStyle: 'italic',
  },
  statusBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  statusBadgeLocked: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#95a5a6',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  statusBadgeText: {
    fontSize: 16,
    color: '#ffffff',
  },
  quickActions: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 20,
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
  quickAction: {
    flex: 1,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  quickActionIconText: {
    fontSize: 20,
    color: '#ffffff',
  },
  quickActionText: {
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '700',
    textAlign: 'center',
  },
  motivationSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  motivationCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e6ed',
  },
  motivationIcon: {
    fontSize: 28,
    color: '#ffffff',
    marginBottom: 8,
  },
  motivationTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  motivationText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
    marginBottom: 6,
  },
  footerRefreshInfo: {
    fontSize: 11,
    color: '#bdc3c7',
    fontStyle: 'italic',
  },
});