import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icons } from '../components/Icons';
import ProfessionalLayout from '../components/ProfessionalLayout';

export default function ChoixInterfaceScreen() {
  const router = useRouter();

  const interfaceOptions = [
    {
      id: 'simple',
      title: 'Endrika Tsotra',
      subtitle: 'Ho an\'ny mpampiasa vao manomboka',
      description: 'Mety hiditra amin\'ny sary na feo. Sakàny sy mora ampiasaina.',
      iconName: 'User' as keyof typeof Icons,
      color: '#27ae60',
      features: [
        'Hitan-teny ny fampahalalam-baovao',
        'Sary ny taratasy',
        'Bokotra lehibe',
        'Teny malagasy fotsiny'
      ],
      route: '/(tabs)/accueil/simple'
    },
    {
      id: 'complet',
      title: 'Endrika Feno',
      subtitle: 'Ho an\'ny mpampiasa efa zatra',
      description: 'Manome statistikà sy fampahalalam-baovao be kokoa. Fanitarana avo lenta.',
      iconName: 'Chart' as keyof typeof Icons,
      color: '#3498db',
      features: [
        'Statistika deta',
        'Tantarana feno',
        'Kajy avo lenta',
        'Fanovana maro'
      ],
      route: '/(tabs)/accueil'
    }
  ];

  const handleSelectInterface = (route: string) => {
    router.replace(route as any);
  };

  const InterfaceCard = ({ option }: any) => {
    // Obtenir l'icône dynamiquement
    const IconComponent = Icons[option.iconName as keyof typeof Icons];
    
    return (
      <TouchableOpacity 
        style={styles.optionCard}
        onPress={() => handleSelectInterface(option.route)}
      >
        <LinearGradient
          colors={[option.color, `${option.color}DD`]}
          style={styles.optionHeader}
        >
          <View style={styles.optionIcon}>
            {IconComponent ? <IconComponent size={28} color="#fff" /> : null}
          </View>
          <View style={styles.optionTitleSection}>
            <Text style={styles.optionTitle}>{option.title}</Text>
            <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
          </View>
        </LinearGradient>

        <View style={styles.optionContent}>
          <Text style={styles.optionDescription}>{option.description}</Text>
          
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>TOETRA:</Text>
            {option.features.map((feature: string, index: number) => (
              <View key={index} style={styles.featureItem}>
                {Icons.CheckCircle ? <Icons.CheckCircle size={16} color={option.color} /> : null}
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.selectButton, { backgroundColor: option.color }]}
            onPress={() => handleSelectInterface(option.route)}
          >
            <Text style={styles.selectButtonText}>HISAFIDY</Text>
            {Icons.Send ? <Icons.Send size={18} color="#fff" /> : null}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ProfessionalLayout showHeader={false}>
      <LinearGradient colors={['#2c3e50', '#3498db']} style={styles.container}>
        
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.logo}>
            {Icons.Home ? <Icons.Home size={36} color="#fff" /> : null}
          </View>
          <Text style={styles.appTitle}>IN-TAX</Text>
          <Text style={styles.appSubtitle}>Safidio ny endrika tianao</Text>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Tongasoa !</Text>
            <Text style={styles.welcomeText}>
              Misaotra nisafidy ny In-Tax. Mialà aloha ny endrika hitanao.
            </Text>
          </View>

          {/* Options d'interface */}
          <View style={styles.optionsContainer}>
            {interfaceOptions.map((option) => (
              <InterfaceCard key={option.id} option={option} />
            ))}
          </View>

          {/* Informations */}
          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              {Icons.Info ? <Icons.Info size={20} color="#1565c0" /> : null}
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Azonao ovaina foana</Text>
                <Text style={styles.infoText}>
                  Azonao ovaina ny endrika amin&apos;ny fotoana rehetra ao amin&apos;ny pejy kaonty.
                  Andramo ny samy hafa raha tsy azo antoka!
                </Text>
              </View>
            </View>

            <View style={styles.helpCard}>
              {Icons.Phone ? <Icons.Phone size={20} color="#856404" /> : null}
              <View style={styles.helpContent}>
                <Text style={styles.helpTitle}>Mampiahiahy?</Text>
                <Text style={styles.helpText}>
                  Antsoy ny fanampiana: 034 20 152 72 na safidio ny endrika tsotra raha vao manomboka.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </ProfessionalLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  welcomeSection: {
    padding: 25,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 15,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsContainer: {
    padding: 20,
    gap: 20,
  },
  optionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTitleSection: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  optionContent: {
    padding: 20,
  },
  optionDescription: {
    fontSize: 15,
    color: '#2c3e50',
    marginBottom: 20,
    lineHeight: 22,
  },
  featuresSection: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#2c3e50',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  selectButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    marginRight: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1565c0',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#1565c0',
    lineHeight: 16,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  helpContent: {
    flex: 1,
    marginLeft: 12,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 16,
  },
  infoSection:{

  },
});