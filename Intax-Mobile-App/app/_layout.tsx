import { Stack, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import ErrorBoundary from '../components/ErrorBoundary';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { NotificationsProvider } from '../hooks/useNotifications'; // ✅ IMPORT IMPORTANT

// ------------------------------------------------------------
// 🟦 Composant de chargement global
// ------------------------------------------------------------
function LoadingScreen() {
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#2c3e50'
    }}>
      <ActivityIndicator size="large" color="#3498db" />
      <Text style={{ color: 'white', marginTop: 10, fontSize: 16 }}>
        Eo am-pamakiana...
      </Text>
    </View>
  );
}

// ------------------------------------------------------------
// 🟧 Navigation protégée
// ------------------------------------------------------------
function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    console.log(`🔐 Auth: loading=${isLoading}, auth=${isAuthenticated}, segment=${segments[0]}`);

    if (!isAuthenticated && !inAuthGroup) {
      console.log('➡️ Redirect → login');
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      console.log('➡️ Redirect → choix-interface');
      router.replace('/choix-interface');
    }
  }, [isLoading, isAuthenticated, segments]);

  if (isLoading) return <LoadingScreen />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#f5f5f5' }
      }}
    >
      {/* Groupes */}
      <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />

      {/* Pages */}
      <Stack.Screen
        name="choix-interface"
        options={{
          title: 'Safidy Endrika',
          headerShown: true,
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#2c3e50' },
          headerTintColor: 'white'
        }}
      />

      <Stack.Screen
        name="payment"
        options={{
          title: 'Handoa Vola',
          headerShown: true,
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#2c3e50' },
          headerTintColor: 'white'
        }}
      />

      <Stack.Screen
        name="simulateur"
        options={{
          title: 'Simulateur',
          headerShown: true,
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#2c3e50' },
          headerTintColor: 'white'
        }}
      />

      <Stack.Screen
        name="recompenses"
        options={{
          title: 'Valisoa',
          headerShown: true,
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#2c3e50' },
          headerTintColor: 'white'
        }}
      />

      <Stack.Screen
        name="historique"
        options={{
          title: 'Tantara',
          headerShown: true,
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#2c3e50' },
          headerTintColor: 'white'
        }}
      />

      <Stack.Screen
        name="Assistant"
        options={{
          title: 'Assistante',
          headerShown: true,
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#2c3e50' },
          headerTintColor: 'white'
        }}
      />

      <Stack.Screen
        name="notifications"
        options={{
          title: 'Fampahatsiahivana',
          headerShown: true,
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#2c3e50' },
          headerTintColor: 'white'
        }}
      />

      <Stack.Screen
        name="verify-register"
        options={{
          title: 'Hamarinina',
          headerShown: true,
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#2c3e50' },
          headerTintColor: 'white'
        }}
      />

      <Stack.Screen
        name="verify-login"
        options={{
          title: 'Hamarinina',
          headerShown: true,
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#2c3e50' },
          headerTintColor: 'white'
        }}
      />
    </Stack>
  );
}

// ------------------------------------------------------------
// 🟩 Contenu root qui peut utiliser useAuth()
// ------------------------------------------------------------
function RootLayoutContent() {
  const { isLoading } = useAuth();

  useEffect(() => {
    const checkPreviousCrashes = async () => {
      try {
        const lastCrash = await SecureStore.getItemAsync('last_crash');
        if (lastCrash) {
          console.log('📋 Crash précédent :', JSON.parse(lastCrash));
          await SecureStore.deleteItemAsync('last_crash');
        }
      } catch (error) {}
    };

    checkPreviousCrashes();
  }, []);

  if (isLoading) return <LoadingScreen />;

  return <RootNavigator />;
}

// ------------------------------------------------------------
// 🟥 RootLayout — pas de useAuth ici
// ------------------------------------------------------------
export default function RootLayout() {
  useEffect(() => {
    const setupCrashHandling = () => {
      console.log('🛡️ Setup crash handler...');
      if (typeof ErrorUtils !== 'undefined') {
        const originalHandler = ErrorUtils.getGlobalHandler();

        ErrorUtils.setGlobalHandler((error, isFatal) => {
          console.log('💥 Crash:', error.message);

          SecureStore.setItemAsync(
            'last_crash',
            JSON.stringify({
              message: error.message,
              time: new Date().toISOString()
            })
          );

          if (originalHandler) originalHandler(error, isFatal);
        });
      }
    };
    setupCrashHandling();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          {/* ✅ ICI ON AJOUTE LE NOTIFICATIONS PROVIDER */}
          <NotificationsProvider>

            <RootLayoutContent />

          </NotificationsProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
