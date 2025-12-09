import { Stack } from 'expo-router';

export default function PaymentLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen 
      name="confirm" 
      options={{
        headerShown: true,
        title: 'Fanamafisa fandoavabola',
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: '#2c3e50' },
        headerTintColor: 'white',
    }}
      />
      <Stack.Screen 
      name="realistic" 
      options={{
        headerShown: true,
        title: 'Fandohavabola',
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: '#2c3e50' },
        headerTintColor: 'white',
    }}
      />
      <Stack.Screen 
      name="[id]" 
      options={{
        headerShown: true,
        title: 'Mombany  Fandohavabola',
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: '#2c3e50' },
        headerTintColor: 'white',
    }}
      />
    </Stack>
  );
}