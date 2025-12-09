// app/notifications/[id].tsx - VERSION CORRIGÉE
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import ProfessionalLayout from '../../components/ProfessionalLayout';
import { ApiNotification, apiService, NotificationType } from '../../services/api';

// ✅ Utiliser les types de l'API
type PriorityType = 'LOW' | 'MEDIUM' | 'HIGH';

interface PriorityConfig {
  text: string;
  color: string;
  icon: string;
  bgColor: string;
}

interface NotificationTypeConfig {
  text: string;
  color: string;
  icon: string;
  description: string;
}

export default function NotificationDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [notification, setNotification] = useState<ApiNotification | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const notificationId = Array.isArray(params.id) ? params.id[0] : params.id;

  // ✅ Chargement de la notification
  const loadNotification = useCallback(async () => {
    if (!notificationId) {
      Alert.alert('Hadisoana', 'Tsy hita ny fampahatsiahivana.');
      router.back();
      return;
    }

    try {
      setLoading(true);
      console.log(`🔄 Chargement notification: ${notificationId}`);

      try {
        // ✅ Récupérer toutes les notifications et trouver celle avec l'ID correspondant
        const { notifications } = await apiService.getUserNotifications(false, 100);
        const foundNotification = notifications.find(n => n.id === notificationId);
        
        if (foundNotification) {
          console.log('✅ Notification trouvée:', foundNotification.title);
          setNotification(foundNotification);
          
          // Marquer comme lu si ce n'est pas déjà fait
          if (!foundNotification.isRead) {
            try {
              await apiService.markNotificationAsRead(notificationId);
              console.log('📖 Notification marquée comme lue');
            } catch (markError) {
              console.warn('⚠️ Impossible de marquer comme lu:', markError);
            }
          }
        } else {
          throw new Error('Notification non trouvée dans la liste');
        }
      } catch (error: any) {
        console.log('⚠️ Erreur avec API, utilisation des données mockées:', error);
        
        // ✅ Données mockées de secours (avec les nouveaux types)
        const mockNotification: ApiNotification = {
          id: notificationId,
          userId: 'user_mock',
          type: 'MONTHLY_REMINDER',
          title: 'Famaranana volana - Fanamarihana',
          message: 'Misy 5 andro sisa hanatanterahana ny famaranana volana. Aza adino ny hanàto ny varotra natao mandritra ny volana Desambra 2024. Raha misy fanontaniana, antsoy ny fanampiana amin\'ny 034 20 152 72.',
          isRead: true,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {
            type: 'monthly_reminder',
            amount: 250000,
            period: '2024-12',
            daysLeft: 5,
            declarationId: 'decl_' + Date.now().toString(36)
          }
        };
        
        setNotification(mockNotification);
      }

    } catch (error: any) {
      console.error('❌ Erreur chargement notification:', error);
      Alert.alert(
        'Hadisoana', 
        error.message || 'Tsy afaka maka ny fampahatsiahivana. Andramo indray.'
      );
    } finally {
      setLoading(false);
    }
  }, [notificationId, router]);

  // ✅ Effet de chargement
  useEffect(() => {
    if (notificationId) {
      loadNotification();
    }
  }, [notificationId, loadNotification]);

  // ✅ Configuration des types de notification MIS À JOUR
  const NOTIFICATION_TYPES: Record<NotificationType, NotificationTypeConfig> = {
    WELCOME: {
      text: 'Tonga soa!',
      color: '#3498db',
      icon: '👋',
      description: 'Fiarahabana ho eto amin\'ny In-Tax'
    },
    NIF_VALIDATED: {
      text: 'NIF voamarina',
      color: '#2ecc71',
      icon: '🎊',
      description: 'Fanovana sata NIF'
    },
    NEW_DECLARATION: {
      text: 'Famaranana vaovao',
      color: '#9b59b6',
      icon: '📄',
      description: 'Famaranana vaovao nataonao'
    },
    PAYMENT_SUCCESS: {
      text: 'Fandoavana nahomby',
      color: '#27ae60',
      icon: '✅',
      description: 'Fandoavana vita soamantsara'
    },
    MONTHLY_REMINDER: {
      text: 'Fahatsiarovana isam-bolana',
      color: '#f39c12',
      icon: '📅',
      description: 'Fahatsiarovana ny daty hanatanterahana'
    },
    MISSING_DECLARATION: {
      text: 'Famaranana tsy natao',
      color: '#e74c3c',
      icon: '⚠️',
      description: 'Famaranana tsy natao tamin\'ny volana lasa'
    },
    OVERDUE_DECLARATION: {
      text: 'Famaranana tafa mihoatra',
      color: '#c0392b',
      icon: '🚨',
      description: 'Famaranana tafa mihoatra ny fotoana'
    },
    SYSTEM_ALERT: {
      text: 'Fampandrenesana rafitra',
      color: '#34495e',
      icon: 'ℹ️',
      description: 'Fampandrenesana avy amin\'ny rafitra'
    },
    NEW_FEATURE: {
      text: 'Tolotra vaovao',
      color: '#8e44ad',
      icon: '✨',
      description: 'Fampahafantarana tolotra vaovao'
    }
  };

  // ✅ Configuration des priorités
  const PRIORITY_CONFIG: Record<PriorityType, PriorityConfig> = {
    HIGH: { 
      text: 'ZAVA-DEHIBE', 
      color: '#e74c3c', 
      icon: '🚨',
      bgColor: '#fdecea'
    },
    MEDIUM: { 
      text: 'ANTONY', 
      color: '#f39c12', 
      icon: '⚠️',
      bgColor: '#fef5e7'
    },
    LOW: { 
      text: 'FANAZAVANA', 
      color: '#3498db', 
      icon: 'ℹ️',
      bgColor: '#e8f4fd'
    }
  };

  // ✅ Formatage de date
  const formatDate = useCallback((dateString: string | undefined) => {
    if (!dateString) return 'Tsy fantatra';
    
    try {
      return apiService.formatNotificationDate(dateString);
    } catch {
      return dateString;
    }
  }, []);

  // ✅ Gestion des actions
  const handleNotificationAction = useCallback(async (actionType: string) => {
    if (!notification) return;
    
    setProcessing(true);
    try {
      switch (actionType) {
        case 'MARK_READ':
          if (!notification.isRead) {
            await apiService.markNotificationAsRead(notification.id);
            setNotification({ ...notification, isRead: true, readAt: new Date().toISOString() });
          }
          break;
          
        case 'OPEN_DECLARATION':
          if (notification.metadata?.declarationId) {
            router.push(`/historique/declaration/${notification.metadata.declarationId}`);
          } else {
            router.push('/(tabs)/declarer');
          }
          break;
          
        case 'MAKE_PAYMENT':
          router.push({
            pathname: '/payments/realistic',
            params: {
              declarationId: notification.metadata?.declarationId || '',
              amount: notification.metadata?.amount?.toString() || '0',
              period: notification.metadata?.period || ''
            }
          });
          break;
          
        case 'VIEW_PROFILE':
          router.push('/(tabs)/profil');
          break;
          
        case 'VIEW_HISTORY':
          router.push('/historique');
          break;
          
        case 'NEW_DECLARATION':
          router.push('/(tabs)/declarer');
          break;
          
        case 'CALL_SUPPORT':
          await Linking.openURL('tel:+261342015272');
          break;
          
        case 'SHARE':
          await Share.share({
            message: `${notification.title}\n\n${notification.message}\n\nIn-Tax - Fitantanam-bola Malagasy`,
            title: notification.title
          });
          break;
          
        default:
          console.log('Action non gérée:', actionType);
      }
    } catch (error: any) {
      console.error('❌ Erreur action:', error);
      Alert.alert('Hadisoana', 'Nisy olana nitranga. Andramo indray.');
    } finally {
      setProcessing(false);
    }
  }, [notification, router]);

  // ✅ Déterminer les actions disponibles MIS À JOUR
  const getAvailableActions = useCallback(() => {
    if (!notification) return [];
    
    const baseActions = [];
    
    // Actions basées sur le type (nouveaux types)
    switch (notification.type) {
      case 'MONTHLY_REMINDER':
      case 'NEW_DECLARATION':
        baseActions.push({
          id: 'OPEN_DECLARATION',
          title: 'Hanàto famaranana',
          icon: '📝',
          color: '#3498db'
        });
        break;
        
      case 'MISSING_DECLARATION':
      case 'OVERDUE_DECLARATION':
        baseActions.push({
          id: 'NEW_DECLARATION',
          title: 'Manao famaranana',
          icon: '📄',
          color: '#e74c3c'
        });
        break;
        
      case 'PAYMENT_SUCCESS':
        baseActions.push({
          id: 'VIEW_HISTORY',
          title: 'Hijery tari-dalana',
          icon: '📊',
          color: '#27ae60'
        });
        break;
        
      case 'NIF_VALIDATED':
        baseActions.push({
          id: 'NEW_DECLARATION',
          title: 'Manao famaranana voalohany',
          icon: '🎊',
          color: '#2ecc71'
        });
        break;
        
      case 'WELCOME':
        baseActions.push({
          id: 'VIEW_PROFILE',
          title: 'Hijery ny kaonty',
          icon: '👤',
          color: '#3498db'
        });
        break;
        
      case 'NEW_FEATURE':
        baseActions.push({
          id: 'VIEW_HOME',
          title: 'Hijery tolotra',
          icon: '✨',
          color: '#8e44ad'
        });
        break;
    }
    
    // Actions générales
    if (!notification.isRead) {
      baseActions.unshift({
        id: 'MARK_READ',
        title: 'Marika ho vakina',
        icon: '📖',
        color: '#7f8c8d'
      });
    }
    
    baseActions.push(
      {
        id: 'CALL_SUPPORT',
        title: 'Antsoy fanampiana',
        icon: '📞',
        color: '#e74c3c'
      },
      {
        id: 'SHARE',
        title: 'Zarazara',
        icon: '↗️',
        color: '#3498db'
      }
    );
    
    return baseActions;
  }, [notification]);

  // ✅ Affichage du montant formaté
  const formatAmount = useCallback((amount?: number) => {
    if (!amount) return '';
    return apiService.formatCurrency(amount);
  }, []);

  // ✅ Obtenir les données de métadonnées typées
  const getMetadataValue = useCallback((key: string): any => {
    if (!notification?.metadata) return undefined;
    return notification.metadata[key];
  }, [notification]);

  // ✅ Obtenir la couleur de l'icône
  const getNotificationIcon = useCallback((type: NotificationType): string => {
    return apiService.getNotificationIcon(type);
  }, []);

  const getNotificationColor = useCallback((type: NotificationType): string => {
    return apiService.getNotificationColor(type);
  }, []);

  // ✅ Écran de chargement
  if (loading) {
    return (
      <ProfessionalLayout title="Fampahatsiahivana">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Eo am-pamakiana ny fampahatsiahivana...</Text>
        </View>
      </ProfessionalLayout>
    );
  }

  // ✅ Écran d'erreur
  if (!notification) {
    return (
      <ProfessionalLayout title="Fampahatsiahivana">
        <View style={styles.emptyContainer}>
          <LinearGradient 
            colors={['#ecf0f1', '#bdc3c7']} 
            style={styles.emptyIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.emptyIconText}>🔔</Text>
          </LinearGradient>
          <Text style={styles.emptyTitle}>Tsy hita ny fampahatsiahivana</Text>
          <Text style={styles.emptyText}>
            Tsy nahitana ny fampahatsiahivana nangatahana na lasa daty.
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => router.push('/notifications')}
            disabled={processing}
          >
            <LinearGradient
              colors={['#3498db', '#2980b9']}
              style={styles.emptyButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.emptyButtonText}>
                Hiverina any amin&apos;ny lisitra
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ProfessionalLayout>
    );
  }

  // ✅ Variables pour le rendu
  const typeConfig = NOTIFICATION_TYPES[notification.type];
  const priority = getMetadataValue('priority') as PriorityType || 'MEDIUM';
  const priorityConfig = PRIORITY_CONFIG[priority];
  const availableActions = getAvailableActions();
  const hasMetadata = notification.metadata && Object.keys(notification.metadata).length > 0;
  const daysLeft = getMetadataValue('daysLeft');
  const amount = getMetadataValue('amount');
  const period = getMetadataValue('period');
  const monthsLate = getMetadataValue('monthsLate');
  const remaining = getMetadataValue('remaining');

  // ✅ Déterminer la couleur de fond en fonction du type
  const headerColors = [getNotificationColor(notification.type), `${getNotificationColor(notification.type)}DD`];

  return (
    <ProfessionalLayout title="Fampahatsiahivana">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* En-tête */}
        <LinearGradient 
          colors={headerColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>{getNotificationIcon(notification.type)}</Text>
          </View>
          
          <Text style={styles.headerTitle}>{notification.title}</Text>
          <Text style={styles.headerSubtitle}>{typeConfig.description}</Text>
          
          <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.bgColor }]}>
            <Text style={styles.priorityIcon}>{priorityConfig.icon}</Text>
            <Text style={[styles.priorityText, { color: priorityConfig.color }]}>
              {priorityConfig.text}
            </Text>
          </View>
        </LinearGradient>

        {/* Contenu principal */}
        <View style={styles.contentCard}>
          {/* Informations de base */}
          <View style={styles.metaSection}>
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>📅</Text>
              <Text style={styles.metaLabel}>Daty:</Text>
              <Text style={styles.metaValue}>{formatDate(notification.createdAt)}</Text>
            </View>
            
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>🔔</Text>
              <Text style={styles.metaLabel}>Karazana:</Text>
              <Text style={styles.metaValue}>{typeConfig.text}</Text>
            </View>
            
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>📖</Text>
              <Text style={styles.metaLabel}>Sata:</Text>
              <Text style={styles.metaValue}>
                {notification.isRead ? 'Vakina' : 'Tsy vakina'}
              </Text>
            </View>
          </View>

          {/* Message */}
          <View style={styles.messageSection}>
            <Text style={styles.messageTitle}>Hafatra:</Text>
            <View style={styles.messageBox}>
              <Text style={styles.messageText}>{notification.message}</Text>
            </View>
          </View>

          {/* Métadonnées (si disponibles) */}
          {hasMetadata && (
            <View style={styles.metadataSection}>
              <Text style={styles.metadataTitle}>Angona fanampiny:</Text>
              <View style={styles.metadataGrid}>
                {daysLeft !== undefined && (
                  <View style={styles.metadataItem}>
                    <Text style={styles.metadataIcon}>⏳</Text>
                    <View>
                      <Text style={styles.metadataLabel}>Andro sisa:</Text>
                      <Text style={[styles.metadataValue, daysLeft <= 3 && styles.dangerText]}>
                        {daysLeft} andro
                      </Text>
                    </View>
                  </View>
                )}
                
                {monthsLate !== undefined && (
                  <View style={styles.metadataItem}>
                    <Text style={styles.metadataIcon}>📅</Text>
                    <View>
                      <Text style={styles.metadataLabel}>Volana mihoatra:</Text>
                      <Text style={[styles.metadataValue, styles.dangerText]}>
                        {monthsLate} volana
                      </Text>
                    </View>
                  </View>
                )}
                
                {amount !== undefined && (
                  <View style={styles.metadataItem}>
                    <Text style={styles.metadataIcon}>💰</Text>
                    <View>
                      <Text style={styles.metadataLabel}>Volan-javatra:</Text>
                      <Text style={styles.metadataValue}>
                        {formatAmount(amount)}
                      </Text>
                    </View>
                  </View>
                )}
                
                {remaining !== undefined && (
                  <View style={styles.metadataItem}>
                    <Text style={styles.metadataIcon}>💸</Text>
                    <View>
                      <Text style={styles.metadataLabel}>Mbola tokony aloa:</Text>
                      <Text style={[styles.metadataValue, styles.dangerText]}>
                        {formatAmount(remaining)}
                      </Text>
                    </View>
                  </View>
                )}
                
                {period && (
                  <View style={styles.metadataItem}>
                    <Text style={styles.metadataIcon}>📆</Text>
                    <View>
                      <Text style={styles.metadataLabel}>Volana/Taona:</Text>
                      <Text style={styles.metadataValue}>{period}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Alertes importantes */}
          {(['OVERDUE_DECLARATION', 'MISSING_DECLARATION', 'MONTHLY_REMINDER'] as NotificationType[]).includes(notification.type) && (
            <View style={[styles.alertSection, 
              notification.type === 'OVERDUE_DECLARATION' ? styles.alertDanger :
              notification.type === 'MISSING_DECLARATION' ? styles.alertWarning :
              styles.alertInfo
            ]}>
              <Text style={styles.alertIcon}>
                {notification.type === 'OVERDUE_DECLARATION' ? '🚨' :
                 notification.type === 'MISSING_DECLARATION' ? '⚠️' : '📅'}
              </Text>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>
                  {notification.type === 'OVERDUE_DECLARATION' ? 'Mila asa atao haingana!' :
                   notification.type === 'MISSING_DECLARATION' ? 'Tsy maintsy atao!' :
                   'Tsy azo adinoina!'}
                </Text>
                <Text style={styles.alertText}>
                  {notification.type === 'OVERDUE_DECLARATION' ? 
                    'Efa tafa mihoatra ny fotoana ity asa ity. Ataovy izao mba hisorohana ny sazy.' :
                   notification.type === 'MISSING_DECLARATION' ? 
                    'Tsy nanao famaranana tamin\'ny volana lasa ianao. Ataovy izao.' :
                    'Mbola misy andro sisa. Ataovy ny asa amin\'ny fotoana voatondro.'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Actions disponibles */}
        <View style={styles.actionsSection}>
          <Text style={styles.actionsTitle}>ASA ATAO:</Text>
          <View style={styles.actionsGrid}>
            {availableActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionButton}
                onPress={() => handleNotificationAction(action.id)}
                disabled={processing}
              >
                <LinearGradient
                  colors={[action.color, `${action.color}DD`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionGradient}
                >
                  <Text style={styles.actionIcon}>{action.icon}</Text>
                  <Text style={styles.actionText}>{action.title}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Informations supplémentaires */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📞 Fanampiana sy fanovozan-kevitra</Text>
          
          <TouchableOpacity 
            style={styles.infoItem}
            onPress={() => handleNotificationAction('CALL_SUPPORT')}
          >
            <Text style={styles.infoIcon}>📞</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Antsoy ny fanampiana:</Text>
              <Text style={styles.infoValue}>+261 34 20 152 72</Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>⏰</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Fotoana manokana:</Text>
              <Text style={styles.infoValue}>08:00 - 17:00, Is - As</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>📧</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Mailaka:</Text>
              <Text style={styles.infoValue}>fanampiana@intax.mg</Text>
            </View>
          </View>
        </View>

        {/* Pied de page */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🆔 ID: {notification.id.slice(0, 8)}...
          </Text>
          {notification.expiresAt && (
            <Text style={[styles.footerText, styles.expiryText]}>
              ⏳ Lasa daty: {formatDate(notification.expiresAt)}
            </Text>
          )}
          <Text style={[styles.footerText, styles.typeText]}>
            🔔 Karazana: {notification.type}
          </Text>
        </View>
      </ScrollView>
    </ProfessionalLayout>
  );
}

// ======================
// ✅ STYLES
// ======================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
  loadingText: { 
    marginTop: 10, 
    color: '#7f8c8d',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa'
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIconText: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  header: {
    padding: 24,
    alignItems: 'center',
    margin: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIconText: {
    fontSize: 28,
    color: 'white',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
    textAlign: 'center',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priorityIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  contentCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metaSection: {
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 24,
  },
  metaLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
    width: 80,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  messageSection: {
    marginBottom: 20,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  messageBox: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  messageText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
  metadataSection: {
    marginBottom: 20,
  },
  metadataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  metadataGrid: {
    gap: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
  },
  metadataIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  metadataLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  dangerText: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  alertSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  alertDanger: {
    backgroundColor: '#fdecea',
    borderColor: '#e74c3c',
  },
  alertWarning: {
    backgroundColor: '#fff8e6',
    borderColor: '#f39c12',
  },
  alertInfo: {
    backgroundColor: '#e8f4fd',
    borderColor: '#3498db',
  },
  alertIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionsGrid: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  actionGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 18,
    marginRight: 8,
    color: 'white',
  },
  actionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1565c0',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    borderRadius: 8,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#1565c0',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1565c0',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#bdc3c7',
    marginBottom: 4,
  },
  expiryText: {
    color: '#e74c3c',
    fontWeight: '500',
  },
  typeText: {
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
});