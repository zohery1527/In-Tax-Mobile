import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { TaxAssistant } from '../../components/TaxAssistant';
import { useTheme } from '../../contexts/ThemeContext';

export default function TaxAssistantScreen() {
  const router = useRouter();
  const { colors } = useTheme(); // ← CORRECTION ICI : DESTRUCTUREZ `colors`

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
         <TaxAssistant onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});