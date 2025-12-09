import { Stack } from 'expo-router';

export default function HistoriqueLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: '#2c3e50' },
        headerTintColor: 'white',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          title: 'Tantara',
        }}
      />
      <Stack.Screen 
        name="[id]" 
        options={{
          title: 'Detailan-déklerasiona',
        }}
      />
    </Stack>
  );
}