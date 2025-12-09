import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Icons } from '../../../components/Icons';
import ProfessionalLayout from '../../../components/ProfessionalLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { unifiedApiService } from '../../../services/unifiedApiService';

const { width } = Dimensions.get('window');

// Type pour les boutons pressés
interface PressedButtons {
  [key: string]: boolean;
}

export default function PhotoScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [images, setImages] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [pressedButtons, setPressedButtons] = useState<PressedButtons>({});
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // 🔄 Initialisation
  useEffect(() => {
    console.log('📱 PhotoScreen monté sur:', Platform.OS);
    requestPermissions();
  }, []);

  // 🔐 Demande de permissions
  const requestPermissions = useCallback(async () => {
    try {
      console.log('🔐 Demande de permissions...');
      
      if (Platform.OS === 'web') {
        console.log('🌐 Plateforme web - permissions limitées');
        setHasPermission(true);
        return;
      }

      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('📷 Permission caméra:', cameraStatus);
      
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('🖼️ Permission galerie:', libraryStatus);
      
      const granted = cameraStatus === 'granted' && libraryStatus === 'granted';
      setHasPermission(granted);
      
      if (!granted) {
        Alert.alert(
          'Fangatahana alalana',
          'Mila alalana hampiasa ny fakantsary sy ny galerie ianao.',
          [
            { 
              text: 'Ok', 
              style: 'cancel' 
            },
            { 
              text: 'Hampiditra paramètres',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Erreur demande permissions:', error);
      Alert.alert('Hadisoana', 'Nisy olana ny fangatahana alalana.');
    }
  }, []);

  // 🎮 Animations des boutons
  const handlePressIn = useCallback((buttonName: string) => {
    setPressedButtons(prev => ({...prev, [buttonName]: true}));
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        damping: 15,
        stiffness: 150,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0.9,
        useNativeDriver: true,
        duration: 150,
      })
    ]).start();
  }, [scaleAnim, fadeAnim]);

  const handlePressOut = useCallback((buttonName: string) => {
    setPressedButtons(prev => ({...prev, [buttonName]: false}));
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 15,
        stiffness: 150,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        useNativeDriver: true,
        duration: 150,
      })
    ]).start();
  }, [scaleAnim, fadeAnim]);

  // 📸 Prendre une photo
  const takePhoto = useCallback(async () => {
    console.log('📸 Prise de photo...');
    
    if (!hasPermission) {
      Alert.alert('Tsy nahazo alalana', 'Mila alalana hampiasa ny fakantsary ianao.');
      await requestPermissions();
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
        exif: false,
      });

      console.log('📸 Résultat photo:', result);

      if (!result.canceled && result.assets?.[0]?.uri) {
        const imageUri = result.assets[0].uri;
        console.log('✅ Photo prise:', imageUri);
        
        setImages(prev => [imageUri, ...prev]); // Nouvelle photo en premier
        await processImage(imageUri);
      } else {
        console.log('❌ Photo annulée');
      }
    } catch (error: any) {
      console.error('❌ Erreur prise de photo:', error);
      Alert.alert('Hadisoana', 'Nisy olana ny fanaovana sary. Andramo indray.');
    }
  }, [hasPermission, requestPermissions]);

  // 🖼️ Choisir depuis la galerie
  const pickFromGallery = useCallback(async () => {
    console.log('🖼️ Sélection galerie...');
    
    if (!hasPermission && Platform.OS !== 'web') {
      Alert.alert('Tsy nahazo alalana', 'Mila alalana hampiasa ny galerie ianao.');
      await requestPermissions();
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
        base64: false,
      });

      console.log('🖼️ Résultat galerie:', result);

      if (!result.canceled && result.assets?.[0]?.uri) {
        const imageUri = result.assets[0].uri;
        console.log('✅ Image sélectionnée:', imageUri);
        
        setImages(prev => [imageUri, ...prev]);
        await processImage(imageUri);
      } else {
        console.log('❌ Sélection annulée');
      }
    } catch (error: any) {
      console.error('❌ Erreur sélection image:', error);
      Alert.alert('Hadisoana', 'Nisy olana ny fisafidianana sary. Andramo indray.');
    }
  }, [hasPermission, requestPermissions]);

  // 🔄 Traitement de l'image
  const processImage = useCallback(async (imageUri: string) => {
    console.log('🔄 Traitement image:', imageUri);
    setProcessing(true);
    
    let animation: Animated.CompositeAnimation | null = null;
    
    try {
      // Animation de chargement
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.5,
            useNativeDriver: true,
            duration: 800,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            useNativeDriver: true,
            duration: 800,
          }),
        ])
      );
      animation.start();

      // Traitement avec le service unifié
      const result = await unifiedApiService.processPhotoDeclaration(imageUri);
      
      console.log('✅ Image traitée avec succès:', result);
      
      // Arrêter l'animation
      if (animation) {
        animation.stop();
      }
      
      // Afficher le succès
      Alert.alert(
        'Voalohany soamantsara! 🎉',
        `Ny sary dia nadikana sy ny famaranana voalohany!\n\n` +
        `• Vola nidina: ${(result.amount || 0).toLocaleString('fr-MG')} Ar\n` +
        `• Volana: ${result.period || 'N/A'}\n` +
        `• Karazana: ${getActivityTypeText(result.activityType || '')}\n` +
        `• Taxe calculée: ${((result.amount || 0) * 0.02).toLocaleString('fr-MG')} Ar`,
        [
          { 
            text: 'Hijery ny tantara',
            onPress: () => router.push('/historique')
          },
          {
            text: 'Hanohy',
            style: 'cancel',
            onPress: () => console.log('Continuer')
          },
          {
            text: 'Handoa',
            onPress: () => router.push('/payments/realistic')
          }
        ]
      );
      
    } catch (error: any) {
      console.error('❌ Erreur traitement image:', error);
      
      let errorMessage = 'Nisy olana ny fandikana ny sary na ny fanoratana ny famaranana.';
      
      if (error.message?.includes('network') || error.message?.includes('Network')) {
        errorMessage = 'Tsy afaka mampifandray amin\'ny servety. Jereo ny connexion internet.';
      } else if (error.message?.includes('NIF')) {
        errorMessage = 'Mila voamarina aloha ny NIF anao alohan\'ny hanatanterahana famaranana.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Hadisoana', errorMessage);
    } finally {
      setProcessing(false);
      if (animation) {
        animation.stop();
      }
      Animated.timing(fadeAnim, {
        toValue: 1,
        useNativeDriver: true,
        duration: 300,
      }).start();
    }
  }, [fadeAnim, router]);

  // 🧪 Test sans caméra
  const testSansCamera = useCallback(async () => {
    try {
      setProcessing(true);
      
      // Simule une image
      const testImageUri = 'test://image/simulation.jpg';
      
      // Vérifie si la méthode existe
      if (typeof unifiedApiService.simulateAdvancedPhotoProcessing === 'function') {
        const result = await unifiedApiService.simulateAdvancedPhotoProcessing(testImageUri, {
          simulateDelay: 1500,
          forceScenario: 1
        });
        
        Alert.alert(
          'Test Réussi! 🎉', 
          `Mode test - Données simulées:\n\n` +
          `• Vola: ${(result.amount || 0).toLocaleString('fr-MG')} Ar\n` +
          `• Volana: ${result.period || 'N/A'}\n` +
          `• Karazana: ${getActivityTypeText(result.activityType || '')}\n` +
          `• Taxe: ${((result.amount || 0) * 0.02).toLocaleString('fr-MG')} Ar`,
          [
            {
              text: 'Hijery ny tantara',
              onPress: () => router.push('/historique')
            },
            {
              text: 'Hanohy',
              style: 'cancel'
            }
          ]
        );
      } else {
        // Méthode de secours
        const result = await unifiedApiService.processPhotoDeclaration(testImageUri);
        
        Alert.alert(
          'Test avec méthode standard! 🎉', 
          `Mode test - Données simulées:\n\n` +
          `• Vola: ${(result.amount || 0).toLocaleString('fr-MG')} Ar\n` +
          `• Volana: ${result.period || 'N/A'}\n` +
          `• Karazana: ${getActivityTypeText(result.activityType || '')}\n` +
          `• Taxe: ${((result.amount || 0) * 0.02).toLocaleString('fr-MG')} Ar`,
          [
            {
              text: 'Hijery ny tantara',
              onPress: () => router.push('/historique')
            },
            {
              text: 'Hanohy',
              style: 'cancel'
            }
          ]
        );
      }
      
    } catch (error: any) {
      console.error('❌ Test error:', error);
      Alert.alert('Hadisoana Test', error.message || 'Erreur lors du test');
    } finally {
      setProcessing(false);
    }
  }, [router]);

  // 🗑️ Supprimer une image
  const removeImage = useCallback((index: number) => {
    console.log('🗑️ Suppression image index:', index);
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 🔤 Helper pour les textes d'activité
  const getActivityTypeText = (type: string): string => {
    const types: Record<string, string> = {
      'COMMERCE': 'Varotra',
      'ALIMENTATION': 'Sakafo',
      'SERVICES': 'Tohotra',
      'ARTISANAT': 'Asa tanana',
      'AUTRE': 'Hafa'
    };
    return types[type] || type;
  };

  // 🚀 Navigation rapide
  const quickNavItems = [
    {
      id: 'soratra',
      label: 'Soratra',
      icon: <Icons.Edit size={24} color="#2c3e50" />,
      route: '/(tabs)/declarer',
      color: '#f8f9fa'
    },
    {
      id: 'sary',
      label: 'Sary',
      icon: <Icons.Scan size={24} color="#3498db" />,
      route: null, // Page actuelle
      color: '#3498db'
    },
    {
      id: 'vocale',
      label: 'Hitan-teny',
      icon: <Icons.Mic size={24} color="#2c3e50" />,
      route: '/(tabs)/declarer/vocale',
      color: '#f8f9fa'
    }
  ];

  return (
    <ProfessionalLayout title="Sary">
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Instructions */}
        <Animated.View style={[styles.instructionCard, { opacity: fadeAnim }]}>
          <View style={styles.instructionIcon}>
            <Icons.Scan size={32} color="#1565c0" />
          </View>
          <View style={styles.instructionContent}>
            <Text style={styles.instructionTitle}>Ahoana no fanaovana sary?</Text>
            <Text style={styles.instructionText}>
              Ataovy sary ny faktiora na ny risitra. Ny rafitra dia handika ny sary ho famaranana mandeha ho azy.
            </Text>
            <View style={styles.successBadge}>
              <Icons.Check size={14} color="#27ae60" />
              <Text style={styles.successText}>
                Ny famaranana dia alefa mandeha ho azy! Tsy mila fangatahana fanampiny.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Navigation rapide */}
        <View style={styles.quickNav}>
          {quickNavItems.map((item) => (
            <TouchableOpacity 
              key={item.id}
              style={[
                styles.quickButton,
                item.id === 'sary' && styles.activeQuickButton,
                pressedButtons[item.id] && styles.quickButtonPressed
              ]}
              onPress={item.route ? () => router.push(item.route as any) : undefined}
              onPressIn={() => item.route && handlePressIn(item.id)}
              onPressOut={() => item.route && handlePressOut(item.id)}
              disabled={!item.route || processing}
            >
              <View style={[
                styles.quickButtonIcon,
                item.id === 'sary' && styles.activeQuickButtonIcon
              ]}>
                {item.icon}
              </View>
              <Text style={[
                styles.quickButtonText,
                item.id === 'sary' && styles.activeQuickButtonText
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Zone d'affichage des photos */}
        <View style={styles.imagesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SARY NATAO</Text>
            {images.length > 0 && (
              <TouchableOpacity 
                onPress={() => setImages([])}
                disabled={processing}
              >
                <Text style={styles.clearAllText}>Hanafoana rehetra</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {images.length === 0 ? (
            <View style={styles.emptyState}>
              <Icons.Scan size={48} color="#bdc3c7" />
              <Text style={styles.emptyText}>Mbola tsy nisy sary natao</Text>
              <Text style={styles.emptySubtext}>Ataovy sary ny faktiora na risitra</Text>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.imagesScroll}
            >
              <View style={styles.imagesGrid}>
                {images.map((uri, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri }} style={styles.image} />
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => removeImage(index)}
                      disabled={processing}
                    >
                      <Icons.Delete size={14} color="white" />
                    </TouchableOpacity>
                    {index === 0 && processing && (
                      <View style={styles.processingOverlay}>
                        <ActivityIndicator size="small" color="white" />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* Boutons d'action */}
        <View style={styles.actionsSection}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity 
              style={[
                styles.actionButton,
                styles.cameraButton,
                pressedButtons.camera && styles.buttonPressed,
                processing && styles.buttonDisabled
              ]}
              onPress={takePhoto}
              onPressIn={() => handlePressIn('camera')}
              onPressOut={() => handlePressOut('camera')}
              disabled={processing || !hasPermission}
            >
              <Icons.Scan size={24} color="white" />
              <Text style={styles.actionButtonText}>
                {processing ? 'EO AM-PANDIKANA...' : 'HANDRITRA SARY'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity 
              style={[
                styles.actionButton,
                styles.galleryButton,
                pressedButtons.gallery && styles.buttonPressed,
                processing && styles.buttonDisabled
              ]}
              onPress={pickFromGallery}
              onPressIn={() => handlePressIn('gallery')}
              onPressOut={() => handlePressOut('gallery')}
              disabled={processing || !hasPermission}
            >
              <Icons.History size={24} color="white" />
              <Text style={styles.actionButtonText}>
                MISAFIDIA AVY AMIN&apos;NY GALERIE
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Bouton test */}
          {__DEV__ && (
            <TouchableOpacity 
              style={styles.testButton}
              onPress={testSansCamera}
              disabled={processing}
            >
              <Icons.Test size={20} color="#f39c12" />
              <Text style={styles.testButtonText}>Andao hanao fanandramana</Text>
            </TouchableOpacity>
          )}

          {/* Indicateur de traitement */}
          {processing && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#3498db" />
              <Text style={styles.processingText}>EO AM-PANDIKANA NY SARY...</Text>
              <Text style={styles.processingSubtext}>Ny famaranana dia handeha ho azy</Text>
            </View>
          )}
        </View>

        {/* Types de documents acceptés */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>KARAZANA TARATASY AZO ALAINA SARY:</Text>
          
          {['Faktiora', 'Risitra varotra', 'Bilan mensuel', 'Note de frais'].map((doc, index) => (
            <View key={index} style={styles.infoItem}>
              <Icons.Check size={16} color="#27ae60" />
              <Text style={styles.infoText}>{doc}</Text>
            </View>
          ))}
        </View>

        {/* Conseils */}
        <View style={[styles.infoSection, styles.tipsSection]}>
          <Text style={styles.infoTitle}>TORO-HEVITRA HAHOATRA NY SARY:</Text>
          
          {[
            'Ataovy mazava sy hita tsara ny teny',
            'Aza misy aloka eo ambonin\'ny taratasy',
            'Ataovy eo afovoan\'ny sary ny taratasy',
            'Aza mihetsika mandritra ny fanaovana sary'
          ].map((tip, index) => (
            <View key={index} style={styles.infoItem}>
              <Icons.Info size={16} color="#f39c12" />
              <Text style={styles.infoText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Permission warning */}
        {hasPermission === false && (
          <View style={styles.permissionWarning}>
            <Icons.Warning size={24} color="#f39c12" />
            <View style={styles.permissionContent}>
              <Text style={styles.permissionTitle}>Tsy nahazo alalana</Text>
              <Text style={styles.permissionText}>
                Tsy nahazo alalana hampiasa ny fakantsary na ny galerie.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </ProfessionalLayout>
  );
}

// ======================
// ✅ STYLES AMÉLIORÉS
// ======================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    padding: Math.min(width * 0.04, 20),
    paddingBottom: 40,
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e3f2fd',
    padding: 18,
    borderRadius: 14,
    marginBottom: 24,
    borderLeftWidth: 5,
    borderLeftColor: '#1565c0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  instructionIcon: {
    marginRight: 15,
    marginTop: 2,
  },
  instructionContent: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1565c0',
    marginBottom: 6,
  },
  instructionText: {
    fontSize: 14,
    color: '#1565c0',
    lineHeight: 20,
    marginBottom: 10,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(39, 174, 96, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  successText: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '600',
    marginLeft: 6,
  },
  quickNav: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  quickButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    padding: 18,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    minHeight: 90,
  },
  activeQuickButton: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  quickButtonPressed: {
    backgroundColor: '#e9ecef',
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.05,
    borderColor: '#3498db',
  },
  quickButtonIcon: {
    marginBottom: 10,
  },
  activeQuickButtonIcon: {
    // Style spécifique si besoin
  },
  quickButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
  activeQuickButtonText: {
    color: 'white',
  },
  imagesSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2c3e50',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearAllText: {
    fontSize: 12,
    color: '#e74c3c',
    fontWeight: '600',
  },
  imagesScroll: {
    marginHorizontal: -8,
  },
  imagesGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 50,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#7f8c8d',
    marginTop: 15,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bdc3c7',
    textAlign: 'center',
    lineHeight: 20,
  },
  imageContainer: {
    position: 'relative',
    width: 140,
    height: 140,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#e74c3c',
    borderRadius: 15,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  actionsSection: {
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderRadius: 14,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  cameraButton: {
    backgroundColor: '#3498db',
  },
  galleryButton: {
    backgroundColor: '#9b59b6',
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    shadowOpacity: 0.15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
    letterSpacing: 0.3,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef9e7',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#f39c12',
    borderStyle: 'dashed',
  },
  testButtonText: {
    color: '#f39c12',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  processingContainer: {
    alignItems: 'center',
    marginTop: 25,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  processingText: {
    marginTop: 14,
    fontSize: 15,
    color: '#2c3e50',
    fontWeight: '700',
  },
  processingSubtext: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 6,
  },
  infoSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  tipsSection: {
    backgroundColor: '#fff9e6',
    borderLeftWidth: 5,
    borderLeftColor: '#f39c12',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#34495e',
    marginLeft: 10,
    lineHeight: 18,
  },
  permissionWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3cd',
    padding: 18,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#f39c12',
  },
  permissionContent: {
    flex: 1,
    marginLeft: 14,
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#856404',
    marginBottom: 4,
  },
  permissionText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
});