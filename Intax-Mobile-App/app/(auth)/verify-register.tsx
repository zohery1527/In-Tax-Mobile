import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icons } from '../../components/Icons';
import AuthLayout from '../../components/LoginLayout';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

const { width } = Dimensions.get('window');

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const params = useLocalSearchParams<{
    userId: string;
    phoneNumber: string;
    otpCode:string,
    mode?: string;
    debugOtp?: string;
  }>();
  
  const userId = params.userId || '';
  const phoneNumber = params.phoneNumber || '';
  const mode = params.mode || 'login';
  const debugOtp = params.debugOtp || '';
  
  const otpInputRef = useRef<TextInput>(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [otpFromBackend, setOtpFromBackend] = useState<string>('');

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    // Si debug OTP fourni, l'afficher et le remplir
    if (debugOtp && debugOtp.length === 6) {
      setOtp(debugOtp);
      setOtpFromBackend(debugOtp);
      showOtpAlert(debugOtp);
    }
    
    // Auto-focus
    const timer = setTimeout(() => {
      otpInputRef.current?.focus();
    }, 500);
    
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
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Fonction pour afficher l'OTP en alerte
  const showOtpAlert = (code: string) => {
    Alert.alert(
      '📱 Kaody OTP Nalefa',
      `**Kaody:** ${code}\n\nAmpidiro ity kaody ity amin'ny sehatra OTP. Ny kaody dia lany daty afaka 5 minitra.`,
      [
        { 
          text: 'Afeno', 
          style: 'cancel' 
        },
        { 
          text: 'Ampidiro automatik', 
          onPress: () => {
            setOtp(code);
            setTimeout(() => otpInputRef.current?.focus(), 100);
          }
        }
      ]
    );
  };

  const formatPhoneForDisplay = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) return phone;
    return `+261 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        [{ text: 'OK' }]
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
      
      // Connexion avec le contexte d'authentification
      await login(result.user, result.token);
      
      // Alerte de succès avec redirection
      Alert.alert(
        '🎉 Fahombiazana!',
        mode === 'login' ? 'Niditra soamantsara!' : 'Nisoratra anarana soamantsara!',
        [{
          text: 'HANOHIZANA',
          onPress: () => router.replace('/choix-interface'),
        }]
      );

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
      
      setError(errorMessage);
      setOtp('');
      
      // Re-focus sur le champ OTP
      setTimeout(() => otpInputRef.current?.focus(), 300);
      
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
      
      // Stocker et afficher le code OTP reçu du backend
      if (result.otpCode) {
        setOtpFromBackend(result.otpCode);
        showOtpAlert(result.otpCode);
        setOtp(result.otpCode);
      } else {
        // Si pas de otpCode dans la réponse, montrer un message générique
        Alert.alert(
          '✅ OTP Nalefa',
          'OTP vaovao nalefa soamantsara amin\'ny laharanao finday!',
          [{ 
            text: 'OK', 
            onPress: () => {
              otpInputRef.current?.focus();
              // En mode dev, on peut afficher un code fictif
              if (__DEV__) {
                setTimeout(() => {
                  Alert.alert(
                    'DEV MODE - OTP simulé',
                    `Pour les tests: ${otp}`,
                    [
                      { text: 'OK' },
                      { 
                        text: 'Remplir', 
                        onPress: () => {
                          setOtp(otp);
                          setOtpFromBackend(otp);
                        }
                      }
                    ]
                  );
                }, 500);
              }
            }
          }]
        );
      }
      
    } catch (err: any) {
      console.error('❌ Erreur renvoi OTP:', err);
      
      let errorMessage = 'Tsy afaka nandefa OTP. Andramo indray.';
      
      if (err.message?.includes('réseau') || err.message?.includes('Network')) {
        errorMessage = 'Tsy afaka mifandray amin\'ny servety.';
      } else if (err.message?.includes('fréquence') || err.message?.includes('rate')) {
        errorMessage = 'Alao kely ny fotoana eo ampiasana ny serivisy.';
      }
      
      Alert.alert('⚠️ Hadisoana', errorMessage);
      setCanResend(true);
      
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (text: string) => {
    const digits = text.replace(/[^\d]/g, '').substring(0, 6);
    setOtp(digits);
    setError(null);
    
    // Auto-soumission si 6 chiffres
    if (digits.length === 6 && !loading) {
      setTimeout(() => {
        handleVerify();
      }, 200);
    }
  };

  // Rendu des cases OTP avec layout corrigé
  const renderOtpDigits = () => {
    const digits = otp.split('');
    const emptyBoxes = 6 - digits.length;
    
    return (
      <View style={styles.otpSection}>
        <Text style={styles.inputLabel}>
          Kaody OTP <Text style={styles.required}>*</Text>
        </Text>
        
        {/* Container principal avec largeur fixe */}
        <View style={styles.otpContainerWrapper}>
          <View style={styles.otpDigitsContainer}>
            {digits.map((digit, index) => (
              <View 
                key={index}
                style={[
                  styles.otpBox,
                  { 
                    backgroundColor: '#3498db',
                    marginHorizontal: 4, // Espacement réduit
                  }
                ]}
              >
                <Text style={styles.otpDigit}>{digit}</Text>
              </View>
            ))}
            
            {Array.from({ length: emptyBoxes }).map((_, index) => (
              <TouchableOpacity 
                key={index + digits.length} 
                style={[
                  styles.otpBoxEmpty,
                  index === 0 && otp.length === 0 && styles.otpBoxEmptyActive,
                  { marginHorizontal: 4 }
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
          
          {/* Instruction */}
          <Text style={styles.otpInstruction}>
            Ampidiro ny kaody 6 chiffres nalefa tamin&apos;ny laharanao
          </Text>
          
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
            selectionColor="transparent"
          />
        </View>
        
        {error && (
          <View style={styles.errorContainer}>
            <Icons.AlertCircle size={16} color="#e74c3c" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    );
  };

  // Rendu si données manquantes
  if (!userId || !phoneNumber) {
    return (
      <AuthLayout>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <Icons.AlertCircle size={64} color="#e74c3c" />
            <Text style={styles.errorTitle}>Tsy mety ny pejy</Text>
            <Text style={styles.errorText}>
              Tsy nahitana ny angon-drakitra ilaina.
            </Text>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.replace('/(auth)/login')}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>Miverena amin&apos;ny fidirana</Text>
            </TouchableOpacity>
          </View>
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            keyboardVisible && styles.scrollContentWithKeyboard
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backButton}
            >
              <Icons.ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Text style={styles.appName}>IN-TAX</Text>
              <Text style={styles.appTagline}>Fanamarinana OTP</Text>
            </View>
            
            <View style={styles.placeholder} />
          </View>

          {/* Welcome */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>
              {mode === 'login' ? 'Hamarinina ny fidirana' : 'Hamarinina ny fisoratana'}
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Nalefa ny kaody OTP amin&apos;ny laharana finday voafantina
            </Text>
          </View>

          {/* Main Card */}
          <View style={styles.card}>
            {/* Phone Info */}
            <View style={styles.phoneInfo}>
              <View style={styles.phoneIcon}>
                <Icons.Phone size={20} color="#3498db" />
              </View>
              <View>
                <Text style={styles.phoneLabel}>Laharana voaray:</Text>
                <Text style={styles.phoneNumber}>
                  {formatPhoneForDisplay(phoneNumber)}
                </Text>
              </View>
            </View>

            {/* OTP Section */}
            {renderOtpDigits()}

            {/* Attempts Counter */}
            {remainingAttempts < 3 && (
              <View style={styles.attemptsContainer}>
                <Icons.AlertTriangle size={16} color="#f39c12" />
                <Text style={styles.attemptsText}>
                  Fanandramana sisa: <Text style={styles.attemptsCount}>{remainingAttempts}</Text>/3
                </Text>
              </View>
            )}

            {/* Verify Button */}
            <TouchableOpacity
              onPress={handleVerify}
              style={[
                styles.verifyButton,
                (loading || otp.length !== 6 || attempts >= 3) && styles.verifyButtonDisabled
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

            {/* Timer and Resend */}
            <View style={styles.resendSection}>
              <View style={styles.timerContainer}>
                <Icons.Clock size={16} color="#7f8c8d" />
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
                <Icons.RefreshCw size={16} color={canResend ? '#3498db' : '#95a5a6'} />
                <Text style={[
                  styles.resendText,
                  !canResend && styles.resendTextDisabled
                ]}>
                  Alefaso indray
                </Text>
              </TouchableOpacity>
            </View>

            {/* Show OTP Button - seulement si on a un code */}
            {(otpFromBackend || __DEV__) && (
              <TouchableOpacity 
                onPress={() => {
                  if (otpFromBackend) {
                    showOtpAlert(otpFromBackend);
                  } else if (__DEV__) {
                    // En mode dev, générer un code fictif
                    const fakeOtp = Math.floor(100000 + Math.random() * 900000).toString();
                    Alert.alert(
                      'DEV MODE - Code simulé',
                      `Code OTP simulé: ${fakeOtp}`,
                      [
                        { text: 'Annuler' },
                        { 
                          text: 'Remplir', 
                          onPress: () => {
                            setOtp(fakeOtp);
                            setOtpFromBackend(fakeOtp);
                          }
                        }
                      ]
                    );
                  }
                }}
                style={styles.showOtpButton}
                activeOpacity={0.8}
              >
                <Icons.Eye size={18} color="#3498db" />
                <Text style={styles.showOtpText}>
                  {otpFromBackend ? 'Hijery ny kaody OTP' : 'Simuler OTP (DEV)'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Security Info */}
          <View style={styles.securityInfo}>
            <Icons.Shield size={16} color="#27ae60" />
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  scrollContentWithKeyboard: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  appName: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  appTagline: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  placeholder: {
    width: 40,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 30,
    elevation: 15,
  },
  phoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  phoneIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
  otpSection: {
    marginBottom: 20,
  },
  otpContainerWrapper: {
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
    marginLeft: 4,
  },
  required: {
    color: '#e74c3c',
  },
  otpDigitsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 16,
    width: '100%',
    maxWidth: 320, // Largeur maximale pour éviter le débordement
  },
  otpBox: {
    width: 50,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  otpBoxEmpty: {
    width: 50,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  otpBoxEmptyActive: {
    borderColor: '#3498db',
    borderStyle: 'dashed',
  },
  cursor: {
    width: 2,
    height: 24,
    backgroundColor: '#3498db',
    borderRadius: 1,
  },
  otpDigit: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  otpInstruction: {
    color: '#7f8c8d',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  otpInput: {
    position: 'absolute',
    width: '100%',
    height: 60,
    opacity: 0,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffeaea',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  attemptsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fffbf0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
  },
  attemptsText: {
    color: '#f39c12',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  attemptsCount: {
    fontSize: 14,
    fontWeight: '800',
  },
  verifyButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonGradient: {
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  verifyButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  resendSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f2f6',
    marginBottom: 16,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    color: '#7f8c8d',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  timerTextActive: {
    color: '#27ae60',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendText: {
    color: '#3498db',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  resendTextDisabled: {
    color: '#95a5a6',
  },
  showOtpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3498db',
    marginTop: 12,
  },
  showOtpText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  securityInfo: {
    flexDirection: 'row',
    backgroundColor: 'rgba(39, 174, 96, 0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(39, 174, 96, 0.2)',
  },
  securityText: {
    flex: 1,
    color: '#2c3e50',
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  errorTitle: {
    color: '#e74c3c',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
  },
  backButtonText: {
    color: '#3498db',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 20,
  },
});