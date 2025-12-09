// contexts/AuthContext.tsx - VERSION CORRIGÉE POUR REACT NATIVE
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { apiService, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: User, authToken: string, refreshToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  updateUserLocal: (updates: Partial<User>) => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Références pour éviter les boucles
  const isCheckingAuth = useRef(false);
  const hasPerformedInitialCheck = useRef(false);
  const lastCheckTime = useRef<number>(0);
  
  // ✅ CORRECTION ICI : Utiliser ReturnType<typeof setTimeout> pour React Native
  const checkAuthTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 🔧 Fonction pour nettoyer les timeouts
  const cleanupTimeouts = () => {
    if (checkAuthTimeout.current) {
      clearTimeout(checkAuthTimeout.current);
      checkAuthTimeout.current = null;
    }
  };

  // 🔧 Charger l'authentification depuis le stockage (UNE FOIS au démarrage)
  useEffect(() => {
    const loadStoredAuth = async () => {
      if (hasPerformedInitialCheck.current) return;
      
      try {
        console.log('🔐 Chargement de l\'authentification stockée...');
        
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem('auth_token'),
          AsyncStorage.getItem('user_data')
        ]);

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          
          setToken(storedToken);
          setUser(parsedUser);
          apiService.setToken(storedToken);
          
          console.log('✅ Authentification chargée:', parsedUser.phoneNumber);
        } else {
          console.log('ℹ️ Aucune authentification stockée trouvée');
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement de l\'authentification:', error);
        // Nettoyer les données potentiellement corrompues
        await AsyncStorage.multiRemove(['auth_token', 'user_data', 'refresh_token']);
      } finally {
        setIsLoading(false);
        hasPerformedInitialCheck.current = true;
      }
    };

    loadStoredAuth();

    // Nettoyage
    return () => {
      cleanupTimeouts();
    };
  }, []);

  // 🔧 Vérifier la validité du token - avec protection anti-boucle
  const checkAuth = useCallback(async (force: boolean = false): Promise<boolean> => {
    // Protection contre les appels multiples
    if (isCheckingAuth.current) {
      console.log('⏸️ Vérification déjà en cours, ignorée');
      return !!token;
    }

    // Vérifier le cooldown (min 10 secondes entre les vérifications)
    const now = Date.now();
    if (!force && now - lastCheckTime.current < 10000) {
      console.log('⏸️ Trop tôt depuis la dernière vérification');
      return !!token;
    }

    if (!token) {
      console.log('ℹ️ Pas de token, utilisateur non authentifié');
      return false;
    }

    isCheckingAuth.current = true;
    lastCheckTime.current = now;
    
    try {
      console.log('🔍 Vérification de la validité de l\'authentification...');
      
      const userProfile = await apiService.getProfile();
      
      // Mettre à jour l'utilisateur avec les données fraîches
      setUser(userProfile);
      await AsyncStorage.setItem('user_data', JSON.stringify(userProfile));
      
      console.log('✅ Authentification valide:', userProfile.phoneNumber);
      return true;
      
    } catch (error: any) {
      console.error('❌ Erreur vérification authentification:', error.message);
      
      // Si c'est une erreur d'authentification, nettoyer
      if (error.message.includes('Session expirée') || 
          error.message.includes('Token invalide') ||
          error.message.includes('401') ||
          error.message.includes('Authentification requise')) {
        console.log('⚠️ Session expirée, déconnexion...');
        await logout();
      }
      
      return false;
    } finally {
      isCheckingAuth.current = false;
    }
  }, [token]);

  // 🔧 Connexion
  const login = useCallback(async (userData: User, authToken: string, refreshToken?: string) => {
    try {
      console.log('🔑 Connexion en cours...');
      
      // Arrêter toute vérification en cours
      cleanupTimeouts();
      
      setToken(authToken);
      setUser(userData);
      apiService.setToken(authToken);

      const storageOps: Promise<void>[] = [
        AsyncStorage.setItem('auth_token', authToken),
        AsyncStorage.setItem('user_data', JSON.stringify(userData))
      ];
      
      if (refreshToken) {
        storageOps.push(AsyncStorage.setItem('refresh_token', refreshToken));
      }
      
      await Promise.all(storageOps);
      
      console.log('✅ Connexion réussie pour:', userData.phoneNumber);
    } catch (error) {
      console.error('❌ Erreur lors de la connexion:', error);
      throw error;
    }
  }, []);

  // 🔧 Déconnexion
  const logout = useCallback(async () => {
    try {
      console.log('🚪 Déconnexion en cours...');
      
      // Arrêter toute vérification en cours
      cleanupTimeouts();
      
      setUser(null);
      setToken(null);
      
      await apiService.logout();
      await AsyncStorage.multiRemove(['auth_token', 'user_data', 'refresh_token']);
      
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      // Forcer le nettoyage même en cas d'erreur
      setUser(null);
      setToken(null);
      await AsyncStorage.multiRemove(['auth_token', 'user_data', 'refresh_token']);
    }
  }, []);

  // 🔧 Rafraîchir les données utilisateur
  const refreshUser = useCallback(async (): Promise<User | null> => {
    if (!token) {
      console.log('ℹ️ Impossible de rafraîchir: pas de token');
      return null;
    }

    try {
      console.log('🔄 Rafraîchissement des données utilisateur...');
      
      const userProfile = await apiService.getProfile();
      setUser(userProfile);
      await AsyncStorage.setItem('user_data', JSON.stringify(userProfile));
      
      console.log('✅ Données utilisateur rafraîchies');
      return userProfile;
    } catch (error: any) {
      console.error('❌ Erreur rafraîchissement utilisateur:', error.message);
      
      // Si l'erreur est liée à l'authentification, déconnecter
      if (error.message.includes('Session expirée') || 
          error.message.includes('Token invalide') ||
          error.message.includes('401') ||
          error.message.includes('Authentification requise')) {
        console.log('⚠️ Session expirée lors du rafraîchissement');
        await logout();
      }
      
      return null;
    }
  }, [token, logout]);

  // 🔧 Mettre à jour le profil via API
  const updateUser = useCallback(async (updates: Partial<User>) => {
    try {
      console.log('✏️ Mise à jour du profil via API...');
      
      const updatedUser = await apiService.updateProfile(updates);
      setUser(updatedUser);
      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
      
      console.log('✅ Profil mis à jour via API');
      return updatedUser;
    } catch (error) {
      console.error('❌ Erreur mise à jour profil API:', error);
      throw error;
    }
  }, []);

  // 🔧 Mettre à jour localement
  const updateUserLocal = useCallback((updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      AsyncStorage.setItem('user_data', JSON.stringify(updatedUser)).catch(console.error);
    }
  }, [user]);

  // 🔧 Vérification périodique de l'authentification (optionnel)
  useEffect(() => {
    if (!token || isLoading) return;

    // ✅ CORRECTION ICI : setTimeout retourne un number dans React Native
    checkAuthTimeout.current = setTimeout(() => {
      checkAuth().catch(() => {});
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      cleanupTimeouts();
    };
  }, [token, isLoading, checkAuth]);

   const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    refreshUser,
    updateUser, // ✅ CORRECT : utilise la fonction définie ci-dessus
    updateUserLocal,
    checkAuth
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};

// Hook dérivé pour vérifier le statut NIF
export const useNIFStatus = () => {
  const { user } = useAuth();
  
  return {
    isNIFValidated: user?.nifStatus === 'VALIDATED',
    isNIFPending: user?.nifStatus === 'PENDING',
    isNIFRejected: user?.nifStatus === 'REJECTED',
    isNIFSuspended: user?.nifStatus === 'SUSPENDED',
    nifStatus: user?.nifStatus,
    nifNumber: user?.nifNumber,
    canDeclare: user?.nifStatus === 'VALIDATED',
    nifValidationDate: user?.nifAttributionDate
  };
};

// Hook dérivé pour les informations de rôle
export const useUserRole = () => {
  const { user } = useAuth();
  
  return {
    isVendeur: user?.role === 'VENDEUR',
    isAdmin: user?.role === 'ADMIN',
    isAgent: user?.role === 'AGENT',
    role: user?.role,
    hasAdminAccess: user?.role === 'ADMIN' || user?.role === 'AGENT'
  };
};

// Hook dérivé pour les informations de compte
export const useUserInfo = () => {
  const { user } = useAuth();
  
  return {
    fullName: user ? `${user.firstName} ${user.lastName}` : '',
    phoneNumber: user?.phoneNumber || '',
    activityType: user?.activityType || '',
    zone: user?.zone?.name || '',
    zoneCode: user?.zone?.code || '',
    isActive: user?.isActive || false,
    lastActivity: user?.lastActivityAt || user?.createdAt || ''
  };
};