import { Stack } from 'expo-router';

export default function DeclarerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="photo" 
        options={{
          headerShown: true,
          title: 'Hanàto amin-tsary',
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#2c3e50' },
          headerTintColor: 'white',
        }}
      />
      <Stack.Screen 
        name="vocale" 
        options={{
          headerShown: true,
          title: 'Hanàto amin-teny',
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#2c3e50' },
          headerTintColor: 'white',
        }}
      />
    </Stack>
  );
}