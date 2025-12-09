// app/(tabs)/profil.tsx - VERSION ADAPTÉE POUR PERSONNES ÂGÉES
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

// Types
type NifStatus = 'VALIDATED' | 'PENDING' | 'REJECTED' | 'SUSPENDED';

interface StatsData {
  totalDeclarations?: number;
  paidDeclarations?: number;
  pendingDeclarations?: number;
  validatedDeclarations?: number;
  paymentRate?: number;
}

// Constantes
const NIF_STATUS_CONFIG: Record<NifStatus | string, { text: string; color: string }> = {
  VALIDATED: { text: 'EKENA', color: '#27ae60' },
  PENDING: { text: 'MIANDRY', color: '#f39c12' },
  REJECTED: { text: 'NOLAVINA', color: '#e74c3c' },
  SUSPENDED: { text: 'NOFOANANA', color: '#e67e22' },
  DEFAULT: { text: 'TSY FANTATRA', color: '#95a5a6' }
};

// Fonctions utilitaires
const getNifStatus = (nifStatus?: string): { text: string; color: string } => {
  if (!nifStatus) return NIF_STATUS_CONFIG.DEFAULT;
  return NIF_STATUS_CONFIG[nifStatus as NifStatus] || NIF_STATUS_CONFIG.DEFAULT;
};

const getUserInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName?.charAt(0)?.toUpperCase() || 'M';
  const last = lastName?.charAt(0)?.toUpperCase() || 'P';
  return `${first}${last}`;
};

const getFullName = (firstName?: string, lastName?: string): string => {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`.trim();
  }
  return firstName || lastName || 'Mpampiasa';
};

const formatPhoneNumber = (phone?: string): string => {
  if (!phone) return 'Tsy fantatra';
  if (phone.length === 10) {
    return `${phone.slice(0, 3)} ${phone.slice(3, 5)} ${phone.slice(5, 7)} ${phone.slice(7)}`;
  }
  if (phone.length === 13) {
    return `+${phone.slice(0, 3)} ${phone.slice(3, 5)} ${phone.slice(5, 8)} ${phone.slice(8)}`;
  }
  return phone;
};

export default function ProfilScreen() {
  const { user, logout, refreshUser } = useAuth();
  
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<StatsData>({});
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Chargement des données
  const loadData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      if (forceRefresh) {
        await refreshUser();
      }

      const [declarations, statsData] = await Promise.all([
        apiService.getUserDeclarations(),
        apiService.getDeclarationsStats()
      ]);

      // Calcul des statistiques
      const totalDeclarations = declarations.length;
      const paidDeclarations = declarations.filter(d => d.status === 'PAID').length;
      const pendingDeclarations = declarations.filter(d => d.status === 'PENDING').length;
      const validatedDeclarations = declarations.filter(d => d.status === 'VALIDATED').length;
      const paymentRate = totalDeclarations > 0 
        ? Math.round((paidDeclarations / totalDeclarations) * 100) 
        : 0;

      setStats({
        totalDeclarations,
        paidDeclarations,
        pendingDeclarations,
        validatedDeclarations,
        paymentRate
      });
      
      setLastRefresh(new Date());
      
    } catch (error: any) {
      console.error('Erreur chargement profil:', error);
      
      if (!forceRefresh) {
        Alert.alert(
          'Hadisoana', 
          'Nisy olana ny famakiana ny angona.',
          [
            { text: 'OK', style: 'cancel' },
            { text: 'Andramo indray', onPress: () => loadData(true) }
          ]
        );
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
      console.error('Erreur refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Chargement initial
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

  // Gestion de la déconnexion
  const handleLogout = () => {
    Alert.alert(
      'Hivoaka',
      'Tena te-hivoaka ve ianao?',
      [
        { 
          text: 'Tsia', 
          style: 'cancel'
        },
        { 
          text: 'Eny', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Erreur déconnexion:', error);
              Alert.alert('Hadisoana', 'Nisy olana tamin\'ny fivoahana');
            }
          }
        }
      ]
    );
  };

  // Ouverture de liens
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
      Alert.alert('Hadisoana', 'Nisy olana tamin\'ny fisokafana ny rohy');
    }
  };

  // Données calculées
  const {
    totalDeclarations = 0,
    paidDeclarations = 0,
    pendingDeclarations = 0,
    validatedDeclarations = 0,
    paymentRate = 0
  } = stats;

  // Données utilisateur
  const userInitials = getUserInitials(user?.firstName, user?.lastName);
  const fullName = getFullName(user?.firstName, user?.lastName);
  const formattedPhone = formatPhoneNumber(user?.phoneNumber);
  const zoneName = user?.zone?.name || user?.zoneId?.toString() || 'Tsy voafaritra';
  const nifStatus = getNifStatus(user?.nifStatus);
  const canPay = validatedDeclarations > 0 && user?.nifStatus === 'VALIDATED';

  // Loading state
  if (loading && totalDeclarations === 0) {
    return (
      <ProfessionalLayout title="MOMPA NY KAONTIKO">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Eo am-pamakiana ny mombamomba...</Text>
        </View>
      </ProfessionalLayout>
    );
  }

  return (
    <ProfessionalLayout title="MOMBA NY KAONTIKO">
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
        {/* En-tête profil */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarText}>{userInitials}</Text>
            </View>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{fullName}</Text>
            <Text style={styles.userPhone}>{formattedPhone}</Text>
            
            <View style={styles.nifRow}>
              <View style={[styles.nifBadge, { backgroundColor: nifStatus.color }]}>
                <Text style={styles.nifBadgeText}>NIF</Text>
              </View>
              <View style={styles.nifInfo}>
                <Text style={styles.nifNumber}>{user?.nifNumber || '--/--/----'}</Text>
                <Text style={[styles.nifStatusText, { color: nifStatus.color }]}>
                  {nifStatus.text}
                </Text>
              </View>
            </View>
            
            <Text style={styles.lastUpdateText}>
              Farany novaina: {getTimeSinceLastRefresh()}
            </Text>
          </View>
        </View>

        {/* Statistiques */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📊</Text>
            <Text style={styles.sectionTitle}>STATISTIKA</Text>
          </View>
          
          <View style={styles.statsGrid}>
            {/* Carte 1 - Total */}
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{totalDeclarations}</Text>
              <Text style={styles.statLabel}>FAMARANANA</Text>
              <Text style={styles.statSubtitle}>Total</Text>
            </View>
            
            {/* Carte 2 - Payés */}
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#27ae60' }]}>
                {paidDeclarations}
              </Text>
              <Text style={styles.statLabel}>VOALOA</Text>
              <Text style={styles.statSubtitle}>Tapitra</Text>
            </View>
            
            {/* Carte 3 - Pourcentage */}
            <View style={styles.statCard}>
              <Text style={[
                styles.statNumber, 
                paymentRate >= 80 ? { color: '#27ae60' } : 
                paymentRate >= 50 ? { color: '#f39c12' } : 
                { color: '#e74c3c' }
              ]}>
                {paymentRate}%
              </Text>
              <Text style={styles.statLabel}>TAHANA</Text>
              <Text style={styles.statSubtitle}>Fandoavana</Text>
            </View>
            
            {/* Carte 4 - En attente */}
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#f39c12' }]}>
                {pendingDeclarations}
              </Text>
              <Text style={styles.statLabel}>MIANDRY</Text>
              <Text style={styles.statSubtitle}>Eo am-pandinihana</Text>
            </View>
          </View>
          
          {totalDeclarations > 0 && (
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/historique')}
            >
              <Text style={styles.viewAllText}>HIJERY NY TANTARA ROHETRA</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Informations personnelles */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>👤</Text>
            <Text style={styles.sectionTitle}>INFORMASIONA</Text>
          </View>
          
          <View style={styles.infoSection}>
            <InfoRow label="LAHARANA NIF" value={user?.nifNumber || 'Tsy nomena'} />
            <Separator />
            
            <InfoRow label="KARAZANA ASA" value={user?.activityType || 'Tsy fantatra'} />
            <Separator />
            
            <InfoRow label="FARITRA" value={zoneName} />
            <Separator />
            
            <InfoRow 
              label="SATAN'NY KAONTY" 
              value={user?.isActive ? 'MAVITRIKA' : 'TSY MAVITRIKA'} 
              statusColor={user?.isActive ? '#27ae60' : '#95a5a6'}
            />
            
            {validatedDeclarations > 0 && (
              <>
                <Separator />
                <InfoRow 
                  label="VOAMARINA" 
                  value={`${validatedDeclarations} famaranana`} 
                  statusColor="#27ae60"
                />
              </>
            )}
          </View>
        </View>

        {/* Actions principales */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⚡</Text>
            <Text style={styles.sectionTitle}>ASA ATAO</Text>
          </View>
          
          <View style={styles.actionsGrid}>
            <ActionButton
              title="HANATO FAMARANANA"
              subtitle="Ampidiro ny varotrao"
              icon="📝"
              onPress={() => router.push('/(tabs)/declarer')}
              color="#3498db"
            />
            
            <ActionButton
              title="HIJERY TANTARA"
              subtitle="Ny famaranana rehetra"
              icon="📋"
              onPress={() => router.push('/historique')}
              color="#27ae60"
            />
            
            <ActionButton
              title="HANDOA VOLA"
              subtitle={`Misy ${validatedDeclarations} azo aloa`}
              icon="💳"
              onPress={() => router.push('/payments/realistic')}
              color="#f39c12"
              disabled={!canPay}
            />
            
            <ActionButton
              title="HANONTANY"
              subtitle="Fanazavana sy fanampiana"
              icon="❓"
              onPress={() => router.push('/Assistant')}
              color="#9b59b6"
            />
          </View>
        </View>

        {/* Aide et support */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📞</Text>
            <Text style={styles.sectionTitle}>FANAMPIANA</Text>
          </View>
          
          <View style={styles.helpSection}>
            <HelpButton
              title="Antsoy fanampiana"
              subtitle="034 20 152 72"
              icon="📞"
              onPress={() => openLink('tel:+261342015272')}
            />
            
            <HelpButton
              title="Hanontany amin'olona"
              subtitle="Fanontaniana ary valisoa"
              icon="💬"
              onPress={() => router.push('/Assistant')}
            />
            
            <HelpButton
              title="Kajy ny hetra"
              subtitle="Simulateur"
              icon="🧮"
              onPress={() => router.push('/simulateur')}
            />

            <HelpButton
              title="valisoa"
              subtitle="Laharana misy anao"
              icon="🧮"
              onPress={() => router.push('/recompenses')}
            />
            
            <HelpButton
              title="Torolalana"
              subtitle="Fanamarihana fampiasana"
              icon="📖"
              onPress={() => router.push('/Assistant')}
            />
          </View>
        </View>

        {/* Déconnexion */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutButtonText}>HIVOAKA NY KAONTY</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>IN-TAX</Text>
          <Text style={styles.footerSubtitle}>Fitaovana fisoratana anarana malagasy</Text>
          <Text style={styles.footerVersion}>Version 2.0</Text>
          <Text style={styles.footerCopyright}>
            © {new Date().getFullYear()} - Ny fitaovana fisoratana anarana malagasy
          </Text>
        </View>
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ProfessionalLayout>
  );
}

// Composants internes
interface InfoRowProps {
  label: string;
  value: string;
  statusColor?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, statusColor }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[
      styles.infoValue,
      statusColor && { color: statusColor }
    ]}>
      {value}
    </Text>
  </View>
);

const Separator: React.FC = () => (
  <View style={styles.separator} />
);

interface ActionButtonProps {
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
  color: string;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
  title, 
  subtitle, 
  icon, 
  onPress, 
  color,
  disabled = false 
}) => (
  <TouchableOpacity
    style={[styles.actionButton, { backgroundColor: color }, disabled && styles.actionButtonDisabled]}
    onPress={onPress}
    activeOpacity={0.8}
    disabled={disabled}
  >
    <Text style={styles.actionIcon}>{icon}</Text>
    <Text style={styles.actionTitle}>{title}</Text>
    <Text style={styles.actionSubtitle}>{subtitle}</Text>
  </TouchableOpacity>
);

interface HelpButtonProps {
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
}

const HelpButton: React.FC<HelpButtonProps> = ({ title, subtitle, icon, onPress }) => (
  <TouchableOpacity
    style={styles.helpButton}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={styles.helpIcon}>{icon}</Text>
    <View style={styles.helpContent}>
      <Text style={styles.helpTitle}>{title}</Text>
      <Text style={styles.helpSubtitle}>{subtitle}</Text>
    </View>
    <Text style={styles.helpArrow}>→</Text>
  </TouchableOpacity>
);

// Styles
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
  },
  // En-tête profil
  profileHeader: {
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
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatarLarge: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#3498db',
    borderWidth: 3,
    borderColor: '#2980b9',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileInfo: {
    alignItems: 'center',
  },
  userName: { 
    fontSize: 24, 
    fontWeight: '700', 
    color: '#2c3e50', 
    marginBottom: 8,
    textAlign: 'center',
  },
  userPhone: { 
    fontSize: 16, 
    color: '#7f8c8d', 
    marginBottom: 12,
  },
  nifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  nifBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 12,
  },
  nifBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  nifInfo: {
    flex: 1,
  },
  nifNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 2,
  },
  nifStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
    marginTop: 8,
  },
  // Sections
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
  // Statistiques
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
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
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2c3e50',
    marginBottom: 8,
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
  viewAllButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  // Informations personnelles
  infoSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginHorizontal: 16,
  },
  // Actions principales
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    padding: 20,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
    minHeight: 140,
  },
  actionButtonDisabled: {
    opacity: 0.5,
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
  // Aide et support
  helpSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    marginBottom: 4,
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
  helpArrow: {
    fontSize: 20,
    color: '#95a5a6',
  },
  // Déconnexion
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e74c3c',
  },
  logoutIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  logoutButtonText: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#e74c3c',
  },
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  footerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  footerSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
    textAlign: 'center',
  },
  footerVersion: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 4,
  },
  footerCopyright: {
    fontSize: 12,
    color: '#bdc3c7',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 40,
  },
});