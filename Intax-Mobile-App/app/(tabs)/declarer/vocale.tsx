import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
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

// Interface pour l'état des boutons
interface PressedButtons {
  [key: string]: boolean;
}

export default function VocaleScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [audioModeConfigured, setAudioModeConfigured] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [pressedButtons, setPressedButtons] = useState<PressedButtons>({});
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const durationIntervalRef = useRef<number | null>(null);

  // 🔄 Initialisation
  useEffect(() => {
    console.log('🎤 VocaleScreen monté sur:', Platform.OS);
    requestAudioPermission();
    
    return () => {
      // Nettoyage
      if (durationIntervalRef.current !== null) {
        clearInterval(durationIntervalRef.current);
      }
    };
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

  // ⚡ Animation pulsée
  const startPulseAnimation = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const stopPulseAnimation = useCallback(() => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [pulseAnim]);

  // 🔐 Demande de permission audio
  const requestAudioPermission = useCallback(async () => {
    try {
      console.log('🔐 Demande de permissions audio...');
      
      if (Platform.OS === 'web') {
        console.log('🌐 Plateforme web - capacités audio limitées');
        setHasPermission(true);
        return;
      }

      const { status } = await Audio.requestPermissionsAsync();
      console.log('🎤 Permission audio:', status);
      
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        Alert.alert(
          'Fangatahana alalana',
          'Mila alalana hampiasa ny mikrô ianao.',
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
      } else {
        await configureAudioMode();
      }
    } catch (error) {
      console.error('❌ Erreur demande permission audio:', error);
      Alert.alert('Hadisoana', 'Nisy olana ny fangatahana alalana.');
    }
  }, []);

  // 🎵 Configuration du mode audio
  const configureAudioMode = useCallback(async () => {
    try {
      console.log('🎵 Configuration du mode audio...');
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      setAudioModeConfigured(true);
      console.log('✅ Mode audio configuré avec succès');
    } catch (error) {
      console.error('❌ Erreur configuration mode audio:', error);
    }
  }, []);

  // ⏱️ Gestion de la durée d'enregistrement
  const startRecordingTimer = useCallback(() => {
    setRecordingDuration(0);
    if (durationIntervalRef.current !== null) {
      clearInterval(durationIntervalRef.current);
    }
    
    durationIntervalRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  }, []);

  const stopRecordingTimer = useCallback(() => {
    if (durationIntervalRef.current !== null) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    setRecordingDuration(0);
  }, []);

  // 🎤 Début d'enregistrement
  const startRecording = useCallback(async () => {
    console.log('🎤 Début enregistrement...');
    
    if (!hasPermission) {
      Alert.alert('Tsy nahazo alalana', 'Mila alalana hampiasa ny mikrô ianao.');
      await requestAudioPermission();
      return;
    }

    if (!audioModeConfigured && Platform.OS !== 'web') {
      await configureAudioMode();
    }

    try {
      console.log('🎤 Création session enregistrement...');
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      console.log('✅ Enregistrement démarré avec succès');
      
      setRecording(recording);
      setIsRecording(true);
      setTranscribedText('Mandre ny teny...');
      startPulseAnimation();
      startRecordingTimer();
      
    } catch (error: any) {
      console.error('❌ Erreur début enregistrement:', error);
      Alert.alert('Hadisoana', 'Nisy olana ny fanombohana ny fandraisam-peo. Andramo indray.');
    }
  }, [hasPermission, audioModeConfigured, requestAudioPermission, configureAudioMode, startPulseAnimation, startRecordingTimer]);

  // 🛑 Arrêt d'enregistrement
  const stopRecording = useCallback(async () => {
    console.log('🛑 Arrêt enregistrement...');
    
    if (!recording) {
      console.log('❌ Aucun enregistrement à arrêter');
      return;
    }

    try {
      setIsRecording(false);
      setProcessing(true);
      stopPulseAnimation();
      stopRecordingTimer();

      console.log('🎤 Arrêt et déchargement enregistrement...');
      await recording.stopAndUnloadAsync();
      setRecording(null);

      // Traitement avec le service amélioré
      const audioUri = recording.getURI();
      if (audioUri) {
        await processVoiceRecording(audioUri);
      } else {
        throw new Error('Aucun URI audio disponible');
      }
      
    } catch (error: any) {
      console.error('❌ Erreur arrêt enregistrement:', error);
      setProcessing(false);
      stopPulseAnimation();
      stopRecordingTimer();
      Alert.alert('Hadisoana', 'Nisy olana ny famaranana ny fandraisam-peo.');
    }
  }, [recording, stopPulseAnimation, stopRecordingTimer]);

  // 🔄 Traitement de l'enregistrement vocal
  const processVoiceRecording = useCallback(async (audioUri: string) => {
    try {
      console.log('🎤 Traitement enregistrement vocal...');
      setTranscribedText('Eo am-pandikana ny teny...');
      
      // Animation de traitement
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.6,
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

      // Utilisation du service amélioré
      const result = await unifiedApiService.processVoiceDeclaration(audioUri);
      
      console.log('✅ Traitement vocal réussi:', result);
      
      // Arrêter l'animation
      animation.stop();
      Animated.timing(fadeAnim, {
        toValue: 1,
        useNativeDriver: true,
        duration: 300,
      }).start();
      
      setTranscribedText('Voalohany soamantsara! 🎉');
      
      Alert.alert(
        'Fahombiazana! 🎉', 
        `Ny teny dia nadikana sy ny famaranana voalohany!\n\n` +
        `• Vola nidina: ${result.amount?.toLocaleString('fr-MG')} Ar\n` +
        `• Volana: ${result.period}\n` +
        `• Karazana: ${getActivityTypeText(result.activityType)}\n` +
        `• Taxe calculée: ${((result.amount || 0) * 0.02).toLocaleString('fr-MG')} Ar`,
        [
          {
            text: 'Hijery ny tantara',
            onPress: () => router.push('/historique')
          },
          {
            text: 'Hanohy',
            style: 'cancel',
            onPress: () => setTranscribedText('')
          },
          {
            text: 'Handoa',
            onPress: () => router.push('/payments/realistic')
          }
        ]
      );
      
    } catch (error: any) {
      console.error('❌ Erreur traitement vocal:', error);
      setTranscribedText('Nisy hadisoana 😔');
      
      let errorMessage = 'Nisy olana ny fandikana ny teny na ny fanoratana ny famaranana.';
      
      if (error.message?.includes('network') || error.message?.includes('Network')) {
        errorMessage = 'Tsy afaka mampifandray amin\'ny servety. Jereo ny connexion internet.';
      } else if (error.message?.includes('NIF')) {
        errorMessage = 'Mila voamarina aloha ny NIF anao alohan\'ny hanatanterahana famaranana.';
      }
      
      Alert.alert('Hadisoana', errorMessage);
    } finally {
      setProcessing(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        useNativeDriver: true,
        duration: 300,
      }).start();
    }
  }, [fadeAnim, router]);

  // 🔤 Helper pour les textes d'activité
  const getActivityTypeText = useCallback((type: string): string => {
    const types: Record<string, string> = {
      'COMMERCE': 'Varotra',
      'ALIMENTATION': 'Sakafo',
      'SERVICES': 'Tohotra',
      'ARTISANAT': 'Asa tanana',
      'AUTRE': 'Hafa'
    };
    return types[type] || type;
  }, []);

  // 🗣️ Lecture des instructions
  const speakInstructions = useCallback(() => {
    console.log('🗣️ Lecture instructions...');
    try {
      Speech.speak(
        'Tsindrio ny bokotra manga ra-te-hitan-teny. Lazao ny vola nidina, ny volana, ary ny karazana varotra natao. Ohatra: Nahtao roanjato arivo ariary tamin ny janoary tamin ny restaurant.',
        { 
          language: 'mg',
          rate: 0.8,
          pitch: 1.0,
        }
      );
    } catch (error) {
      console.error('❌ Erreur lecture:', error);
      Alert.alert('Hadisoana', 'Nisy olana ny famakiana ny torohevitra.');
    }
  }, []);

  // 🧪 Test sans micro
  const testSansMicro = useCallback(async () => {
    try {
      setProcessing(true);
      setTranscribedText('Eo am-pandikana ny teny...');
      
      // Simule un enregistrement audio
      const testAudioUri = 'test://audio/simulation.mp3';
      const result = await unifiedApiService.processVoiceDeclaration(testAudioUri);
      
      setTranscribedText('Voalohany soamantsara! 🎉');
      
      Alert.alert(
        'Test Réussi! 🎉', 
        `Mode test - Données simulées:\n\n` +
        `• Vola: ${result.amount?.toLocaleString('fr-MG')} Ar\n` +
        `• Volana: ${result.period}\n` +
        `• Karazana: ${getActivityTypeText(result.activityType)}\n` +
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
      
    } catch (error: any) {
      console.error('❌ Erreur test:', error);
      Alert.alert('Hadisoana Test', error.message || 'Erreur lors du test');
    } finally {
      setProcessing(false);
    }
  }, [getActivityTypeText, router]);

  // 📝 Formatage de la durée
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
      icon: <Icons.Scan size={24} color="#2c3e50" />,
      route: '/(tabs)/declarer/photo',
      color: '#f8f9fa'
    },
    {
      id: 'vocale',
      label: 'Hitan-teny',
      icon: <Icons.Mic size={24} color="#3498db" />,
      route: null, // Page actuelle
      color: '#3498db'
    }
  ];

  return (
    <ProfessionalLayout title="Hitan-teny">
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Instructions */}
        <Animated.View style={[styles.instructionCard, { opacity: fadeAnim }]}>
          <View style={styles.instructionIcon}>
            <Icons.Mic size={32} color="#1565c0" />
          </View>
          <View style={styles.instructionContent}>
            <Text style={styles.instructionTitle}>Ahoana no hiteniana?</Text>
            <Text style={styles.instructionText}>
              Tsindrio ny bokotra manga ra-te-hitan-teny. Lazao ny vola nidina, ny volana, ary ny karazana varotra.
            </Text>
            <View style={styles.successBadge}>
              <Icons.Check size={14} color="#27ae60" />
              <Text style={styles.successText}>
                Ny famaranana dia alefa mandeha ho azy!
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={speakInstructions} 
            style={styles.helpButton}
            onPressIn={() => handlePressIn('help')}
            onPressOut={() => handlePressOut('help')}
            disabled={processing}
          >
            <Icons.Info size={24} color="#1565c0" />
          </TouchableOpacity>
        </Animated.View>

        {/* Navigation rapide */}
        <View style={styles.quickNav}>
          {quickNavItems.map((item) => (
            <TouchableOpacity 
              key={item.id}
              style={[
                styles.quickButton,
                item.id === 'vocale' && styles.activeQuickButton,
                pressedButtons[item.id] && styles.quickButtonPressed
              ]}
              onPress={item.route ? () => router.push(item.route as any) : undefined}
              onPressIn={() => item.route && handlePressIn(item.id)}
              onPressOut={() => item.route && handlePressOut(item.id)}
              disabled={!item.route || processing}
            >
              <View style={[
                styles.quickButtonIcon,
                item.id === 'vocale' && styles.activeQuickButtonIcon
              ]}>
                {item.icon}
              </View>
              <Text style={[
                styles.quickButtonText,
                item.id === 'vocale' && styles.activeQuickButtonText
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Zone d'enregistrement */}
        <View style={styles.recordingSection}>
          <Animated.View 
            style={[
              styles.circle, 
              isRecording && styles.recordingCircle,
              processing && styles.processingCircle,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            {isRecording ? (
              <View style={styles.pulsingCircle}>
                <View style={styles.pulse1} />
                <View style={styles.pulse2} />
                <View style={styles.pulse3} />
                <View style={styles.innerCircle}>
                  <Icons.Mic size={36} color="white" />
                </View>
              </View>
            ) : processing ? (
              <ActivityIndicator size="large" color="#3498db" />
            ) : (
              <Icons.Mic size={48} color="#3498db" />
            )}
          </Animated.View>

          {/* Durée d'enregistrement */}
          {isRecording && (
            <View style={styles.durationContainer}>
              <Text style={styles.durationText}>
                {formatDuration(recordingDuration)}
              </Text>
              <Text style={styles.durationLabel}>enregistrement</Text>
            </View>
          )}

          {/* Statut */}
          <Text style={styles.statusText}>
            {isRecording ? 'EO AM-PANDRAISANA...' : 
              processing ? 'EO AM-PANDIKANA NY TENY...' : 
              'TSINDRIO ETO RA-TE-HITAN-TENY'}
          </Text>

          {/* Texte transcrit */}
          <Text style={styles.transcribedText}>
            {transcribedText}
          </Text>

          {/* Message de statut */}
          {processing && (
            <View style={styles.statusMessage}>
              <Icons.Info size={20} color="#27ae60" />
              <Text style={styles.statusMessageText}>
                Eo am-pandikana ny teny sy fanoratana ny famaranana...
              </Text>
            </View>
          )}
        </View>

        {/* Boutons d'action */}
        <View style={styles.actionsSection}>
          {!isRecording && !processing ? (
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity 
                style={[
                  styles.actionButton,
                  styles.recordButton,
                  pressedButtons.record && styles.buttonPressed
                ]}
                onPress={startRecording}
                onPressIn={() => handlePressIn('record')}
                onPressOut={() => handlePressOut('record')}
                disabled={!hasPermission || processing}
              >
                <Icons.Mic size={24} color="white" />
                <Text style={styles.actionButtonText}>
                  HANOMBOKA HITAN-TENY
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ) : isRecording ? (
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity 
                style={[
                  styles.actionButton,
                  styles.stopButton,
                  pressedButtons.stop && styles.buttonPressed
                ]}
                onPress={stopRecording}
                onPressIn={() => handlePressIn('stop')}
                onPressOut={() => handlePressOut('stop')}
              >
                <Icons.Stop size={24} color="white" />
                <Text style={styles.actionButtonText}>
                  HAMARANA
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <View style={styles.processingButton}>
              <ActivityIndicator size="small" color="#3498db" />
              <Text style={styles.processingButtonText}>
                EO AM-PANDIKANA...
              </Text>
            </View>
          )}
        </View>

        {/* Bouton test */}
        {__DEV__ && (
          <TouchableOpacity 
            style={styles.testButton}
            onPress={testSansMicro}
            disabled={processing}
          >
            <Icons.Test size={20} color="#f39c12" />
            <Text style={styles.testButtonText}>
              Andao hanao fanandramana
            </Text>
          </TouchableOpacity>
        )}

        {/* Informations */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>🚀 FAMPIDIRANA MANDEFY HO AZY</Text>
          
          {[
            '1. Tsindrio ny bokotra hanombohana',
            '2. Milaza ny mombamomba ny varotra',
            '3. Ny famaranana dia alefa ho azy!'
          ].map((step, index) => (
            <View key={index} style={styles.infoItem}>
              <Icons.Check size={16} color="#3498db" />
              <Text style={styles.infoText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Exemples */}
        <View style={styles.examplesSection}>
          <Text style={styles.examplesTitle}>OHATRA NY TENY AZO ATAO:</Text>
          
          {[
            "Nahtao roanjato arivo ariary tamin'ny janoary tamin'ny restaurant sakafo",
            "Varotra lamba nanao telonjato sy dimampolo hetsy ariary tamin'ny febroary",
            "Asa tanana nahazo zato sy folo hetsy ariary tamin'ny mars"
          ].map((example, index) => (
            <View key={index} style={styles.exampleItem}>
              <View style={styles.exampleIcon}>
                <Icons.Info size={16} color="#3498db" />
              </View>
              <Text style={styles.exampleText}>&quot;{example}&quot;</Text>
            </View>
          ))}
        </View>
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
  helpButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(21, 101, 192, 0.1)',
  },
  quickNav: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 30,
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
  recordingSection: {
    alignItems: 'center',
    marginBottom: 40,
    paddingVertical: 20,
  },
  circle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#3498db',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  recordingCircle: {
    borderColor: '#e74c3c',
    backgroundColor: '#ffeaea',
  },
  processingCircle: {
    borderColor: '#3498db',
    backgroundColor: '#e3f2fd',
  },
  pulsingCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulse1: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#e74c3c',
    opacity: 0.7,
  },
  pulse2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#e74c3c',
    opacity: 0.4,
  },
  pulse3: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#e74c3c',
    opacity: 0.2,
  },
  innerCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  durationContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  durationText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e74c3c',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  durationLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  statusText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  transcribedText: {
    fontSize: 15,
    color: '#7f8c8d',
    textAlign: 'center',
    fontStyle: 'italic',
    minHeight: 60,
    paddingHorizontal: 25,
    lineHeight: 22,
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    width: '100%',
  },
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#27ae60',
  },
  statusMessageText: {
    fontSize: 13,
    color: '#27ae60',
    marginLeft: 10,
    fontWeight: '600',
    flex: 1,
  },
  actionsSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 14,
    marginBottom: 15,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  recordButton: {
    backgroundColor: '#3498db',
  },
  stopButton: {
    backgroundColor: '#e74c3c',
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    shadowOpacity: 0.15,
  },
  processingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderRadius: 14,
    marginBottom: 15,
    width: '100%',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  processingButtonText: {
    color: '#7f8c8d',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef9e7',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 10,
    marginBottom: 25,
    borderWidth: 2,
    borderColor: '#f39c12',
    borderStyle: 'dashed',
  },
  testButtonText: {
    color: '#f39c12',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 10,
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
    borderLeftWidth: 5,
    borderLeftColor: '#3498db',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#34495e',
    marginLeft: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  examplesSection: {
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
  examplesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  exampleIcon: {
    marginTop: 2,
  },
  exampleText: {
    flex: 1,
    fontSize: 13,
    color: '#7f8c8d',
    marginLeft: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});