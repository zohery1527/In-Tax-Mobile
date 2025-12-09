// app/notifications.tsx - VERSION CORRIGÉE POUR VENDEURS
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
import ProfessionalLayout from '../../components/ProfessionalLayout';
import { ApiNotification, apiService, NotificationType } from '../../services/api';

export default function NotificationsScreen() {
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // ======================
  // ✅ CHARGEMENT DES NOTIFICATIONS
  // ======================
  const loadNotifications = useCallback(async () => {
    try {
      console.log('🔄 Chargement des notifications...');
      
      const result = await apiService.getUserNotifications(false, 20);
      
      setNotifications(result.notifications || []);
      setUnreadCount(result.unreadCount || 0);
      setLastRefresh(new Date());
      
      console.log(`✅ ${result.notifications.length} notifications chargées, ${result.unreadCount} non lues`);
      
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

  // ======================
  // ✅ EFFET DE CHARGEMENT
  // ======================
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
  };

  // ======================
  // ✅ ACTIONS SUR LES NOTIFICATIONS
  // ======================
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      // Mise à jour optimiste
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true, readAt: new Date().toISOString() } 
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Appel API
      await apiService.markNotificationAsRead(notificationId);
      
      console.log(`✅ Notification ${notificationId} marquée comme lue`);
      
    } catch (error: any) {
      // Revenir en arrière en cas d'erreur
      console.error('❌ Erreur marquage notification:', error);
      Alert.alert('Hadisoana', 'Tsy afaka namaritika ny fampahatsiahivana ho vakina.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Mise à jour optimiste
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          isRead: true, 
          readAt: new Date().toISOString() 
        }))
      );
      setUnreadCount(0);
      
      // Appel API
      await apiService.markAllNotificationsAsRead();
      
      Alert.alert('Fahombiazana', 'Voamarika ho vakina ny fampahatsiahivana rehetra.');
      
    } catch (error: any) {
      console.error('❌ Erreur marquage toutes notifications:', error);
      Alert.alert('Hadisoana', 'Tsy afaka namaritika ny fampahatsiahivana rehetra ho vakina.');
    }
  };

  // ======================
  // ✅ FONCTIONS UTILITAIRES
  // ======================
  const getNotificationIcon = (type: NotificationType): string => {
    return apiService.getNotificationIcon(type);
  };

  const getNotificationColor = (type: NotificationType): string => {
    return apiService.getNotificationColor(type);
  };

  const getNotificationAction = (notification: ApiNotification) => {
    const action = apiService.getNotificationAction(notification);
    return () => {
      if (action.url) {
        router.push(action.url);
      }
    };
  };

  const formatDate = (dateString: string) => {
    return apiService.formatNotificationDate(dateString);
  };

  const getNotificationTitle = (type: NotificationType): string => {
    const titles: Record<NotificationType, string> = {
      'WELCOME': 'Tonga soa',
      'NIF_VALIDATED': 'NIF voamarina',
      'NEW_DECLARATION': 'Famaranana vaovao',
      'PAYMENT_SUCCESS': 'Fandoavana nahomby',
      'MONTHLY_REMINDER': 'Fanamarihana fandoavana',
      'MISSING_DECLARATION': 'Tsy nanao famaranana',
      'OVERDUE_DECLARATION': 'Famaranana tafa mihoatra',
      'SYSTEM_ALERT': 'Fampandrenesana rafitra',
      'NEW_FEATURE': 'Tolotra vaovao'
    };
    return titles[type] || 'Fampahatsiahivana';
  };

  // ======================
  // ✅ COMPOSANT DE NOTIFICATION
  // ======================
  // eslint-disable-next-line react/display-name
  const NotificationItem = React.memo(({ item }: { item: ApiNotification }) => {
    const icon = getNotificationIcon(item.type);
    const color = getNotificationColor(item.type);
    const title = item.title || getNotificationTitle(item.type);
    
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
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[color, `${color}DD`]}
          style={styles.notificationIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.notificationIconText}>{icon}</Text>
        </LinearGradient>
        
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle} numberOfLines={1}>
              {title}
            </Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
          
          <View style={styles.notificationFooter}>
            <Text style={styles.notificationDate}>
              {formatDate(item.createdAt)}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: `${color}20` }]}>
              <Text style={[styles.typeText, { color }]}>
                {item.type.toLowerCase().replace('_', ' ')}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.markAsReadButton}
          onPress={(e) => {
            e.stopPropagation();
            handleMarkAsRead(item.id);
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {item.isRead ? (
            <Text style={styles.readIcon}>✅</Text>
          ) : (
            <View style={styles.unreadIndicator} />
          )}
        </TouchableOpacity>
        
      </TouchableOpacity>
    );
  });

  // ======================
  // ✅ ÉTATS DE CHARGEMENT
  // ======================
  if (loading && notifications.length === 0) {
    return (
      <ProfessionalLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Eo am-pamakiana ny fampahatsiahivana...</Text>
        </View>
      </ProfessionalLayout>
    );
  }

  // ======================
  // ✅ ÉTAT VIDE
  // ======================
  if (notifications.length === 0) {
    return (
      <ProfessionalLayout title="Fampahatsiahivana">
        <View style={styles.emptyState}>
          <LinearGradient 
            colors={['#ecf0f1', '#bdc3c7']} 
            style={styles.emptyIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.emptyIconText}>🔔</Text>
          </LinearGradient>
          
          <Text style={styles.emptyTitle}>Tsy misy fampahatsiahivana</Text>
          <Text style={styles.emptyText}>
            Mbola tsy misy fampahatsiahivana vaovao.{'\n'}
            Ho avy any aoriana any izy ireo!
          </Text>
          
          <View style={styles.emptyButtons}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => router.push('/(tabs)/accueil')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#3498db', '#2980b9']}
                style={styles.emptyButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.emptyButtonText}>Hiverina any am-pandraisana</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={onRefresh}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Hamerina</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ProfessionalLayout>
    );
  }

  // ======================
  // ✅ RENDU PRINCIPAL
  // ======================
  return (
    <ProfessionalLayout title="Fampahatsiahivana">
      <View style={styles.container}>
        {/* Header avec statistiques */}
        <LinearGradient 
          colors={['#2c3e50', '#3498db']} 
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Text style={styles.headerIconText}>🔔</Text>
            </View>
            
            <View style={styles.headerTexts}>
              <Text style={styles.headerTitle}>Fampahatsiahivana</Text>
              <Text style={styles.headerSubtitle}>
                {notifications.length} total • {unreadCount} tsy mbola vakina
              </Text>
            </View>
            
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity 
              style={styles.markAllButton} 
              onPress={handleMarkAllAsRead}
              activeOpacity={0.8}
            >
              <LinearGradient 
                colors={['#27ae60', '#2ecc71']} 
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.markAllGradient}
              >
                <Text style={styles.markAllIcon}>✅</Text>
                <Text style={styles.markAllText}>Hamafa rehetra</Text>
              </LinearGradient>
            </TouchableOpacity>
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
          contentContainerStyle={styles.listContent}
        />

        {/* Actions rapides */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/accueil')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#3498db', '#2980b9']}
              style={styles.quickActionIconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.quickActionIcon}>🏠</Text>
            </LinearGradient>
            <Text style={styles.quickActionText}>Fandraisana</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('/historique')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#9b59b6', '#8e44ad']}
              style={styles.quickActionIconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.quickActionIcon}>📊</Text>
            </LinearGradient>
            <Text style={styles.quickActionText}>Tantara</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/declarer')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#e67e22', '#d35400']}
              style={styles.quickActionIconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.quickActionIcon}>📝</Text>
            </LinearGradient>
            <Text style={styles.quickActionText}>Hanàto</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/profil')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#27ae60', '#2ecc71']}
              style={styles.quickActionIconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.quickActionIcon}>👤</Text>
            </LinearGradient>
            <Text style={styles.quickActionText}>Profil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ProfessionalLayout>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
  loadingText: { 
    marginTop: 16, 
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    padding: 20,
    margin: 16,
    marginBottom: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerIconText: {
    fontSize: 24,
  },
  headerTexts: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#e74c3c',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  markAllButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  markAllGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  markAllText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
    backgroundColor: '#f0f8ff',
    transform: [{ scale: 1.02 }],
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationIconText: {
    fontSize: 20,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginRight: 8,
    flex: 1,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3498db',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#5d6d7e',
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationDate: {
    fontSize: 12,
    color: '#a6a6a6',
    fontWeight: '500',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'lowercase',
  },
  markAsReadButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
  },
  unreadIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#3498db',
    borderWidth: 2,
    borderColor: '#f0f8ff',
  },
  readIcon: {
    fontSize: 18,
    opacity: 0.8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyIconText: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#95a5a6',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 16,
    marginTop: 8,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
  },
  quickActionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionIcon: {
    fontSize: 20,
  },
  quickActionText: {
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '600',
    textAlign: 'center',
  },
});