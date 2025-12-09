 import { useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import DatePicker from '../../../components/DatePicker';
import { Icons } from '../../../components/Icons';
import ProfessionalLayout from '../../../components/ProfessionalLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { apiService } from '../../../services/api';

const { width } = Dimensions.get('window');

// Interface pour les données du formulaire
interface DeclarationFormData {
  amount: string;
  period: string;
  activityType: string;
  description: string;
}

// Types d'activités avec labels en malgache
const ACTIVITY_TYPES = [
  { value: 'COMMERCE', label: 'Varotra', emoji: '🛒', color: '#3498db' },
  { value: 'ALIMENTATION', label: 'Sakafo', emoji: '🍲', color: '#e74c3c' },
  { value: 'ARTISANAT', label: 'Asa tanana', emoji: '🛠️', color: '#f39c12' },
  { value: 'SERVICES', label: 'Tohotra', emoji: '💼', color: '#9b59b6' },
  { value: 'AUTRE', label: 'Hafa', emoji: '📦', color: '#95a5a6' }
];

export default function DeclarerScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState<DeclarationFormData>({
    amount: '',
    period: '',
    activityType: user?.activityType || 'COMMERCE',
    description: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [pressedButtons, setPressedButtons] = useState<{[key: string]: boolean}>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  
  // ======================
  // ✅ SOLUTION SIMPLE : SUPPRIMER LE DÉFILEMENT AUTOMATIQUE
  // ======================
  // On utilise simplement KeyboardAvoidingView qui est suffisant
  
  // ======================
  // ✅ CALCUL DE LA TAXE
  // ======================
  const calculateTax = (amount: string): string => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return '0.00';
    
    const tax = numAmount * 0.02;
    return tax.toFixed(2);
  };

  const currentTax = calculateTax(formData.amount);

  // ======================
  // ✅ GESTION DES DATES
  // ======================
  const handleDateSelect = (period: string) => {
    setFormData(prev => ({ ...prev, period }));
  };

  // ======================
  // ✅ ANIMATIONS
  // ======================
  const handlePressIn = (buttonName: string) => {
    setPressedButtons(prev => ({...prev, [buttonName]: true}));
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
    }).start();
  };

  const handlePressOut = (buttonName: string) => {
    setPressedButtons(prev => ({...prev, [buttonName]: false}));
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
    }).start();
  };

  // ======================
  // ✅ VALIDATION DU FORMULAIRE
  // ======================
  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!formData.amount.trim()) {
      errors.push('Ampidiro ny vola nidina');
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.push('Mila vola marina sy mihoatra ny 0');
      }
      if (amount > 999999999.99) {
        errors.push('Mila vola latsaky ny 999,999,999.99 Ar');
      }
    }
    
    if (!formData.period.trim()) {
      errors.push('Safidio ny volana sy taona');
    } else if (!/^\d{4}-\d{2}$/.test(formData.period)) {
      errors.push('Format volana tsara: YYYY-MM (ohatra: 2024-01)');
    }
    
    if (!formData.activityType) {
      errors.push('Safidio ny karazana asa');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // ======================
  // ✅ SOUMISSION DU FORMULAIRE
  // ======================
  const handleSubmit = async () => {
    // Vérification du NIF
    if (user?.nifStatus !== 'VALIDATED') {
      Alert.alert(
        'Tsy azo atao',
        'Mila voamarina aloha ny NIF anao alohan\'ny hanatanterahana famaranana.\n\nMandehana any amin\'ny pejy momba ny NIF.',
        [
          { text: 'Tsy', style: 'cancel' },
          { text: 'Hijery ny NIF', onPress: () => router.push('/(tabs)/profil') }
        ]
      );
      return;
    }

    // Validation du formulaire
    const validation = validateForm();
    if (!validation.isValid) {
      Alert.alert(
        'Tsy mety',
        validation.errors.join('\n• '),
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    setLoading(true);
    try {
      const declarationData = {
        amount: parseFloat(formData.amount),
        period: formData.period,
        activityType: formData.activityType,
        description: formData.description.trim() || undefined
      };

      console.log('📤 Envoi déclaration:', declarationData);
      const result = await apiService.createDeclaration(declarationData);
      console.log(result);
      Alert.alert(
        'Fahombiazana! 🎉',
        'Nalevana soamantsara ny famarananao!\n\nEfa afaka mijery ny toetrany any amin\'ny pejy tantara ianao.',
        [
          { text: 'Hijery ny tantara', onPress: () => router.push('/historique') },
          { text: 'Hanàto indray', style: 'cancel' }
        ]
      );
      
      // Réinitialiser le formulaire
      setFormData({ 
        amount: '', 
        period: '', 
        activityType: user?.activityType || 'COMMERCE', 
        description: '' 
      });
      
    } catch (error: any) {
      console.error('❌ Erreur déclaration:', error);
      
      let errorMessage = 'Nisy olana ny fanaovana famaranana. Andramo indray.';
      
      if (error.message?.includes('déclaration existe déjà')) {
        errorMessage = 'Efa nanao famaranana ianao tamin\'io volana io. Jereo ny tantara.';
      } else if (error.message?.includes('format de période')) {
        errorMessage = 'Format volana tsara: YYYY-MM (ohatra: 2024-01)';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Hadisoana', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // ✅ OPTIONS RAPIDES
  // ======================
  const quickOptions = [
    {
      id: 'photo',
      label: 'Sary',
      icon: <Icons.Scan size={24} color="#fff" />,
      route: '/(tabs)/declarer/photo',
      color: '#667eea',
      gradient: ['#667eea', '#764ba2']
    },
    {
      id: 'vocale',
      label: 'Hitan-teny',
      icon: <Icons.Mic size={24} color="#fff" />,
      route: '/(tabs)/declarer/vocale',
      color: '#9b59b6',
      gradient: ['#9b59b6', '#8e44ad']
    },
    {
      id: 'calculator',
      label: 'Kajy',
      icon: <Icons.Calculator size={24} color="#fff" />,
      route: '/simulateur',
      color: '#e74c3c',
      gradient: ['#e74c3c', '#c0392b']
    }
  ];

  // ======================
  // ✅ BOUTONS D'ACTIVITÉ
  // ======================
  const ActivityButton = ({ 
    type, 
    label, 
    emoji,
    color 
  }: { 
    type: string; 
    label: string; 
    emoji: string;
    color: string;
  }) => {
    const selected = formData.activityType === type;
    
    return (
      <TouchableOpacity
        onPress={() => setFormData(prev => ({ ...prev, activityType: type }))}
        style={[
          styles.activityButton,
          selected && styles.activityButtonSelected,
          selected && { borderColor: color, backgroundColor: `${color}15` }
        ]}
        activeOpacity={0.7}
        disabled={user?.nifStatus !== 'VALIDATED'}
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

  // ======================
  // ✅ SOLUTION SIMPLE POUR LE CHAMP MONTANT
  // ======================
  const handleAmountChange = (text: string) => {
    // Solution simple : garder juste les chiffres, pas de formatage
    const cleaned = text.replace(/[^0-9]/g, '');
    setFormData(prev => ({...prev, amount: cleaned}));
  };

  // ======================
  // ✅ FORMATAGE SIMPLE POUR L'AFFICHAGE
  // ======================
  const getDisplayAmount = () => {
    if (!formData.amount) return '';
    
    const num = parseFloat(formData.amount);
    if (isNaN(num)) return '';
    
    // Formater avec séparateurs de milliers
    return num.toLocaleString('fr-FR');
  };

  // ======================
  // ✅ RENDU SIMPLIFIÉ
  // ======================
  return (
    <ProfessionalLayout 
      title="Hanàto Famaranana"
      scrollable={false}
    >
      <KeyboardAvoidingView 
        style={styles.flexContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.responsiveContainer}>
            {/* Avertissement NIF */}
            {user?.nifStatus !== 'VALIDATED' && (
              <View style={styles.warningCard}>
                <View style={styles.warningIcon}>
                  <Icons.Warning size={28} color="#f39c12" />
                </View>
                <View style={styles.warningContent}>
                  <Text style={styles.warningTitle}>⚠️ Mila fanamarinana</Text>
                  <Text style={styles.warningText}>
                    Mbola miandry ny fanamarinana ny NIF anao. Tsy afaka manao famaranana ianao mandra-paharoa.
                  </Text>
                  <TouchableOpacity 
                    style={styles.contactButton}
                    onPress={() => router.push('/(tabs)/profil')}
                    onPressIn={() => handlePressIn('profile')}
                    onPressOut={() => handlePressOut('profile')}
                  >
                    <Icons.ArrowRight size={16} color="#fff" />
                    <Text style={styles.contactButtonText}>Hijery ny toetry ny NIF</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Header avec infos utilisateur */}
            <View style={styles.userInfoCard}>
              <View style={styles.userAvatar}>
                <Icons.User size={24} color="#3498db" />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
                <View style={styles.userBadge}>
                  <Icons.Badge size={14} color="#27ae60" />
                  <Text style={styles.userBadgeText}>
                    {user?.nifStatus === 'VALIDATED' ? 'NIF voamarina' : 'NIF miandry'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.statsButton}>
                <Icons.BarChart size={20} color="#3498db" />
              </TouchableOpacity>
            </View>

            {/* Options de déclaration rapide */}
            <View style={styles.quickOptions}>
              <Text style={styles.sectionTitle}>📱 FOMBA HAINGANA</Text>
              <View style={styles.quickButtons}>
                {quickOptions.map((option) => (
                  <TouchableOpacity 
                    key={option.id}
                    style={[
                      styles.quickButtonEnhanced,
                      pressedButtons[option.id] && styles.quickButtonPressed,
                    ]}
                    onPress={() => router.push(option.route as any)}
                    onPressIn={() => handlePressIn(option.id)}
                    onPressOut={() => handlePressOut(option.id)}
                  >
                    <View style={styles.quickButtonGradient}>
                      {option.icon}
                    </View>
                    <Text style={styles.quickButtonText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Formulaire principal */}
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Icons.Edit size={24} color="#3498db" />
                <Text style={styles.formTitle}>Soratana famaranana</Text>
              </View>

              {/* Vola nidina - SOLUTION SIMPLE */}
              <View style={styles.inputSection}>
                <View style={styles.inputLabelRow}>
                  <Icons.Money size={18} color="#2c3e50" />
                  <Text style={styles.label}>Vola nidina tamin&apos;ny volana (Ar)*</Text>
                </View>
                <View style={[
                  styles.inputContainer,
                  focusedField === 'amount' && styles.inputContainerFocused,
                ]}>
                  <TextInput
                    placeholder="Ohatra: 500000"
                    value={getDisplayAmount()} // Affichage formaté
                    onChangeText={handleAmountChange} // Saisie simple
                    onFocus={() => setFocusedField('amount')}
                    onBlur={() => setFocusedField(null)}
                    keyboardType="numeric"
                    style={styles.input}
                    placeholderTextColor="#95a5a6"
                  />
                  <Text style={styles.currencySymbol}>Ar</Text>
                </View>
              </View>

              {/* Date */}
              <View style={styles.inputSection}>
                <View style={styles.inputLabelRow}>
                  <Icons.Calendar size={18} color="#2c3e50" />
                  <Text style={styles.label}>Volana sy taona*</Text>
                </View>
                <DatePicker 
                  onDateSelect={handleDateSelect}
                  selectedDate={formData.period}
                />
              </View>

              {/* Type d'activité */}
              <View style={styles.inputSection}>
                <View style={styles.inputLabelRow}>
                  <Icons.Briefcase size={18} color="#2c3e50" />
                  <Text style={styles.label}>Karazana asa atao*</Text>
                </View>
                <View style={styles.activityGrid}>
                  {ACTIVITY_TYPES.map((activity) => (
                    <ActivityButton
                      key={activity.value}
                      type={activity.value}
                      label={activity.label}
                      emoji={activity.emoji}
                      color={activity.color}
                    />
                  ))}
                </View>
              </View>

              {/* Description - SIMPLE */}
              <View style={styles.inputSection}>
                <View style={styles.inputLabelRow}>
                  <Icons.FileText size={18} color="#2c3e50" />
                  <Text style={styles.label}>Famariparitana (tsy voatery)</Text>
                </View>
                <View style={[
                  styles.textAreaContainer,
                  focusedField === 'description' && styles.inputContainerFocused,
                ]}>
                  <TextInput
                    placeholder="Famariparitana ny varotra na ny tolotra natao..."
                    value={formData.description}
                    onChangeText={(text) => setFormData(prev => ({...prev, description: text}))}
                    onFocus={() => setFocusedField('description')}
                    onBlur={() => setFocusedField(null)}
                    multiline
                    style={styles.textArea}
                    placeholderTextColor="#95a5a6"
                    textAlignVertical="top"
                    numberOfLines={4}
                  />
                </View>
                <Text style={styles.charCount}>
                  {formData.description.length}/500 caractères
                </Text>
              </View>

              {/* Calcul de taxe */}
              {formData.amount && parseFloat(formData.amount) > 0 && (
                <View style={styles.taxCard}>
                  <View style={styles.taxHeader}>
                    <Icons.Calculator size={20} color="#27ae60" />
                    <Text style={styles.taxTitle}>Kajiny hetra</Text>
                  </View>
                  <View style={styles.taxGrid}>
                    <View style={styles.taxItem}>
                      <Text style={styles.taxLabel}>Vola nidina:</Text>
                      <Text style={styles.taxValue}>
                        {parseFloat(formData.amount || '0').toLocaleString('fr-FR')} Ar
                      </Text>
                    </View>
                    <View style={styles.taxDivider} />
                    <View style={styles.taxItem}>
                      <Text style={styles.taxLabel}>Hetra (2%):</Text>
                      <Text style={styles.taxValue}>
                        {parseFloat(currentTax).toLocaleString('fr-FR')} Ar
                      </Text>
                    </View>
                    <View style={styles.taxDivider} />
                    <View style={styles.taxItem}>
                      <Text style={styles.taxTotalLabel}>Total:</Text>
                      <Text style={styles.taxTotalValue}>
                        {(parseFloat(formData.amount || '0') + parseFloat(currentTax)).toLocaleString('fr-FR')} Ar
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Bouton de soumission */}
            <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 20 }}>
              <TouchableOpacity 
                style={[
                  styles.submitButton,
                  (loading || user?.nifStatus !== 'VALIDATED') && styles.submitButtonDisabled,
                  pressedButtons.submit && styles.buttonPressed
                ]}
                onPress={handleSubmit}
                onPressIn={() => handlePressIn('submit')}
                onPressOut={() => handlePressOut('submit')}
                disabled={loading || user?.nifStatus !== 'VALIDATED'}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Icons.Send size={20} color="white" />
                    <Text style={styles.submitButtonText}>ALEFA NY FAMARANANA</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Navigation secondaire */}
            <View style={styles.navigationSection}>
              <TouchableOpacity 
                style={[
                  styles.navButton,
                  pressedButtons.history && styles.buttonPressed
                ]}
                onPress={() => router.push('/historique')}
                onPressIn={() => handlePressIn('history')}
                onPressOut={() => handlePressOut('history')}
                activeOpacity={0.8}
              >
                <Icons.History size={20} color="white" />
                <Text style={styles.navButtonText}>Hijery ny tantara</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.navButton,
                  styles.paymentButton,
                  pressedButtons.payment && styles.buttonPressed
                ]}
                onPress={() => router.push('/payments/realistic')}
                onPressIn={() => handlePressIn('payment')}
                onPressOut={() => handlePressOut('payment')}
                activeOpacity={0.8}
              >
                <Icons.CreditCard size={20} color="white" />
                <Text style={styles.navButtonText}>Handoa vola</Text>
              </TouchableOpacity>
            </View>

            {/* Information */}
            <View style={styles.infoCard}>
              <Icons.Info size={20} color="#3498db" />
              <Text style={styles.infoText}>
                Ny famaranana dia tsy maintsy atao isam-bolana. Ataovy 25 hatramin&apos;ny 5 ny manontolo.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ProfessionalLayout>
  );
}

// ======================
// ✅ STYLES SIMPLIFIÉS
// ======================
const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  responsiveContainer: {
    flex: 1,
    padding: width < 400 ? 16 : 20,
    paddingBottom: 40,
  },
  userInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3498db',
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  userBadgeText: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '600',
    marginLeft: 5,
  },
  statsButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbf0',
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#f39c12',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  warningIcon: {
    marginTop: 2,
  },
  warningContent: {
    flex: 1,
    marginLeft: 14,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#856404',
    marginBottom: 6,
  },
  warningText: {
    color: '#856404',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f39c12',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  quickOptions: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 15,
    letterSpacing: 0.3,
  },
  quickButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  quickButtonEnhanced: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    minHeight: 100,
    justifyContent: 'center',
  },
  quickButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#3498db',
  },
  quickButtonPressed: {
    backgroundColor: '#f8f9fa',
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.05,
    borderColor: '#3498db',
  },
  quickButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 22,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginLeft: 12,
  },
  inputSection: {
    marginBottom: 22,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    minHeight: 56,
  },
  inputContainerFocused: {
    borderColor: '#3498db',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498db',
    marginLeft: 8,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  activityButton: {
    flex: 1,
    minWidth: (width - 84) / 3,
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    position: 'relative',
  },
  activityButtonSelected: {
    borderWidth: 2,
  },
  emoji: {
    fontSize: 24,
    marginBottom: 10,
  },
  activityLabel: {
    fontSize: 12,
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
  textAreaContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e9ecef',
    minHeight: 100,
  },
  textArea: {
    fontSize: 14,
    color: '#2c3e50',
    padding: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'right',
    marginTop: 4,
  },
  taxCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#e8f5e8',
  },
  taxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  taxTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginLeft: 10,
  },
  taxGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taxItem: {
    alignItems: 'center',
    flex: 1,
  },
  taxDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e9ecef',
  },
  taxLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 6,
  },
  taxValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
  },
  taxTotalLabel: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '700',
    marginBottom: 6,
  },
  taxTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#27ae60',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27ae60',
    padding: 20,
    borderRadius: 14,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    minHeight: 58,
  },
  submitButtonDisabled: {
    backgroundColor: '#bdc3c7',
    shadowOpacity: 0.1,
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    shadowOpacity: 0.1,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  navigationSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 25,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    minHeight: 52,
  },
  paymentButton: {
    backgroundColor: '#9b59b6',
  },
  navButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1565c0',
    marginLeft: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});