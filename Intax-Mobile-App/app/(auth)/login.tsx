import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Icons } from '../../components/Icons';
import AuthLayout from '../../components/LoginLayout';
import { apiService } from '../../services/api';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const phoneInputRef = useRef<TextInput>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    // Focus après un délai plus court
    const timer = setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async () => {
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    
    if (!cleanedPhone) {
      setError('Ampidiro ny laharana finday.');
      return;
    }
    
    if (cleanedPhone.length !== 10) {
      setError('Laharana finday tsy mety. Tokony ho 10 chiffres.');
      return;
    }

    if (!cleanedPhone.startsWith('03') && !cleanedPhone.startsWith('02')) {
      setError('Laharana finday malagasy tsy mety (tokony manomboka amin\'ny 03 na 02)');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setError(null);

    try {
      console.log('📱 Tentative de connexion:', cleanedPhone);
      
      const response = await apiService.login(cleanedPhone);
      
      console.log('✅ Réponse API login:', response);
      
      router.push({
        pathname: '/(auth)/verify-register',
        params: { 
          phoneNumber: cleanedPhone,
          userId: response.userId
        }
      });
      
    } catch (err: any) {
      console.error('❌ Erreur login:', err);
      
      let errorMessage = 'Nisy olana tamin\'ny fidirana. Andramo indray azafady.';
      
      if (err.message?.includes('Network') || err.message?.includes('connexion')) {
        errorMessage = 'Tsy afaka mampifandray amin\'ny servety. Jereo ny connexion Internet-nao.';
      } else if (err.message?.includes('non trouvé') || err.message?.includes('not found')) {
        errorMessage = 'Tsy misy kaonty misy an\'io laharana finday io. Soraty anarana aloha.';
        // Option : Redirection automatique vers l'inscription
        setTimeout(() => {
          router.push({
            pathname: '/(auth)/register',
            params: { phoneNumber: cleanedPhone }
          });
        }, 1500);
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      Alert.alert(
        'Hadisoana',
        errorMessage,
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (text: string) => {
    // Autoriser seulement les chiffres
    const cleaned = text.replace(/\D/g, '');
    // Limiter à 10 caractères
    const limited = cleaned.slice(0, 10);
    
    setPhoneNumber(limited);
    if (error) setError(null);
  };

  const handleQuickFill = (number: string) => {
    setPhoneNumber(number);
    if (error) setError(null);
    // Focus sur l'input après un court délai
    setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 100);
  };

  const handleSubmit = () => {
    if (phoneNumber.length === 10) {
      handleLogin();
    }
  };

  const formatDisplayPhone = (phone: string) => {
    if (phone.length <= 3) return phone;
    if (phone.length <= 6) return `${phone.slice(0, 3)} ${phone.slice(3)}`;
    return `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6, 10)}`;
  };

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
          bounces={false}
        >
          {/* En-tête avec logo moderne */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#3498db', '#2980b9']}
                style={styles.logoGradient}
              >
                <Icons.Shield size={40} color="#fff" />
              </LinearGradient>
            </View>
            
            <View style={styles.titleContainer}>
              <Text style={styles.appName}>IN-TAX</Text>
              <Text style={styles.appTagline}>Fitantanam-bola Malagasy</Text>
            </View>
            
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>Tonga soa eto</Text>
              <Text style={styles.welcomeSubtitle}>
                Hiditra amin&apos;ny kaontinao mba hanatanterahana ny asa hetra
              </Text>
            </View>
          </View>

          {/* Carte de connexion moderne */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Hiditra</Text>
              <Text style={styles.cardSubtitle}>
                Ampidiro ny laharana finday hanombohana
              </Text>
            </View>

            {/* Champ téléphone avec design amélioré */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                Laharan&apos;ny finday <Text style={styles.required}>*</Text>
              </Text>
              
              <TouchableWithoutFeedback onPress={() => phoneInputRef.current?.focus()}>
                <View style={[
                  styles.inputWrapper,
                  isFocused && styles.inputWrapperFocused,
                  error && styles.inputWrapperError
                ]}>
                  <View style={styles.inputIcon}>
                    <Icons.Phone size={22} color={error ? '#e74c3c' : '#7f8c8d'} />
                  </View>
                  
                  <TextInput
                    ref={phoneInputRef}
                    value={formatDisplayPhone(phoneNumber)}
                    onChangeText={handlePhoneChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="034 20 152 72"
                    keyboardType="number-pad"
                    style={styles.input}
                    placeholderTextColor="#95a5a6"
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    maxLength={12} // 10 chiffres + 2 espaces
                    selectionColor="#3498db"
                    blurOnSubmit={true}
                    autoCorrect={false}
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                  
                  {phoneNumber && (
                    <TouchableOpacity 
                      onPress={() => setPhoneNumber('')}
                      style={styles.clearButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Icons.X size={18} color="#7f8c8d" />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableWithoutFeedback>
              
              {error ? (
                <View style={styles.errorContainer}>
                  <Icons.AlertCircle size={16} color="#e74c3c" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : (
                <Text style={styles.hintText}>
                  ⓘ Tokony ho 10 chiffres (ex: 0342015272)
                </Text>
              )}
            </View>

            {/* Boutons d'exemple rapide */}
            <View style={styles.quickFillContainer}>
              <Text style={styles.quickFillLabel}>Ohatra:</Text>
              <View style={styles.quickFillButtons}>
                {['0342015272', '0321234567', '0339876543'].map((num, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleQuickFill(num)}
                    style={styles.quickFillButton}
                    disabled={loading}
                  >
                    <Text style={styles.quickFillText}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Bouton de connexion */}
            <TouchableOpacity
              onPress={handleLogin}
              style={[
                styles.loginButton,
                (loading || phoneNumber.length !== 10) && styles.loginButtonDisabled
              ]}
              disabled={loading || phoneNumber.length !== 10}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#27ae60', '#2ecc71']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.buttonTextLoading}>EO AM-PANDINIHA...</Text>
                  </>
                ) : (
                  <>
                    <Icons.Login size={22} color="#fff" />
                    <Text style={styles.buttonText}>ALAHARO NY OTP</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Séparateur */}
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>SA</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Lien inscription */}
            <View style={styles.registerSection}>
              <Text style={styles.registerText}>
                Tsy manana kaonty mbola?
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/register')}
                style={styles.registerButton}
                disabled={loading}
              >
                <Text style={styles.registerButtonText}>Hisoratra anarana</Text>
                <Icons.ArrowRight size={18} color="#3498db" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Information de sécurité */}
          <View style={styles.securityInfo}>
            <View style={styles.securityIcon}>
              <Icons.ShieldCheck size={18} color="#27ae60" />
            </View>
            <Text style={styles.securityText}>
              Ny OTP dia alefa amin&apos;ny laharana finday nampidirinao. Azo antoka ny fiarovana ny kaontinao.
            </Text>
          </View>

          {/* Numéro support */}
          <TouchableOpacity style={styles.supportContainer}>
            <Icons.Headphones size={16} color="#7f8c8d" />
            <Text style={styles.supportText}>Manana olana? Antsoy: 034 20 152 72</Text>
          </TouchableOpacity>
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
    justifyContent: 'center',
    paddingVertical: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  appTagline: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  welcomeContainer: {
    alignItems: 'center',
    maxWidth: 300,
  },
  welcomeTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 30,
    elevation: 15,
    marginBottom: 24,
  },
  cardHeader: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 15,
    color: '#6c7a89',
    textAlign: 'center',
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
    marginLeft: 4,
  },
  required: {
    color: '#e74c3c',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    minHeight: 58,
  },
  inputWrapperFocused: {
    borderColor: '#3498db',
    backgroundColor: '#fff',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  inputWrapperError: {
    borderColor: '#e74c3c',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#2c3e50',
    fontWeight: '500',
    letterSpacing: 1,
    paddingVertical: 16,
    paddingHorizontal: 0,
    minHeight: 26,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 4,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
  hintText: {
    color: '#7f8c8d',
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  quickFillContainer: {
    marginBottom: 24,
  },
  quickFillLabel: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 8,
    marginLeft: 4,
  },
  quickFillButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickFillButton: {
    backgroundColor: '#f1f2f6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dfe4ea',
  },
  quickFillText: {
    color: '#3498db',
    fontSize: 12,
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  buttonTextLoading: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 10,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e9ecef',
  },
  separatorText: {
    color: '#95a5a6',
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 16,
    paddingHorizontal: 8,
  },
  registerSection: {
    alignItems: 'center',
  },
  registerText: {
    color: '#7f8c8d',
    fontSize: 14,
    marginBottom: 12,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52, 152, 219, 0.3)',
  },
  registerButtonText: {
    color: '#3498db',
    fontSize: 15,
    fontWeight: '700',
    marginRight: 6,
  },
  securityInfo: {
    flexDirection: 'row',
    backgroundColor: 'rgba(39, 174, 96, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    alignItems: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(39, 174, 96, 0.2)',
  },
  securityIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  securityText: {
    flex: 1,
    color: '#2c3e50',
    fontSize: 13,
    lineHeight: 18,
  },
  supportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  supportText: {
    color: '#7f8c8d',
    fontSize: 13,
    marginLeft: 8,
  },
});