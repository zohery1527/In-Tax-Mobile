// app/(auth)/verify-otp.tsx - VERSION CORRIGÉE
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icons } from '../../components/Icons';
import AuthLayout from '../../components/LoginLayout'; // CORRIGÉ : Nom du fichier
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

const { width, height } = Dimensions.get('window');
const SPACING = 16;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const params = useLocalSearchParams<{
    userId: string;
    phoneNumber: string;
    mode?: string;
    debugOtp?: string;
  }>();
  
  const userId = params.userId || '';
  const phoneNumber = params.phoneNumber || '';
  const mode = params.mode || 'login';
  const debugOtp = params.debugOtp || '';
  
  const otpInputRef = useRef<TextInput>(null);
  const [otp, setOtp] = useState('');
  const [otpCode, setOtpCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [modalVisible, setModalVisible] = useState(false);

  // Animations d'entrée
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }),
    ]).start();

    // Animation de pulsation pour les cases OTP
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    // Si debug OTP fourni
    if (debugOtp && debugOtp.length === 6) {
      setOtp(debugOtp);
      setOtpCode(debugOtp);
      setTimeout(() => {
        showOtpAlert(debugOtp);
      }, 1000);
    }
    
    // Auto-focus avec délai
    const timer = setTimeout(() => {
      otpInputRef.current?.focus();
    }, 800);
    
    // Compte à rebours
    const countdownTimer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(countdownTimer);
    };
  }, []);

  // Fonction pour afficher l'OTP en alerte
  const showOtpAlert = (code: string) => {
    setOtpCode(code);
    setModalVisible(true);
  };

  const formatPhoneForDisplay = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) return phone;
    return `+261 ${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = async () => {
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError('Ampidiro ny OTP marina (6 chiffres)');
      otpInputRef.current?.focus();
      return;
    }

    if (attempts >= 3) {
      Alert.alert(
        'Tapitra ny fanandramana ⚠️',
        'Tapitra ny fanandramanao 3. Miandry 5 minitra vao hanandrana indray.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setError(null);

    try {
      console.log('🔐 Vérification OTP pour userId:', userId);
      const result = await apiService.verifyOTP(userId, otp);
      
      console.log('✅ OTP vérifié avec succès');
      
      // Animation de succès
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Connexion avec le contexte d'authentification
      await login(result.user, result.token);
      
      // Alerte de succès avec redirection
      setTimeout(() => {
        Alert.alert(
          'Fahombiazana! 🎉',
          mode === 'login' ? 'Niditra soamantsara!' : 'Nisoratra anarana soamantsara!',
          [{
            text: 'HANOHIZANA',
            onPress: () => router.replace('/choix-interface'),
          }]
        );
      }, 500);

    } catch (err: any) {
      console.error('❌ Erreur vérification OTP:', err);
      
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setRemainingAttempts(Math.max(0, 3 - newAttempts));
      
      let errorMessage = 'OTP diso na lany. Andramo indray.';
      
      if (err.message?.includes('expiré') || err.message?.includes('expired')) {
        errorMessage = 'Lany daty ny OTP. Mila mandefa vaovao.';
      } else if (err.message?.includes('réseau') || err.message?.includes('Network')) {
        errorMessage = 'Tsy afaka mifandray. Jereo ny connexion anao.';
      } else if (err.message?.includes('invalide') || err.message?.includes('invalid')) {
        errorMessage = 'OTP diso. Jereo ary andramo indray.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Animation d'erreur
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      setError(errorMessage);
      setOtp('');
      
      // Re-focus sur le champ OTP
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 300);
      
      if (newAttempts >= 3) {
        Alert.alert(
          'Tapitra ny fanandramana ⚠️',
          'Tapitra ny fanandramanao 3. Miandry 5 minitra vao hanandrana indray.',
          [{ text: 'OK', style: 'destructive' }]
        );
      }
      
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    setLoading(true);
    setError(null);
    setCanResend(false);
    setCountdown(60);
    setAttempts(0);
    setRemainingAttempts(3);
    setOtp('');

    try {
      console.log('🔄 Renvoi OTP pour userId:', userId);
      const result = await apiService.resendOtp(userId);
      
      // Capture le code OTP s'il est disponible
      if (result.otpCode) {
        showOtpAlert(result.otpCode);
        setOtp(result.otpCode);
      } else {
        Alert.alert(
          '✅ OTP Nalefa',
          'OTP vaovao nalefa soamantsara!',
          [{ 
            text: 'OK', 
            onPress: () => otpInputRef.current?.focus() 
          }]
        );
      }
      
      // Animation de renvoi
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: 20,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
    } catch (err: any) {
      console.error('❌ Erreur renvoi OTP:', err);
      
      let errorMessage = 'Tsy afaka nandefa OTP. Andramo indray.';
      
      if (err.message?.includes('réseau') || err.message?.includes('Network')) {
        errorMessage = 'Tsy afaka mifandray amin\'ny servety.';
      } else if (err.message?.includes('fréquence') || err.message?.includes('rate')) {
        errorMessage = 'Alao kely ny fotoana eo ampiasana ny serivisy.';
      }
      
      Alert.alert('⚠️ Hadisoana', errorMessage, [{ text: 'OK', style: 'cancel' }]);
      setCanResend(true);
      
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (text: string) => {
    const digits = text.replace(/[^\d]/g, '').substring(0, 6);
    setOtp(digits);
    setError(null);
    
    // Animation pour chaque chiffre entré
    if (digits.length > otp.length) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
    
    // Auto-soumission si 6 chiffres
    if (digits.length === 6 && !loading) {
      setTimeout(() => {
        handleVerify();
      }, 200);
    }
  };

  // Rendu des chiffres OTP amélioré
  const renderOtpDigits = () => {
    const digits = otp.split('');
    const emptyBoxes = 6 - digits.length;
    
    return (
      <View style={styles.otpSection}>
        <Text style={styles.otpLabel}>Kaody OTP *</Text>
        <Text style={styles.otpInstruction}>
          Ampidiro ny kaody 6 chiffres nalefa tamin&apos;ny SMS
        </Text>
        
        <Animated.View style={[
          styles.otpDigitsContainer,
          {
            transform: [{ scale: pulseAnim }],
          }
        ]}>
          <View style={styles.otpContainer}>
            {digits.map((digit, index) => (
              <Animated.View 
                key={index}
                style={[
                  styles.otpBox,
                  {
                    backgroundColor: index === digits.length - 1 
                      ? '#2c3e50' 
                      : '#3498db',
                    transform: [{ 
                      translateY: index === digits.length - 1 ? -5 : 0 
                    }],
                  }
                ]}
              >
                <Text style={styles.otpDigit}>{digit}</Text>
              </Animated.View>
            ))}
            {Array.from({ length: emptyBoxes }).map((_, index) => (
              <TouchableOpacity 
                key={index + digits.length} 
                style={[
                  styles.otpBoxEmpty,
                  index === 0 && otp.length === 0 && styles.otpBoxEmptyActive
                ]}
                onPress={() => otpInputRef.current?.focus()}
                activeOpacity={0.9}
              >
                {index === 0 && otp.length === 0 && (
                  <View style={styles.cursor} />
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Champ de saisie caché */}
          <TextInput
            ref={otpInputRef}
            value={otp}
            onChangeText={handleOtpChange}
            style={styles.otpInput}
            keyboardType="number-pad"
            maxLength={6}
            editable={!loading && attempts < 3}
            autoFocus={true}
            caretHidden={true}
            contextMenuHidden={true}
            selectionColor="transparent"
            autoComplete="one-time-code"
          />
        </Animated.View>
        
        {error && (
          <Animated.View 
            style={[
              styles.errorMessageContainer,
              {
                transform: [{ translateX: slideAnim }],
              }
            ]}
          >
            <Icons.AlertCircle size={18} color="#e74c3c" />
            <Text style={styles.errorMessageText}>{error}</Text>
          </Animated.View>
        )}
      </View>
    );
  };

  // MODAL POUR AFFICHER L'OTP
  const OtpModal = () => (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: fadeAnim }],
            }
          ]}
        >
          {/* En-tête du modal */}
          <LinearGradient
            colors={['#27ae60', '#2ecc71']}
            style={styles.modalHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.modalHeaderContent}>
              <View style={styles.modalIconContainer}>
                <Icons.MessageSquare size={28} color="#fff" />
              </View>
              <Text style={styles.modalTitle}>Kaody OTP Nalefa</Text>
            </View>
          </LinearGradient>

          {/* Contenu du modal */}
          <View style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              Ampidiro ity kaody ity amin&apos;ny sehatra OTP:
            </Text>
            
            {/* Code OTP en grand */}
            <View style={styles.otpDisplayContainer}>
              <Text style={styles.otpCode}>{otpCode}</Text>
              <Text style={styles.otpHint}>Kaody 6 chiffres</Text>
            </View>

            <View style={styles.modalInfo}>
              <Icons.Clock size={16} color="#7f8c8d" />
              <Text style={styles.modalInfoText}>
                Ny kaody dia lany daty afaka 5 minitra
              </Text>
            </View>

            <View style={styles.modalInfo}>
              <Icons.AlertCircle size={16} color="#7f8c8d" />
              <Text style={styles.modalInfoText}>
                Aza mizara ity kaody ity amin&apos;olona
              </Text>
            </View>

            {/* Actions du modal */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalSecondaryButton}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSecondaryButtonText}>Afeno</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalPrimaryButton}
                onPress={() => {
                  if (otpCode) {
                    setOtp(otpCode);
                    setModalVisible(false);
                    setTimeout(() => {
                      otpInputRef.current?.focus();
                    }, 300);
                  }
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#3498db', '#2980b9']}
                  style={styles.modalPrimaryButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Icons.Copy size={20} color="#fff" />
                  <Text style={styles.modalPrimaryButtonText}>Ampidiro automatik</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bouton de fermeture */}
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={() => setModalVisible(false)}
            activeOpacity={0.7}
          >
            <Icons.X size={24} color="#95a5a6" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );

  // Rendu pendant le chargement ou données manquantes
  if (!userId || !phoneNumber) {
    return (
      <AuthLayout>
        <View style={styles.errorContainer}>
          <Animated.View 
            style={[
              styles.errorCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <View style={styles.errorIconContainer}>
              <Icons.AlertCircle size={64} color="#e74c3c" />
            </View>
            <Text style={styles.errorTitle}>Tsy mety ny pejy</Text>
            <Text style={styles.errorText}>
              Tsy nahitana ny angon-drakitra ilaina. Miverena eo amin&apos;ny fidirana.
            </Text>
            <TouchableOpacity 
              style={styles.backHomeButton}
              onPress={() => router.replace('/(auth)/login')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#3498db', '#2980b9']}
                style={styles.backHomeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Icons.ArrowLeft size={20} color="#fff" />
                <Text style={styles.backHomeText}>Miverena amin&apos;ny fidirana</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Modal OTP */}
          <OtpModal />

          {/* En-tête */}
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backButton}
              disabled={loading}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.backButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Icons.ArrowLeft size={24} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Fanamarinana OTP</Text>
              <Text style={styles.headerSubtitle}>Hamarino ny kaontinao</Text>
            </View>
            
            <View style={styles.progressIndicator}>
              <Text style={styles.progressText}>2/2</Text>
            </View>
          </Animated.View>

          {/* Carte principale */}
          <Animated.View 
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            {/* Titre et icône */}
            <View style={styles.titleSection}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['#3498db', '#2980b9']}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Icons.ShieldCheck size={28} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.title}>
                {mode === 'login' ? 'Hamarinina ny fidirana' : 'Hamarinina ny fisoratana'}
              </Text>
            </View>

            {/* Information téléphone */}
            <View style={styles.phoneInfoContainer}>
              <View style={styles.phoneIcon}>
                <Icons.Smartphone size={20} color="#3498db" />
              </View>
              <View style={styles.phoneInfo}>
                <Text style={styles.phoneLabel}>Laharana voaray:</Text>
                <Text style={styles.phoneNumber}>
                  {formatPhoneForDisplay(phoneNumber)}
                </Text>
              </View>
            </View>

            {/* Section OTP */}
            {renderOtpDigits()}
            
            {/* Compteur de tentatives */}
            {remainingAttempts < 3 && (
              <View style={styles.attemptsContainer}>
                <View style={styles.attemptsIcon}>
                  <Icons.AlertTriangle size={16} color="#f39c12" />
                </View>
                <Text style={styles.attemptsText}>
                  Fanandramana sisa: <Text style={styles.attemptsCount}>{remainingAttempts}</Text>/3
                </Text>
              </View>
            )}

            {/* Bouton de vérification */}
            <TouchableOpacity
              onPress={handleVerify}
              style={[
                styles.verifyButton, 
                (loading || otp.length !== 6 || attempts >= 3) && styles.buttonDisabled
              ]}
              disabled={loading || otp.length !== 6 || attempts >= 3}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={
                  otp.length === 6 && attempts < 3 
                    ? ['#27ae60', '#2ecc71'] 
                    : ['#bdc3c7', '#95a5a6']
                }
                style={styles.verifyButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Icons.CheckCircle size={22} color="#fff" />
                    <Text style={styles.verifyButtonText}>
                      {mode === 'login' ? 'HIDITRA' : 'HAMARINO'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Timer et renvoi OTP */}
            <View style={styles.resendSection}>
              <View style={styles.timerContainer}>
                <Icons.Clock size={18} color="#7f8c8d" />
                <Text style={[
                  styles.timerText,
                  canResend && styles.timerTextActive
                ]}>
                  {canResend ? '✅ Azo alefa' : `⏳ Afaka: ${formatTime(countdown)}`}
                </Text>
              </View>
              
              <TouchableOpacity
                onPress={handleResendOtp}
                style={[
                  styles.resendButton, 
                  (!canResend || loading) && styles.resendButtonDisabled
                ]}
                disabled={!canResend || loading}
                activeOpacity={0.8}
              >
                <Icons.RefreshCw size={18} color={canResend ? '#3498db' : '#95a5a6'} />
                <Text style={[
                  styles.resendText,
                  !canResend && styles.resendTextDisabled
                ]}>
                  Alefaso indray
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bouton pour voir l'OTP envoyé */}
            {otpCode && (
              <TouchableOpacity 
                onPress={() => showOtpAlert(otpCode)}
                style={styles.viewOtpButton}
                activeOpacity={0.8}
              >
                <Icons.Eye size={20} color="#3498db" />
                <Text style={styles.viewOtpText}>Hijery ny kaody OTP</Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Information de sécurité */}
          <View style={styles.securityInfo}>
            <Icons.Shield size={14} color="#95a5a6" />
            <Text style={styles.securityText}>
              Miaro ny kaontinao: Aza mizara ny kaody OTP amin&apos;olona
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24, // CORRIGÉ : Aligné avec AuthLayout
    paddingTop: 10,
    paddingBottom: SPACING * 2,
    minHeight: height - 100,
  },
  
  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING * 2,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 30,
  },
  modalHeader: {
    padding: SPACING * 2,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    flex: 1,
  },
  modalContent: {
    padding: SPACING * 2,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: SPACING * 2,
    lineHeight: 24,
  },
  otpDisplayContainer: {
    alignItems: 'center',
    marginBottom: SPACING * 2,
    padding: SPACING * 2,
    backgroundColor: '#f8f9fa',
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#3498db',
    borderStyle: 'dashed',
  },
  otpCode: {
    fontSize: 56,
    fontWeight: '800',
    color: '#2c3e50',
    letterSpacing: 12,
    marginBottom: SPACING,
  },
  otpHint: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  modalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING,
    padding: SPACING,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
  },
  modalInfoText: {
    color: '#7f8c8d',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: SPACING,
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: SPACING * 2,
    gap: SPACING,
  },
  modalSecondaryButton: {
    flex: 1,
    paddingVertical: SPACING + 4,
    borderRadius: 20,
    backgroundColor: '#f1f2f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '700',
  },
  modalPrimaryButton: {
    flex: 2,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalPrimaryButtonGradient: {
    paddingVertical: SPACING + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: SPACING,
  },
  modalCloseButton: {
    position: 'absolute',
    top: SPACING,
    right: SPACING,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // HEADER STYLES
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING * 1.5,
    paddingHorizontal: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  backButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  progressIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  
  // CARD STYLES
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: SPACING * 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.12,
    shadowRadius: 25,
    elevation: 12,
    marginBottom: SPACING * 1.5,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: SPACING * 1.5,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: SPACING,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2c3e50',
    textAlign: 'center',
  },
  phoneInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 18,
    padding: SPACING,
    marginBottom: SPACING * 1.5,
  },
  phoneIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING,
  },
  phoneInfo: {
    flex: 1,
  },
  phoneLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '600',
    marginBottom: 2,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3498db',
  },
  
  // OTP SECTION STYLES
  otpSection: {
    marginBottom: SPACING * 1.5,
  },
  otpLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 6,
    marginLeft: 2,
  },
  otpInstruction: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: SPACING * 1.5,
    textAlign: 'center',
    lineHeight: 20,
  },
  otpDigitsContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: SPACING,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING * 0.75,
    flexWrap: 'wrap',
    marginHorizontal: 'auto',
  },
  otpBox: {
    width: 56,
    height: 68,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  otpBoxEmpty: {
    width: 56,
    height: 68,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    borderWidth: 3,
    borderColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  otpBoxEmptyActive: {
    borderColor: '#3498db',
    borderStyle: 'dashed',
  },
  cursor: {
    width: 2,
    height: 28,
    backgroundColor: '#3498db',
    borderRadius: 1,
  },
  otpDigit: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  otpInput: {
    position: 'absolute',
    width: '100%',
    height: 68,
    opacity: 0,
    fontSize: 1,
  },
  
  // ERROR MESSAGE
  errorMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffeaea',
    paddingHorizontal: SPACING,
    paddingVertical: SPACING * 0.75,
    borderRadius: 14,
    marginTop: SPACING,
  },
  errorMessageText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  
  // ATTEMPTS COUNTER
  attemptsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fffbf0',
    paddingHorizontal: SPACING,
    paddingVertical: SPACING * 0.5,
    borderRadius: 12,
    marginTop: SPACING,
  },
  attemptsIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff8e6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  attemptsText: {
    color: '#f39c12',
    fontSize: 13,
    fontWeight: '600',
  },
  attemptsCount: {
    fontSize: 14,
    fontWeight: '800',
  },
  
  // VERIFY BUTTON
  verifyButton: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: SPACING,
    marginBottom: SPACING,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  verifyButtonGradient: {
    paddingVertical: SPACING + 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  
  // RESEND SECTION
  resendSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING,
    borderTopWidth: 2,
    borderTopColor: '#f1f2f6',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    color: '#7f8c8d',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  timerTextActive: {
    color: '#27ae60',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  resendTextDisabled: {
    color: '#95a5a6',
  },
  
  // VIEW OTP BUTTON
  viewOtpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: SPACING,
    paddingVertical: SPACING * 0.75,
    borderRadius: 18,
    marginTop: SPACING,
    borderWidth: 2,
    borderColor: '#3498db',
  },
  viewOtpText: {
    color: '#3498db',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 10,
  },
  
  // SECURITY INFO
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    marginTop: SPACING,
  },
  securityText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
    textAlign: 'center',
  },
  
  // ERROR CONTAINER
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING * 2,
  },
  errorCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: SPACING * 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 15,
    width: '100%',
    maxWidth: 400,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffeaea',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING * 1.5,
  },
  errorTitle: {
    color: '#e74c3c',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: SPACING,
    textAlign: 'center',
  },
  errorText: {
    color: '#7f8c8d',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING * 1.5,
  },
  backHomeButton: {
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
  },
  backHomeGradient: {
    paddingVertical: SPACING + 4,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backHomeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 10,
  },
});