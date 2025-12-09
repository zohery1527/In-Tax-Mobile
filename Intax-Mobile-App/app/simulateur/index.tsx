import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ProfessionalLayout from '../../components/ProfessionalLayout';

export default function SimulateurScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [activityType, setActivityType] = useState('COMMERCE');
  const [calculatedTax, setCalculatedTax] = useState(0);
  const [loading, setLoading] = useState(false);

  const calculateTax = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Fangatahana', 'Ampidiro ny vola marina azafady.');
      return;
    }

    setLoading(true);
    
    // Simulation de calcul avec délai
    setTimeout(() => {
      let taxRate = 0.02; // 2% par défaut
      
      // Ajustement du taux selon l'activité
      switch (activityType) {
        case 'ALIMENTATION':
          taxRate = 0.015; // 1.5%
          break;
        case 'ARTISANAT':
          taxRate = 0.01; // 1%
          break;
        case 'SERVICE':
          taxRate = 0.025; // 2.5%
          break;
        default:
          taxRate = 0.02; // 2%
      }

      const tax = Math.round(numAmount * taxRate);
      setCalculatedTax(tax);
      setLoading(false);
    }, 1000);
  };

  const resetCalculator = () => {
    setAmount('');
    setCalculatedTax(0);
    setActivityType('COMMERCE');
  };

  const handleDeclare = () => {
    if (calculatedTax > 0) {
      router.push({
        pathname: '/(tabs)/declarer',
        params: { 
          simulatedAmount: amount,
          simulatedTax: calculatedTax.toString(),
          simulatedActivity: activityType
        }
      });
    }
  };

  const ActivityButton = ({ value, label, icon, description, rate }: any) => (
    <TouchableOpacity
      style={[
        styles.activityButton,
        activityType === value && styles.activityButtonSelected
      ]}
      onPress={() => setActivityType(value)}
    >
      <View style={[
        styles.activityButtonContent,
        activityType === value && styles.activityButtonContentSelected
      ]}>
        <Text style={[
          styles.activityIcon,
          activityType === value && styles.activityIconSelected
        ]}>
          {icon}
        </Text>
        <Text style={[
          styles.activityLabel,
          activityType === value && styles.activityLabelSelected
        ]}>
          {label}
        </Text>
        <Text style={[
          styles.activityDescription,
          activityType === value && styles.activityDescriptionSelected
        ]}>
          {description}
        </Text>
        <View style={[
          styles.rateBadge,
          activityType === value && styles.rateBadgeSelected
        ]}>
          <Text style={[
            styles.rateText,
            activityType === value && styles.rateTextSelected
          ]}>
            {rate}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getTaxRate = () => {
    switch (activityType) {
      case 'ALIMENTATION': return '1.5%';
      case 'ARTISANAT': return '1%';
      case 'SERVICE': return '2.5%';
      default: return '2%';
    }
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return isNaN(num) ? '0' : num.toLocaleString('mg-MG');
  };

  return (
    <ProfessionalLayout title="Kajy Hetezana">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* En-tête simulateur avec design amélioré */}
        <LinearGradient 
          colors={['#667eea', '#764ba2']} 
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerCard}
        >
          <View style={styles.headerIconContainer}>
            <Text style={styles.headerIcon}>🧮</Text>
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Kajy ny hetezana</Text>
            <Text style={styles.headerSubtitle}>
              Alohan&apos;ny hanatanterahana famaranana - Mba hahita ny vola hetezana tokony handoavana
            </Text>
          </View>
        </LinearGradient>

        {/* Carte statistique rapide */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>4</Text>
            <Text style={styles.statLabel}>Karazana asa</Text>
          </View>
          <View style={styles.statSeparator} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>1-2.5%</Text>
            <Text style={styles.statLabel}>Tahan&apos;ny hetezana</Text>
          </View>
          <View style={styles.statSeparator} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>⚡</Text>
            <Text style={styles.statLabel}>Kajy haingana</Text>
          </View>
        </View>

        {/* Formulaire de simulation */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Text style={styles.sectionIcon}>📊</Text>
            </View>
            <Text style={styles.sectionTitle}>FAMPAHALALANA ILAINA</Text>
          </View>
          
          {/* Input montant avec design amélioré */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Vola nidina tamin&apos;ny volana 
              <Text style={styles.requiredStar}> *</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Text style={styles.currencySymbol}>Ar</Text>
              <TextInput
                placeholder="Ohatra: 500 000"
                value={amount}
                onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                style={styles.input}
                placeholderTextColor="#95a5a6"
              />
              {amount ? (
                <Text style={styles.amountPreview}>
                  {formatAmount(amount)} Ar
                </Text>
              ) : null}
            </View>
          </View>

          {/* Sélection activité avec design amélioré */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Karazana asa atao
              <Text style={styles.requiredStar}> *</Text>
            </Text>
            <View style={styles.activityGrid}>
              <ActivityButton 
                value="COMMERCE" 
                label="Varotra" 
                icon="🛒"
                description="Fivarotana entana"
                rate="2%"
              />
              <ActivityButton 
                value="ALIMENTATION" 
                label="Sakafo" 
                icon="🍲"
                description="Restaurant, hotely"
                rate="1.5%"
              />
              <ActivityButton 
                value="ARTISANAT" 
                label="Asa tanana" 
                icon="🛠️"
                description="Asa artisanat"
                rate="1%"
              />
              <ActivityButton 
                value="SERVICE" 
                label="Tohotra" 
                icon="💼"
                description="Service professionnel"
                rate="2.5%"
              />
            </View>
          </View>

          {/* Boutons d'action */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.calculateButton, (loading || !amount) && styles.buttonDisabled]}
              onPress={calculateTax}
              disabled={loading || !amount}
            >
              <LinearGradient 
                colors={['#667eea', '#764ba2']} 
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.calculateButtonGradient}
              >
                <Text style={styles.calculateIcon}>
                  {loading ? '⏳' : '🧮'}
                </Text>
                <Text style={styles.calculateButtonText}>
                  {loading ? 'EO AM-PIKAJIANA...' : 'KAJIO NY HETEZANA'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {amount || calculatedTax > 0 ? (
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={resetCalculator}
              >
                <View style={styles.resetButtonContent}>
                  <Text style={styles.resetIcon}>🔄</Text>
                  <Text style={styles.resetButtonText}>HAMAFANA</Text>
                </View>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Résultats avec design amélioré */}
        {calculatedTax > 0 && (
          <View style={styles.resultsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Text style={styles.sectionIcon}>📈</Text>
              </View>
              <Text style={styles.sectionTitle}>VOKATRA NATAO KAJY</Text>
            </View>
            
            <LinearGradient 
              colors={['#11998e', '#38ef7d']} 
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.resultCard}
            >
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>VOKATRY NY KAJY</Text>
                <View style={styles.resultBadge}>
                  <Text style={styles.resultBadgeText}>{getTaxRate()}</Text>
                </View>
              </View>
              
              <View style={styles.resultRow}>
                <View style={styles.resultItem}>
                  <Text style={styles.resultItemLabel}>Vola nidina:</Text>
                  <Text style={styles.resultItemValue}>{formatAmount(amount)} Ar</Text>
                </View>
                <View style={styles.resultItem}>
                  <Text style={styles.resultItemLabel}>Tahan&apos;ny hetezana:</Text>
                  <Text style={styles.resultItemValue}>{getTaxRate()}</Text>
                </View>
              </View>

              <View style={styles.resultDivider} />

              <View style={styles.finalResult}>
                <Text style={styles.finalLabel}>Hetezana totaly:</Text>
                <Text style={styles.finalValue}>{calculatedTax.toLocaleString('mg-MG')} Ar</Text>
              </View>

              <View style={styles.resultNote}>
                <Text style={styles.resultNoteText}>
                  💡 Io no vola hetezana tokony handoavana amin&apos;ny governemanta
                </Text>
              </View>
            </LinearGradient>

            <TouchableOpacity 
              style={styles.declareButton}
              onPress={handleDeclare}
            >
              <LinearGradient 
                colors={['#667eea', '#764ba2']} 
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.declareButtonGradient}
              >
                <Text style={styles.declareIcon}>📝</Text>
                <Text style={styles.declareButtonText}>HANÀTO FAMARANANA</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Section informations */}
        <View style={styles.infoSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Text style={styles.sectionIcon}>💡</Text>
            </View>
            <Text style={styles.sectionTitle}>FANAZAVANA SY TOROHEVITRA</Text>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>📊</Text>
              <Text style={styles.infoCardText}>
                Ny tahan&apos;ny hetezana dia miovaova arakaraka ny karazana asa atao sy ny vola nidina
              </Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>⚡</Text>
              <Text style={styles.infoCardText}>
                Ity kajy ity dia fanoharana haingana. Ny vola tena izy dia ho kajin&apos;ny sistemà ofisialy
              </Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>🎯</Text>
              <Text style={styles.infoCardText}>
                Ampiasao ity kajy ity mba hahafantarana eo ho eo ny vola hetezana tokony handoavana
              </Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>📱</Text>
              <Text style={styles.infoCardText}>
                Azonao atao ny manohy ny famaranana avy hatrany aorian&apos;ny kajy
              </Text>
            </View>
          </View>
        </View>

        {/* Navigation rapide */}
        <View style={styles.quickNav}>
          <Text style={styles.quickNavTitle}>Fampidirana hafa</Text>
          <View style={styles.quickNavGrid}>
            <TouchableOpacity 
              style={styles.quickNavItem}
              onPress={() => router.push('/(tabs)/accueil')}
            >
              <Text style={styles.quickNavIcon}>🏠</Text>
              <Text style={styles.quickNavText}>Fandraisana</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickNavItem}
              onPress={() => router.push('/historique')}
            >
              <Text style={styles.quickNavIcon}>📚</Text>
              <Text style={styles.quickNavText}>Tantara</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickNavItem}
              onPress={() => router.push('/(tabs)/declarer')}
            >
              <Text style={styles.quickNavIcon}>📝</Text>
              <Text style={styles.quickNavText}>Famaranana</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ProfessionalLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  // En-tête amélioré
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    margin: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  headerIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerIcon: {
    fontSize: 32,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  // Carte statistique
  statsCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  statSeparator: {
    width: 1,
    backgroundColor: '#ecf0f1',
    marginHorizontal: 10,
  },
  // Section formulaire
  formSection: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#667eea',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputGroup: {
    marginBottom: 28,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  requiredStar: {
    color: '#e74c3c',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 14,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 17,
    color: '#2c3e50',
    fontWeight: '500',
  },
  amountPreview: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '600',
    marginLeft: 8,
  },
  // Grille d'activités améliorée
  activityGrid: {
    gap: 12,
  },
  activityButton: {
    borderRadius: 14,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  activityButtonSelected: {
    borderColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  activityButtonContent: {
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  activityButtonContentSelected: {
    backgroundColor: '#f0f4ff',
  },
  activityIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  activityIconSelected: {
    transform: [{ scale: 1.1 }],
  },
  activityLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
    textAlign: 'center',
  },
  activityLabelSelected: {
    color: '#667eea',
  },
  activityDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 8,
  },
  activityDescriptionSelected: {
    color: '#667eea',
  },
  rateBadge: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  rateBadgeSelected: {
    backgroundColor: '#667eea',
  },
  rateText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#7f8c8d',
  },
  rateTextSelected: {
    color: 'white',
  },
  // Boutons d'action
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  calculateButton: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  calculateButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  calculateIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  calculateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resetButton: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#95a5a6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  resetIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Section résultats
  resultsSection: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  resultCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  resultBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  resultBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  resultItem: {
    flex: 1,
  },
  resultItemLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  resultItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  resultDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 16,
  },
  finalResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  finalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  finalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  resultNote: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 8,
  },
  resultNoteText: {
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
  },
  declareButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  declareButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  declareIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  declareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Section informations
  infoSection: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  infoGrid: {
    gap: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  infoCardText: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
    fontWeight: '500',
  },
  // Navigation rapide
  quickNav: {
    backgroundColor: 'white',
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickNavTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  quickNavGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickNavItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quickNavIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickNavText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
});