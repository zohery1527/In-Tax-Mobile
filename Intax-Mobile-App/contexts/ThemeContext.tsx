// contexts/ThemeContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeType = 'light' | 'dark' | 'auto';



interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

interface ThemeContextType {
  theme: ThemeType;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
}

const lightColors: ThemeColors = {
  primary: '#2c3e50',
  secondary: '#3498db',
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#333333',
  border: '#dddddd',
  success: '#27ae60',
  warning: '#f39c12',
  error: '#e74c3c',
  info: '#3498db',
};

const darkColors: ThemeColors = {
  primary: '#3498db',
  secondary: '#2c3e50',
  background: '#121212',
  card: '#1e1e1e',
  text: '#ffffff',
  border: '#333333',
  success: '#2ecc71',
  warning: '#f1c40f',
  error: '#e74c3c',
  info: '#3498db',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('auto');
  const [isInitialized, setIsInitialized] = useState(false);

  // Charger le thème sauvegardé
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('app_theme');
        if (savedTheme) {
          setThemeState(savedTheme as ThemeType);
        }
      } catch (error) {
        console.error('Erreur chargement thème:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadTheme();
  }, []);

  // Déterminer les couleurs basées sur le thème
  const getCurrentColors = (): ThemeColors => {
    if (theme === 'auto') {
      return systemColorScheme === 'dark' ? darkColors : lightColors;
    }
    return theme === 'dark' ? darkColors : lightColors;
  };

  // Déterminer si c'est le mode sombre
  const isDark = theme === 'dark' || (theme === 'auto' && systemColorScheme === 'dark');

  // Changer le thème
  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem('app_theme', newTheme);
    } catch (error) {
      console.error('Erreur sauvegarde thème:', error);
    }
  };

  // Basculer entre light/dark
  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
  };

  if (!isInitialized) {
    return null; // ou un écran de chargement
  }

  const value: ThemeContextType = {
    theme,
    colors: getCurrentColors(),
    isDark,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme doit être utilisé à l\'intérieur d\'un ThemeProvider');
  }
  return context;
};