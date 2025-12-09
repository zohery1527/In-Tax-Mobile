
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ColorValue,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';

interface ProfessionalLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  background?: 'default' | 'gradient' | 'custom';
  gradientColors?: readonly [ColorValue, ColorValue, ...ColorValue[]]; // ✅ Correction TypeScript
  scrollable?: boolean;
  contentStyle?: any;
}

const { width } = Dimensions.get('window');

export default function ProfessionalLayout({ 
  children, 
  title, 
  subtitle, 
  showHeader = true,
  background = 'default',
  gradientColors = ['#2c3e50', '#3498db'] as const, // ✅ "as const" pour le type readonly
  scrollable = false,
  contentStyle = {}
}: ProfessionalLayoutProps) {
  
  const renderBackground = () => {
    if (background === 'gradient') {
      return (
        <LinearGradient
          colors={gradientColors}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      );
    }
    return null;
  };

  const renderContent = () => {
    const content = (
      <View style={[
        styles.content,
        background === 'gradient' && styles.transparentContent,
        contentStyle
      ]}>
        {children}
      </View>
    );

    if (scrollable) {
      return (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      );
    }

    return content;
  };

  return (
    <SafeAreaView style={[
      styles.container,
      background === 'gradient' && styles.gradientContainer
    ]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={background === 'gradient' ? 'transparent' : '#2c3e50'} 
        translucent={background === 'gradient'}
      />
      
      {renderBackground()}
      
      {showHeader && (
        <View style={[
          styles.header,
          background === 'gradient' && styles.transparentHeader
        ]}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>IN-TAX</Text>
            <Text style={styles.headerSubtitle}>Fitantanam-bola Malagasy</Text>
          </View>
        </View>
      )}
      
      {title && (
        <View style={[
          styles.pageHeader,
          background === 'gradient' && styles.transparentPageHeader
        ]}>
          <Text style={[
            styles.pageTitle,
            background === 'gradient' && styles.lightPageTitle
          ]}>{title}</Text>
          {subtitle && (
            <Text style={[
              styles.pageSubtitle,
              background === 'gradient' && styles.lightPageSubtitle
            ]}>{subtitle}</Text>
          )}
        </View>
      )}
      
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  gradientContainer: {
    backgroundColor: 'transparent',
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#2c3e50',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  transparentHeader: {
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontStyle: 'italic',
  },
  pageHeader: {
    padding: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transparentPageHeader: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  lightPageTitle: {
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    lineHeight: 22,
  },
  lightPageSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  transparentContent: {
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});