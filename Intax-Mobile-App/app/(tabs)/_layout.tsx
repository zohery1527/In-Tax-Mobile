import { Tabs } from 'expo-router';
import { Icons } from '../../components/Icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e0e0e0',
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: '#7f8c8d',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="accueil"
        options={{
          title: 'Fandraisana',
          tabBarIcon: ({ focused }) => <Icons.Home focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="declarer"
        options={{
          title: 'Hanàto',
          tabBarIcon: ({ focused }) => <Icons.Document focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Kaonty',
          tabBarIcon: ({ focused }) => <Icons.User focused={focused} />,
        }}
      />
    </Tabs>
  );
}