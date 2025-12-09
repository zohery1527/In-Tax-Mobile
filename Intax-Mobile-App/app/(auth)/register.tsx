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
  View,
} from 'react-native';
import { Icons } from '../../components/Icons';
import AuthLayout from '../../components/LoginLayout'; // ✅ CORRECTION: AuthLayout au lieu de LoginLayout
import { apiService, Zone } from '../../services/api';

const { width, height } = Dimensions.get('window');

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
  
  // Références pour les champs
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

  useEffect(() => {
    loadZones();
    
    // Auto-focus après chargement des zones
    if (!zonesLoading) {
      const timer = setTimeout(() => {
        firstNameRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [zonesLoading]);

  const loadZones = async () => {
    try {
      const zonesData = await apiService.getAllZones();
      console.log('📡 Zones chargées:', zonesData.length);
      
      setZones(zonesData);
      
      if (zonesData.length > 0 && !formData.zoneId) {
        setFormData(prev => ({ 
          ...prev, 
          zoneId: zonesData[0].id.toString() 
        }));
      }
    } catch (err: any) {
      console.error('❌ Erreur chargement zones:', err);
      Alert.alert(
        'Hadisoana',
        'Tsy afaka mampifandray amin\'ny servety. Andramo indray azafady.',
        [{ text: 'OK', style: 'default' }]
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
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'Anarana tokony ho 2 caractères farafahakeliny';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Fanampiny anarana tsy maintsy fenoina';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Fanampiny anarana tokony ho 2 caractères farafahakeliny';
    }
    
    const cleanedPhone = formData.phoneNumber.replace(/\D/g, '');
    const phoneRegex = /^0(?:23|32|33|34|38|39)\d{7}$/;
    
    if (!cleanedPhone) {
      newErrors.phoneNumber = 'Laharana finday tsy maintsy fenoina';
    } else if (cleanedPhone.length !== 10) {
      newErrors.phoneNumber = 'Tokony ho 10 chiffres';
    } else if (!phoneRegex.test(cleanedPhone)) {
      newErrors.phoneNumber = 'Laharana finday malagasy tsy mety';
    }
    
    if (!formData.zoneId) {
      newErrors.zoneId = 'Safidio faritra iray';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    if (zones.length === 0) {
      Alert.alert('Faritra tsy misy', 'Tsy misy faritra mbola voarakitra.');
      return;
    }

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
      
      console.log('📝 Envoi inscription:', payload);
      const result = await apiService.register(payload);
      
      console.log('✅ Inscription réussie:', result);
      
      router.push({
        pathname: '/(auth)/verify-register',
        params: { 
          userId: result.user?.id || result.userId,
          phoneNumber: cleanNumber,
          mode: 'register',
          debugOtp: result.otpCode || ''
        },
      });
      
    } catch (err: any) {
      console.error('❌ Erreur inscription:', err);
      
      let errorMessage = 'Nisy olana tamin\'ny fisoratana anarana. Andramo indray azafady.';
      
      if (err.message?.includes('déjà') || err.message?.includes('exists')) {
        errorMessage = 'Efa misy kaonty misy an\'io laharana finday io.\nMandehana amin\'ny fidirana.';
        // Option: Redirection vers login
        setTimeout(() => {
          router.push({
            pathname: '/(auth)/login',
            params: { phoneNumber: formData.phoneNumber }
          });
        }, 2000);
      } else if (err.message?.includes('Network') || err.message?.includes('connexion')) {
        errorMessage = 'Tsy afaka mampifandray amin\'ny servety.\nJereo ny connexion Internet-nao.';
      } else if (err.message) {
        errorMessage = err.message;
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
          if (errors.activityType) {
            setErrors(prev => ({ ...prev, activityType: '' }));
          }
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
        {selected && (
          <View style={[styles.selectedIndicator, { backgroundColor: color }]} />
        )}
      </TouchableOpacity>
    );
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Effacer l'erreur quand l'utilisateur tape
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const focusNextField = (nextField: 'lastName' | 'phone' | 'zone') => {
    switch (nextField) {
      case 'lastName':
        lastNameRef.current?.focus();
        break;
      case 'phone':
        phoneRef.current?.focus();
        break;
      case 'zone':
        // Scroll vers le picker
        scrollViewRef.current?.scrollTo({ y: 650, animated: true });
        Keyboard.dismiss();
        break;
    }
  };

  const handleQuickFill = () => {
    const exampleData = {
      firstName: 'Rado',
      lastName: 'Andriana',
      phoneNumber: '0342015272',
      activityType: 'COMMERCE' as const,
      zoneId: formData.zoneId || (zones.length > 0 ? zones[0].id.toString() : '')
    };
    setFormData(exampleData);
    setErrors({});
    setTimeout(() => {
      firstNameRef.current?.focus();
    }, 100);
  };

  const handlePhoneChange = (text: string) => {
    // Nettoyer et limiter aux chiffres
    const cleaned = text.replace(/\D/g, '');
    const limited = cleaned.slice(0, 10);
    
    // Formater pour l'affichage (034 20 152 72)
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
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Eo am-pamakiana ny faritra...</Text>
            <Text style={styles.loadingSubtext}>Azafady andraso kely</Text>
          </View>
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* En-tête améliorée */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icons.ArrowLeft size={28} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <LinearGradient
                colors={['#fff', '#f8f9fa']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.titleGradient}
              >
                <Text style={styles.headerTitle}>Hisoratra anarana</Text>
              </LinearGradient>
              <Text style={styles.headerSubtitle}>Hanomboka ny kaontinao</Text>
            </View>
            <View style={styles.placeholder} />
          </View>

          {/* Étape de progression */}
          <View style={styles.progressContainer}>
            <View style={styles.progressStep}>
              <View style={[styles.progressDot, styles.progressDotActive]} />
              <Text style={styles.progressTextActive}>Fampidirana</Text>
            </View>
            <View style={styles.progressLine} />
            <View style={styles.progressStep}>
              <View style={[styles.progressDot, styles.progressDotInactive]} />
              <Text style={styles.progressTextInactive}>OTP</Text>
            </View>
          </View>

          {/* Bouton remplissage rapide (dev seulement) */}
          {__DEV__ && (
            <TouchableOpacity onPress={handleQuickFill} style={styles.quickFillDevButton}>
              <Icons.Zap size={14} color="#3498db" />
              <Text style={styles.quickFillDevText}>Remplissage rapide (DEV)</Text>
            </TouchableOpacity>
          )}

          {/* Carte principale */}
          <View style={styles.card}>
            {/* Section Nom et Prénom */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Icons.User size={20} color="#3498db" />
                </View>
                <Text style={styles.sectionTitle}>Momba anao</Text>
              </View>
              
              <View style={styles.nameRow}>
                <View style={styles.nameColumn}>
                  <Text style={styles.label}>
                    <Text style={styles.required}>*</Text> Anarana
                  </Text>
                  <TouchableOpacity 
                    style={[
                      styles.inputContainer,
                      focusedField === 'firstName' && styles.inputContainerFocused,
                      errors.firstName && styles.inputContainerError
                    ]}
                    onPress={() => firstNameRef.current?.focus()}
                    activeOpacity={1}
                  >
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
                      onSubmitEditing={() => focusNextField('lastName')}
                      maxLength={50}
                      contextMenuHidden={true}
                      autoCapitalize="words"
                    />
                  </TouchableOpacity>
                  {errors.firstName ? (
                    <View style={styles.errorContainer}>
                      <Icons.AlertCircle size={14} color="#e74c3c" />
                      <Text style={styles.errorText}>{errors.firstName}</Text>
                    </View>
                  ) : (
                    <Text style={styles.hintText}>Ohatra: Rado, Njaka, Hery</Text>
                  )}
                </View>
                
                <View style={styles.nameColumn}>
                  <Text style={styles.label}>
                    <Text style={styles.required}>*</Text> Fanampiny
                  </Text>
                  <TouchableOpacity 
                    style={[
                      styles.inputContainer,
                      focusedField === 'lastName' && styles.inputContainerFocused,
                      errors.lastName && styles.inputContainerError
                    ]}
                    onPress={() => lastNameRef.current?.focus()}
                    activeOpacity={1}
                  >
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
                      onSubmitEditing={() => focusNextField('phone')}
                      maxLength={50}
                      contextMenuHidden={true}
                      autoCapitalize="words"
                    />
                  </TouchableOpacity>
                  {errors.lastName ? (
                    <View style={styles.errorContainer}>
                      <Icons.AlertCircle size={14} color="#e74c3c" />
                      <Text style={styles.errorText}>{errors.lastName}</Text>
                    </View>
                  ) : (
                    <Text style={styles.hintText}>Ohatra: Andriana, Rakoto, Rasoa</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Section Téléphone */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Icons.Phone size={20} color="#3498db" />
                </View>
                <Text style={styles.sectionTitle}>Laharana finday</Text>
              </View>
              
              <Text style={styles.label}>
                <Text style={styles.required}>*</Text> Laharana finday
              </Text>
              <TouchableOpacity 
                style={[
                  styles.inputContainer,
                  focusedField === 'phoneNumber' && styles.inputContainerFocused,
                  errors.phoneNumber && styles.inputContainerError
                ]}
                onPress={() => phoneRef.current?.focus()}
                activeOpacity={1}
              >
                <View style={styles.countryCodeContainer}>
                  <Text style={styles.countryCode}>🇲🇬 +261</Text>
                </View>
                <TextInput
                  ref={phoneRef}
                  value={formatDisplayPhone(formData.phoneNumber)}
                  onChangeText={handlePhoneChange}
                  onFocus={() => setFocusedField('phoneNumber')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="34 20 15 272"
                  keyboardType="numeric"
                  style={styles.phoneInput}
                  placeholderTextColor="#95a5a6"
                  editable={!loading}
                  returnKeyType="next"
                  onSubmitEditing={() => focusNextField('zone')}
                  maxLength={12} // 10 chiffres + 2 espaces
                  contextMenuHidden={true}
                  selectionColor="#3498db"
                />
              </TouchableOpacity>
              
              {errors.phoneNumber ? (
                <View style={styles.errorContainer}>
                  <Icons.AlertCircle size={14} color="#e74c3c" />
                  <Text style={styles.errorText}>{errors.phoneNumber}</Text>
                </View>
              ) : (
                <View style={styles.hintContainer}>
                  <Icons.Info size={12} color="#7f8c8d" />
                  <Text style={styles.hintText}>
                    Ny OTP dia halefa amin&apos;ity laharana ity. Azo antoka ny fiarovana.
                  </Text>
                </View>
              )}
            </View>

            {/* Section Activité */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Icons.Briefcase size={20} color="#3498db" />
                </View>
                <Text style={styles.sectionTitle}>Karazana asa atao</Text>
              </View>
              
              <Text style={styles.label}>
                <Text style={styles.required}>*</Text> Safidio ny asanao
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

            {/* Section Zone */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Icons.MapPin size={20} color="#3498db" />
                </View>
                <Text style={styles.sectionTitle}>Toerana misy anao</Text>
              </View>
              
              <Text style={styles.label}>
                <Text style={styles.required}>*</Text> Faritra
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
                  enabled={!loading && zones.length > 0}
                  mode="dropdown"
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
              
              {errors.zoneId ? (
                <View style={styles.errorContainer}>
                  <Icons.AlertCircle size={14} color="#e74c3c" />
                  <Text style={styles.errorText}>{errors.zoneId}</Text>
                </View>
              ) : zones.length > 0 && formData.zoneId ? (
                <View style={styles.hintContainer}>
                  <Icons.CheckCircle size={12} color="#27ae60" />
                  <Text style={styles.hintText}>
                    {zones.find(z => z.id.toString() === formData.zoneId)?.name} - {
                      zones.find(z => z.id.toString() === formData.zoneId)?.region
                    }
                  </Text>
                </View>
              ) : (
                <View style={styles.errorContainer}>
                  <Icons.AlertCircle size={14} color="#f39c12" />
                  <Text style={styles.warningText}>Tsy misy faritra mbola voarakitra</Text>
                </View>
              )}
            </View>

            {/* Bouton d'inscription */}
            <TouchableOpacity
              onPress={handleRegister}
              style={[
                styles.registerButton, 
                (loading || zones.length === 0) && styles.buttonDisabled
              ]}
              disabled={loading || zones.length === 0}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#27ae60', '#2ecc71']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.registerButtonGradient}
              >
                {loading ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.registerButtonTextLoading}>
                      EO AM-PANDEFASANA...
                    </Text>
                  </>
                ) : (
                  <>
                    <Icons.CheckCircle size={22} color="#fff" />
                    <Text style={styles.registerButtonText}>
                      HANOMBOKA NY FISORATANA
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Condition d'utilisation */}
            <Text style={styles.termsText}>
              Amin&apos;ny fisoratana anarana dia manaiky ny{" "}
              <Text style={styles.termsLink}>fepetra sy fepetra</Text>{" "}
              amin&apos;ny fampiasana ny serivisy.
            </Text>

            {/* Redirection connexion */}
            <View style={styles.loginRedirect}>
              <Text style={styles.loginText}>Efa manana kaonty?</Text>
              <TouchableOpacity 
                onPress={() => router.push('/(auth)/login')}
                disabled={loading}
                style={styles.loginButton}
              >
                <Text style={styles.loginLink}>Hiditra eto</Text>
                <Icons.ArrowRight size={16} color="#3498db" />
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  titleGradient: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 6,
  },
  headerTitle: {
    color: '#2c3e50',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  placeholder: {
    width: 48,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  progressDotActive: {
    backgroundColor: '#27ae60',
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  progressDotInactive: {
    backgroundColor: '#bdc3c7',
  },
  progressTextActive: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  progressTextInactive: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 10,
    marginBottom: 9,
  },
  quickFillDevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(52, 152, 219, 0.5)',
    gap: 8,
  },
  quickFillDevText: {
    color: '#3498db',
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 15,
    marginBottom: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 152, 219, 0.2)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  nameRow: {
    flexDirection: 'row',
    gap: 16,
  },
  nameColumn: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginLeft: 4,
  },
  required: {
    color: '#e74c3c',
  },
  inputContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#e9ecef',
    minHeight: 56,
  },
  inputContainerFocused: {
    borderColor: '#3498db',
    backgroundColor: '#fff',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  inputContainerError: {
    borderColor: '#e74c3c',
    backgroundColor: '#fff5f5',
  },
  input: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
    padding: 0,
    minHeight: 24,
  },
  countryCodeContainer: {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 152, 219, 0.3)',
  },
  countryCode: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
    padding: 0,
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
  warningText: {
    color: '#f39c12',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 4,
    gap: 6,
  },
  hintText: {
    color: '#7f8c8d',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
    flex: 1,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  activityButton: {
    flex: 1,
    minWidth: (width - 96) / 3,
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    position: 'relative',
  },
  activityButtonSelected: {
    borderWidth: 2,
  },
  emoji: {
    fontSize: 28,
    marginBottom: 12,
  },
  activityLabel: {
    fontSize: 14,
    color: '#6c7a89',
    fontWeight: '600',
    textAlign: 'center',
  },
  activityLabelSelected: {
    fontWeight: '700',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pickerContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    minHeight: 58,
  },
  pickerContainerError: {
    borderColor: '#e74c3c',
    backgroundColor: '#fff5f5',
  },
  picker: {
    height: 58,
    color: '#2c3e50',
    fontSize: 16,
  },
  registerButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 24,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  registerButtonGradient: {
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  registerButtonTextLoading: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  termsText: {
    color: '#7f8c8d',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 24,
  },
  termsLink: {
    color: '#3498db',
    fontWeight: '700',
  },
  loginRedirect: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f2f6',
  },
  loginText: {
    color: '#7f8c8d',
    fontSize: 15,
    marginRight: 8,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
  },
  loginLink: {
    color: '#3498db',
    fontWeight: '700',
    fontSize: 15,
    marginRight: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
  loadingSubtext: {
    color: '#7f8c8d',
    fontSize: 14,
    marginTop: 8,
  },
});