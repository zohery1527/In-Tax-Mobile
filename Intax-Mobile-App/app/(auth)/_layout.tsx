import { Stack } from 'expo-router';

export default function AuthLayout() {
  // SUPPRIMER la redirection automatique ici
  // La gestion de l'auth se fait dans RootNavigator

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify-register" />
      <Stack.Screen name="verify-login" />
    </Stack>
  );
}