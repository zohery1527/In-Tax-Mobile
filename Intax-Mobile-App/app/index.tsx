// app/index.tsx - VERSION CORRIGÉE
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Petit délai pour une meilleure UX
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        console.log('✅ Utilisateur authentifié, redirection vers choix-interface');
        router.replace('/choix-interface');
      } else {
        console.log('🔒 Utilisateur non authentifié, redirection vers login');
        router.replace('/(auth)/login');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3498db" />
      <Text style={styles.title}>In-Tax</Text>
      <Text style={styles.subtitle}>Fitantanam-bola Malagasy</Text>
      {isLoading && (
        <Text style={styles.loadingText}>Eo am-pamakiana ny kaontinao...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3498db',
    marginTop: 20,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#ecf0f1',
    marginBottom: 30,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#bdc3c7',
    marginTop: 20,
    fontStyle: 'italic',
  },
});