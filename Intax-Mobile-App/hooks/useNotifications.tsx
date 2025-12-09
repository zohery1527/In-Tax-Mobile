import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ApiNotification, apiService, NotificationType } from '../services/api';

interface NotificationsContextType {
  notifications: ApiNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  loadNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  clearError: () => void;
  getNotificationIcon: (type: NotificationType) => string;
  getNotificationColor: (type: NotificationType) => string;
  formatNotificationDate: (dateString: string) => string;
  getNotificationAction: (notification: ApiNotification) => { label: string; url: string };
  filterByType: (types: NotificationType[]) => ApiNotification[];
  isNotificationRecent: (notification: ApiNotification) => boolean;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ CORRECTION: Dans React Native, setInterval retourne 'number'
  const refreshIntervalRef = useRef<number | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!user || !token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔔 Chargement notifications depuis API...');
      const result = await apiService.getUserNotifications(false, 20);
      
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
      
      console.log(`✅ ${result.notifications.length} notifications chargées, ${result.unreadCount} non lues`);
    } catch (error: any) {
      console.error('❌ Erreur chargement notifications:', error);
      setError(error.message || 'Tsy afaka nandray ny fampahatsiahivana');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true, readAt: new Date().toISOString() }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      console.log(`✅ Notification ${notificationId} marquée comme lue`);
    } catch (error: any) {
      console.error('❌ Erreur marquage notification:', error);
      setError(error.message || 'Tsy afaka namaritika ny fampahatsiahivana');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const updatedCount = await apiService.markAllNotificationsAsRead();
      
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          isRead: true, 
          readAt: new Date().toISOString() 
        }))
      );
      setUnreadCount(0);
      
      console.log(`✅ ${updatedCount} notifications marquées comme lues`);
    } catch (error: any) {
      console.error('❌ Erreur marquage toutes notifications:', error);
      setError(error.message || 'Tsy afaka namaritika ny fampahatsiahivana rehetra');
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    console.log('🔄 Rafraîchissement manuel des notifications');
    await loadNotifications();
  }, [loadNotifications]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ✅ Utilitaires pour l'interface
  const getNotificationIcon = useCallback((type: NotificationType): string => {
    return apiService.getNotificationIcon(type);
  }, []);

  const getNotificationColor = useCallback((type: NotificationType): string => {
    return apiService.getNotificationColor(type);
  }, []);

  const formatNotificationDate = useCallback((dateString: string): string => {
    return apiService.formatNotificationDate(dateString);
  }, []);

  const getNotificationAction = useCallback((notification: ApiNotification): { label: string; url: string } => {
    return apiService.getNotificationAction(notification);
  }, []);

  const filterByType = useCallback((types: NotificationType[]): ApiNotification[] => {
    return apiService.filterNotificationsByType(notifications, types);
  }, [notifications]);

  const isNotificationRecent = useCallback((notification: ApiNotification): boolean => {
    return apiService.isNotificationRecent(notification);
  }, []);

  // Chargement initial
  useEffect(() => {
    if (user && token) {
      console.log('🚀 Chargement initial des notifications...');
      loadNotifications();
    } else {
      console.log('ℹ️ Pas d\'utilisateur connecté, notifications vidées');
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, token, loadNotifications]);

  // ✅ CORRECTION: Rafraîchissement périodique
  useEffect(() => {
    // Nettoyer l'intervalle précédent
    if (refreshIntervalRef.current !== null) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    if (!user || !token) return;

    // ✅ setInterval retourne 'number' dans React Native
    const intervalId = setInterval(() => {
      console.log('🔄 Rafraîchissement automatique des notifications');
      loadNotifications();
    }, 10 * 60 * 1000); // 10 minutes

    // Stocker l'ID de l'intervalle
    refreshIntervalRef.current = intervalId;

    // Nettoyage
    return () => {
      if (refreshIntervalRef.current !== null) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [user, token, loadNotifications]);

  const value: NotificationsContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    clearError,
    getNotificationIcon,
    getNotificationColor,
    formatNotificationDate,
    getNotificationAction,
    filterByType,
    isNotificationRecent
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications doit être utilisé à l\'intérieur d\'un NotificationsProvider');
  }
  return context;
}

// Hook utilitaire pour les statistiques
export function useNotificationStats() {
  const { notifications, unreadCount } = useNotifications();
  
  const stats = {
    total: notifications.length,
    unread: unreadCount,
    read: notifications.length - unreadCount,
    byType: notifications.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    recent: notifications.filter(notification => 
      apiService.isNotificationRecent(notification)
    ).length
  };
  
  return stats;
}

// Hook utilitaire pour filtrer
export function useFilteredNotifications(types?: NotificationType[]) {
  const { notifications, filterByType } = useNotifications();
  
  if (types && types.length > 0) {
    return filterByType(types);
  }
  
  return notifications;
}