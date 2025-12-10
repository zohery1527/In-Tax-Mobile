import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfessionalLayout from '../../components/ProfessionalLayout';
import { ApiNotification, apiService, NotificationType } from '../../services/api';

export default function NotificationsScreen() {
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Chargement des notifications
  const loadNotifications = useCallback(async () => {
    try {
      const result = await apiService.getUserNotifications(false, 20);
      
      setNotifications(result.notifications || []);
      setUnreadCount(result.unreadCount || 0);
      setLastRefresh(new Date());
      
    } catch (error: any) {
      console.error('❌ Erreur chargement notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
      
      Alert.alert(
        'Hadisoana', 
        error.message || 'Tsy afaka nandray ny fampahatsiahivana. Andramo indray.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
  };

  // Actions sur les notifications
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true, readAt: new Date().toISOString() } 
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      await apiService.markNotificationAsRead(notificationId);
      
    } catch (error: any) {
      console.error('❌ Erreur marquage notification:', error);
      Alert.alert('Hadisoana', 'Tsy afaka namaritika ny fampahatsiahivana ho vakina.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          isRead: true, 
          readAt: new Date().toISOString() 
        }))
      );
      setUnreadCount(0);
      
      await apiService.markAllNotificationsAsRead();
      
      Alert.alert('Fahombiazana', 'Voamarika ho vakina ny fampahatsiahivana rehetra.');
      
    } catch (error: any) {
      console.error('❌ Erreur marquage toutes notifications:', error);
      Alert.alert('Hadisoana', 'Tsy afaka namaritika ny fampahatsiahivana rehetra ho vakina.');
    }
  };

  // Fonctions utilitaires
  const getNotificationIcon = (type: NotificationType): string => {
    const icons: Record<NotificationType, string> = {
      'WELCOME': '👋',
      'NIF_VALIDATED': '✅',
      'NEW_DECLARATION': '📄',
      'PAYMENT_SUCCESS': '💰',
      'MONTHLY_REMINDER': '⏰',
      'MISSING_DECLARATION': '⚠️',
      'OVERDUE_DECLARATION': '🚨',
      'SYSTEM_ALERT': '🔧',
      'NEW_FEATURE': '🌟'
    };
    return icons[type] || '🔔';
  };

  const getNotificationColor = (type: NotificationType): string => {
    const colors: Record<NotificationType, string> = {
      'WELCOME': '#3498db',
      'NIF_VALIDATED': '#27ae60',
      'NEW_DECLARATION': '#2ecc71',
      'PAYMENT_SUCCESS': '#9b59b6',
      'MONTHLY_REMINDER': '#f39c12',
      'MISSING_DECLARATION': '#e67e22',
      'OVERDUE_DECLARATION': '#e74c3c',
      'SYSTEM_ALERT': '#95a5a6',
      'NEW_FEATURE': '#1abc9c'
    };
    return colors[type] || '#3498db';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} min`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)} h`;
    } else if (diffHours < 168) {
      return `${Math.floor(diffHours / 24)} j`;
    } else {
      return date.toLocaleDateString('fr-MG', { day: 'numeric', month: 'short' });
    }
  };

  // Composant NotificationItem
  // eslint-disable-next-line react/display-name
  const NotificationItem = React.memo(({ item }: { item: ApiNotification }) => {
    const icon = getNotificationIcon(item.type);
    const color = getNotificationColor(item.type);
    
    return (
      <TouchableOpacity 
        style={[styles.notificationItem, !item.isRead && styles.unreadNotification]}
        onPress={() => {
          if (!item.isRead) {
            handleMarkAsRead(item.id);
          }
          // Navigation vers le détail
          router.push({
            pathname: '/notifications/[id]',
            params: { id: item.id }
          });
        }}
        activeOpacity={0.85}
      >
        <View style={styles.notificationLeft}>
          <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
            <Text style={[styles.iconText, { color }]}>{icon}</Text>
          </View>
          
          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: color }]} />}
            </View>
            
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {item.message}
            </Text>
            
            <Text style={styles.notificationDate}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.markButton}
          onPress={(e) => {
            e.stopPropagation();
            handleMarkAsRead(item.id);
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={[styles.markIndicator, item.isRead && styles.markIndicatorRead]}>
            {item.isRead ? (
              <Text style={styles.checkIcon}>✓</Text>
            ) : null}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  });

  // États de chargement
  if (loading && notifications.length === 0) {
    return (
      <ProfessionalLayout>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Eo am-pamakiana ny fampahatsiahivana...</Text>
          </View>
        </View>
      </ProfessionalLayout>
    );
  }

  // État vide
  if (notifications.length === 0) {
    return (
      <ProfessionalLayout title="Fampahatsiahivana">
        <SafeAreaView style={styles.emptyContainer}>
          <View style={styles.emptyContent}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>🔔</Text>
            </View>
            
            <Text style={styles.emptyTitle}>Tsy misy fampahatsiahivana</Text>
            <Text style={styles.emptyText}>
              Mbola tsy misy fampahatsiahivana vaovao.{'\n'}
              Ho avy any aoriana any izy ireo!
            </Text>
            
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={onRefresh}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#3498db', '#2980b9']}
                style={styles.refreshButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.refreshButtonText}>Hamerina</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ProfessionalLayout>
    );
  }

  // Rendu principal
  return (
    <ProfessionalLayout title="Fampahatsiahivana">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <LinearGradient 
          colors={['#2c3e50', '#1a2530']} 
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.headerInfo}>
            <View>
              <Text style={styles.headerTitle}>Fampahatsiahivana</Text>
              <Text style={styles.headerSubtitle}>
                {notifications.length} total • {unreadCount} tsy mbola vakina
              </Text>
            </View>
            
            {unreadCount > 0 && (
              <TouchableOpacity 
                style={styles.markAllButton}
                onPress={handleMarkAllAsRead}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#27ae60', '#2ecc71']}
                  style={styles.markAllGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.markAllText}>Vakina rehetra</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
          
          {unreadCount > 0 && (
            <View style={styles.unreadCounter}>
              <Text style={styles.unreadCounterText}>{unreadCount}</Text>
            </View>
          )}
        </LinearGradient>

        {/* Liste des notifications */}
        <FlatList
          data={notifications}
          renderItem={({ item }) => <NotificationItem item={item} />}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#3498db']}
              tintColor="#3498db"
              progressBackgroundColor="#ffffff"
            />
          }
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={() => (
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                Fampahatsiahivana nandritra ity herinandro ity
              </Text>
            </View>
          )}
        />

        {/* Actions rapides */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/accueil')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#3498db' }]}>
              <Text style={styles.actionIconText}>🏠</Text>
            </View>
            <Text style={styles.actionText}>Fandraisana</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/declarer')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#e67e22' }]}>
              <Text style={styles.actionIconText}>📝</Text>
            </View>
            <Text style={styles.actionText}>Hanàto</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/historique')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#9b59b6' }]}>
              <Text style={styles.actionIconText}>📊</Text>
            </View>
            <Text style={styles.actionText}>Tantara</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ProfessionalLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingCard: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    marginTop: 20,
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
  },
  emptyContent: {
    alignItems: 'center',
    width: '100%',
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyIcon: {
    fontSize: 48,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  refreshButton: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 200,
  },
  refreshButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 24,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  markAllButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  markAllGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  markAllText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  unreadCounter: {
    alignSelf: 'flex-start',
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  unreadCounterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 8,
  },
  listHeader: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    marginBottom: 8,
  },
  listHeaderText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  unreadNotification: {
    backgroundColor: '#f8fafc',
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 20,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#5d6d7e',
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationDate: {
    fontSize: 12,
    color: '#95a5a6',
    fontWeight: '500',
  },
  markButton: {
    padding: 8,
    marginLeft: 8,
  },
  markIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markIndicatorRead: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
  },
  checkIcon: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIconText: {
    fontSize: 20,
    color: '#fff',
  },
  actionText: {
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '600',
    textAlign: 'center',
  },
});