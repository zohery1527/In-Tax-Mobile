import { Stack } from 'expo-router';

export default function AccueilLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="simple" 
        options={{
          headerShown: true,
          title: 'Hanàto tsotra',
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#2c3e50' },
          headerTintColor: 'white',
        }}
      />
    </Stack>
  );
}