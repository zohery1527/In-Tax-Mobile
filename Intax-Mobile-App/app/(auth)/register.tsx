import { Picker } from '@react-native-picker/picker';
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
import { apiService, Zone } from '../../services/api';

const { width } = Dimensions.get('window');

interface FormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  activityType: 'ALIMENTATION' | 'ARTISANAT' | 'COMMERCE' | 'SERVICES' | 'AUTRE';
  zoneId: string;
}

const ACTIVITIES = [
  { type: 'COMMERCE' as const, label: 'Varotra', emoji: '🛒', color: '#3498db' },
  { type: 'ALIMENTATION' as const, label: 'Sakafo', emoji: '🍲', color: '#e74c3c' },
  { type: 'ARTISANAT' as const, label: 'Asa tanana', emoji: '🛠️', color: '#f39c12' },
  { type: 'SERVICES' as const, label: 'Tohotra', emoji: '💼', color: '#9b59b6' },
  { type: 'AUTRE' as const, label: 'Hafa', emoji: '📦', color: '#95a5a6' },
];

export default function RegisterScreen() {
  const router = useRouter();
  
  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    activityType: 'COMMERCE',
    zoneId: '',
  });
  
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    loadZones();
    
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (!zonesLoading && zones.length > 0 && !formData.zoneId) {
      setFormData(prev => ({ 
        ...prev, 
        zoneId: zones[0].id.toString() 
      }));
    }
  }, [zonesLoading, zones]);

  const loadZones = async () => {
    try {
      const zonesData = await apiService.getAllZones();
      setZones(zonesData);
    } catch (err: any) {
      console.error('❌ Erreur chargement zones:', err);
      Alert.alert(
        'Hadisoana',
        'Tsy afaka mampifandray amin\'ny servety. Andramo indray azafady.',
        [{ text: 'OK' }]
      );
      setZones([]);
    } finally {
      setZonesLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Anarana tsy maintsy fenoina';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Fanampiny anarana tsy maintsy fenoina';
    }
    
    const cleanedPhone = formData.phoneNumber.replace(/\D/g, '');
    
    if (!cleanedPhone) {
      newErrors.phoneNumber = 'Laharana finday tsy maintsy fenoina';
    } else if (cleanedPhone.length !== 10) {
      newErrors.phoneNumber = 'Tokony ho 10 chiffres';
    }
    
    if (!formData.zoneId) {
      newErrors.zoneId = 'Safidio faritra iray';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    Keyboard.dismiss();
    setLoading(true);
    
    try {
      const cleanNumber = formData.phoneNumber.replace(/\D/g, '');
      
      const payload = { 
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: cleanNumber,
        activityType: formData.activityType,
        zoneId: parseInt(formData.zoneId, 10)
      };
      
      const result = await apiService.register(payload);
      
      router.push({
        pathname: '/(auth)/verify-register',
        params: { 
          userId: result.user?.id || result.userId,
          phoneNumber: cleanNumber,
          mode: 'register',
          debugOtp: result.otpCode
        },
      });
      
    } catch (err: any) {
      console.error('❌ Erreur inscription:', err);
      
      let errorMessage = 'Nisy olana tamin\'ny fisoratana anarana. Andramo indray azafady.';
      
      if (err.message?.includes('déjà') || err.message?.includes('exists')) {
        errorMessage = 'Efa misy kaonty misy an\'io laharana finday io.';
      } else if (err.message?.includes('Network')) {
        errorMessage = 'Tsy afaka mampifandray amin\'ny servety.';
      }
      
      Alert.alert('Hadisoana', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const ActivityButton = ({ 
    type, 
    label, 
    emoji,
    color 
  }: { 
    type: FormData['activityType']; 
    label: string; 
    emoji: string;
    color: string;
  }) => {
    const selected = formData.activityType === type;
    
    return (
      <TouchableOpacity
        onPress={() => {
          setFormData({ ...formData, activityType: type });
          if (errors.activityType) setErrors(prev => ({ ...prev, activityType: '' }));
        }}
        style={[
          styles.activityButton,
          selected && styles.activityButtonSelected,
          selected && { borderColor: color, backgroundColor: `${color}15` }
        ]}
        activeOpacity={0.7}
      >
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={[
          styles.activityLabel,
          selected && styles.activityLabelSelected,
          selected && { color }
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const limited = cleaned.slice(0, 10);
    handleInputChange('phoneNumber', limited);
  };

  const formatDisplayPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
  };

  if (zonesLoading) {
    return (
      <AuthLayout>
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={['#fff', '#f8f9fa']}
            style={styles.loadingCard}
          >
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Eo am-pamakiana ny faritra...</Text>
          </LinearGradient>
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
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            keyboardVisible && styles.scrollContentWithKeyboard
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* En-tête simplifiée comme login */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backButton}
            >
              <Icons.ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Text style={styles.appName}>IN-TAX</Text>
              <Text style={styles.appTagline}>Hisoratra anarana</Text>
            </View>
            
            <View style={styles.placeholder} />
          </View>

          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Hanomboka ny kaontinao</Text>
            <Text style={styles.welcomeSubtitle}>
              Fenoio ny mombamomba anao mba hanombohana ny fampiasana ny serivisy
            </Text>
          </View>

          {/* Carte principale - style identique à login */}
          <View style={styles.card}>
            {/* Nom et Prénom */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                Anarana <Text style={styles.required}>*</Text>
              </Text>
              
              <View style={styles.nameRow}>
                <TouchableWithoutFeedback onPress={() => firstNameRef.current?.focus()}>
                  <View style={[
                    styles.inputWrapper,
                    focusedField === 'firstName' && styles.inputWrapperFocused,
                    errors.firstName && styles.inputWrapperError
                  ]}>
                    <TextInput
                      ref={firstNameRef}
                      value={formData.firstName}
                      onChangeText={(text) => handleInputChange('firstName', text)}
                      onFocus={() => setFocusedField('firstName')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Rado"
                      style={styles.input}
                      placeholderTextColor="#95a5a6"
                      editable={!loading}
                      returnKeyType="next"
                      maxLength={50}
                      autoCapitalize="words"
                    />
                  </View>
                </TouchableWithoutFeedback>
                
                <TouchableWithoutFeedback onPress={() => lastNameRef.current?.focus()}>
                  <View style={[
                    styles.inputWrapper,
                    focusedField === 'lastName' && styles.inputWrapperFocused,
                    errors.lastName && styles.inputWrapperError
                  ]}>
                    <TextInput
                      ref={lastNameRef}
                      value={formData.lastName}
                      onChangeText={(text) => handleInputChange('lastName', text)}
                      onFocus={() => setFocusedField('lastName')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Andriana"
                      style={styles.input}
                      placeholderTextColor="#95a5a6"
                      editable={!loading}
                      returnKeyType="next"
                      maxLength={50}
                      autoCapitalize="words"
                    />
                  </View>
                </TouchableWithoutFeedback>
              </View>
              
              {(errors.firstName || errors.lastName) && (
                <View style={styles.errorContainer}>
                  <Icons.AlertCircle size={16} color="#e74c3c" />
                  <Text style={styles.errorText}>
                    {errors.firstName || errors.lastName}
                  </Text>
                </View>
              )}
            </View>

            {/* Téléphone */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                Laharan&apos;ny finday <Text style={styles.required}>*</Text>
              </Text>
              
              <TouchableWithoutFeedback onPress={() => phoneRef.current?.focus()}>
                <View style={[
                  styles.inputWrapper,
                  focusedField === 'phoneNumber' && styles.inputWrapperFocused,
                  errors.phoneNumber && styles.inputWrapperError
                ]}>
                  <View style={styles.inputIcon}>
                    <Icons.Phone size={22} color={errors.phoneNumber ? '#e74c3c' : '#7f8c8d'} />
                  </View>
                  
                  <TextInput
                    ref={phoneRef}
                    value={formatDisplayPhone(formData.phoneNumber)}
                    onChangeText={handlePhoneChange}
                    onFocus={() => setFocusedField('phoneNumber')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="034 20 152 72"
                    keyboardType="number-pad"
                    style={styles.input}
                    placeholderTextColor="#95a5a6"
                    editable={!loading}
                    returnKeyType="next"
                    maxLength={12}
                    selectionColor="#3498db"
                  />
                </View>
              </TouchableWithoutFeedback>
              
              {errors.phoneNumber ? (
                <View style={styles.errorContainer}>
                  <Icons.AlertCircle size={16} color="#e74c3c" />
                  <Text style={styles.errorText}>{errors.phoneNumber}</Text>
                </View>
              ) : (
                <Text style={styles.hintText}>
                  ⓘ Tokony ho 10 chiffres (ex: 0342015272)
                </Text>
              )}
            </View>

            {/* Activité */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                Karazana asa atao <Text style={styles.required}>*</Text>
              </Text>
              
              <View style={styles.activityGrid}>
                {ACTIVITIES.map((activity) => (
                  <ActivityButton
                    key={activity.type}
                    type={activity.type}
                    label={activity.label}
                    emoji={activity.emoji}
                    color={activity.color}
                  />
                ))}
              </View>
            </View>

            {/* Zone */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                Faritra misy anao <Text style={styles.required}>*</Text>
              </Text>
              
              <View style={[
                styles.pickerContainer,
                errors.zoneId && styles.pickerContainerError
              ]}>
                <Picker
                  selectedValue={formData.zoneId}
                  onValueChange={(value) => handleInputChange('zoneId', value)}
                  style={styles.picker}
                  dropdownIconColor="#3498db"
                  enabled={!loading}
                >
                  {zones.map(zone => (
                    <Picker.Item 
                      key={zone.id} 
                      label={`${zone.name} (${zone.region})`} 
                      value={zone.id.toString()} 
                    />
                  ))}
                </Picker>
              </View>
              
              {errors.zoneId && (
                <View style={styles.errorContainer}>
                  <Icons.AlertCircle size={16} color="#e74c3c" />
                  <Text style={styles.errorText}>{errors.zoneId}</Text>
                </View>
              )}
            </View>

            {/* Bouton d'inscription - style identique à login */}
            <TouchableOpacity
              onPress={handleRegister}
              style={[
                styles.registerButton,
                loading && styles.registerButtonDisabled
              ]}
              disabled={loading}
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
                    <Text style={styles.buttonTextLoading}>EO AM-PANDEFASANA...</Text>
                  </>
                ) : (
                  <>
                    <Icons.CheckCircle size={22} color="#fff" />
                    <Text style={styles.buttonText}>HANOMBOKA NY FISORATANA</Text>
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

            {/* Lien vers login */}
            <View style={styles.loginRedirect}>
              <Text style={styles.loginText}>Efa manana kaonty?</Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/login')}
                style={styles.loginButton}
                disabled={loading}
              >
                <Text style={styles.loginButtonText}>Hiditra eto</Text>
                <Icons.ArrowRight size={18} color="#3498db" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Information sécurité */}
          <View style={styles.securityInfo}>
            <View style={styles.securityIcon}>
              <Icons.ShieldCheck size={18} color="#27ae60" />
            </View>
            <Text style={styles.securityText}>
              Ny angon-drakitrao dia voatahiry sy azo antoka. Manaraka ny lalàna ny fiarovana.
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
  inputSection: {
    marginBottom: 24,
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
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    minHeight: 56,
    justifyContent: 'center',
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
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
    paddingVertical: 16,
    paddingHorizontal: 0,
    minHeight: 24,
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
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  activityButton: {
    flex: 1,
    minWidth: (width - 96) / 3,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  activityButtonSelected: {
    borderWidth: 2,
  },
  emoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  activityLabel: {
    fontSize: 13,
    color: '#6c7a89',
    fontWeight: '600',
    textAlign: 'center',
  },
  activityLabelSelected: {
    fontWeight: '700',
  },
  pickerContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    minHeight: 56,
  },
  pickerContainerError: {
    borderColor: '#e74c3c',
    backgroundColor: '#fff5f5',
  },
  picker: {
    height: 56,
    color: '#2c3e50',
    fontSize: 16,
  },
  registerButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  registerButtonDisabled: {
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
  loginRedirect: {
    alignItems: 'center',
  },
  loginText: {
    color: '#7f8c8d',
    fontSize: 14,
    marginBottom: 12,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52, 152, 219, 0.3)',
  },
  loginButtonText: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingCard: {
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  loadingText: {
    color: '#2c3e50',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 20,
  },
});