// hooks/useApi.ts - VERSION CORRIGÉE
import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiNotification, apiService, Declaration, Payment, User, Zone } from '../services/api';

export type ApiState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
};

export type ApiOptions<T, P extends any[]> = {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onFinally?: () => void;
  initialData?: T | null;
  enabled?: boolean;
  autoFetch?: boolean;
  dependencies?: any[];
  cacheKey?: string;
  fetchArgs?: P; // Nouveau: arguments pour l'auto-fetch
};

export function useApi<T, P extends any[]>(
  apiFunction: (...args: P) => Promise<T>,
  options: ApiOptions<T, P> = {}
) {
  const {
    onSuccess,
    onError,
    onFinally,
    initialData = null,
    enabled = true,
    autoFetch = false,
    dependencies = [],
    cacheKey,
    fetchArgs = [] as unknown as P // Arguments par défaut pour l'auto-fetch
  } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
    initialized: false
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const execute = useCallback(async (...args: P): Promise<T> => {
    if (!enabled) {
      throw new Error('Hook désactivé');
    }

    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await apiFunction(...args);
      
      if (!isMountedRef.current) return result;
      
      setState({
        data: result,
        loading: false,
        error: null,
        initialized: true
      });

      onSuccess?.(result);
      return result;

    } catch (error: any) {
      // Ignorer les erreurs d'annulation
      if (error.name === 'AbortError') {
        throw error;
      }

      if (!isMountedRef.current) throw error;

      const errorMessage = error.message || 'Erreur inconnue';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        initialized: true
      }));

      onError?.(error);
      throw error;

    } finally {
      if (isMountedRef.current) {
        onFinally?.();
      }
      abortControllerRef.current = null;
    }
  }, [apiFunction, enabled, onSuccess, onError, onFinally]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setState({
      data: initialData,
      loading: false,
      error: null,
      initialized: false
    });
  }, [initialData]);

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  // Auto-fetch si configuré
  useEffect(() => {
    if (autoFetch && enabled) {
      // Utiliser les arguments spécifiés ou des arguments vides
      const args = fetchArgs;
      execute(...args).catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Auto-fetch error:', error);
        }
      });
    }
  }, [autoFetch, enabled, execute, JSON.stringify(fetchArgs), ...dependencies]);

  // Nettoyage à la destruction
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const refetch = useCallback(() => {
    return execute(...fetchArgs);
  }, [execute, JSON.stringify(fetchArgs)]);

  return {
    ...state,
    execute,
    reset,
    setData,
    refetch
  };
}

// Hook spécifique pour les déclarations
export function useDeclarations(page: number = 1, limit: number = 20, options?: Omit<ApiOptions<Declaration[], [number, number]>, 'fetchArgs'>) {
  return useApi(apiService.getUserDeclarations, {
    initialData: [],
    autoFetch: true,
    fetchArgs: [page, limit] as [number, number],
    ...options
  });
}

// Hook spécifique pour le profil utilisateur
export function useUserProfile(options?: Omit<ApiOptions<User, []>, 'fetchArgs'>) {
  return useApi(apiService.getProfile, {
    autoFetch: true,
    fetchArgs: [] as [],
    ...options
  });
}

// Hook spécifique pour les notifications
export function useNotifications(unreadOnly: boolean = false, limit: number = 50, options?: Omit<ApiOptions<ApiNotification[], [boolean, number]>, 'fetchArgs'>) {
  const fetchNotifications = useCallback(async (unreadOnly: boolean, limit: number) => {
    const result = await apiService.getUserNotifications(unreadOnly, limit);
    return result.notifications;
  }, []);

  return useApi(fetchNotifications, {
    initialData: [],
    autoFetch: true,
    fetchArgs: [unreadOnly, limit] as [boolean, number],
    ...options
  });
}

// Hook spécifique pour les paiements
export function usePayments(page: number = 1, limit: number = 20, options?: Omit<ApiOptions<Payment[], [number, number]>, 'fetchArgs'>) {
  const fetchPayments = useCallback(async (page: number, limit: number) => {
    const result = await apiService.getPaymentHistory(page, limit);
    return result.payments;
  }, []);

  return useApi(fetchPayments, {
    initialData: [],
    autoFetch: true,
    fetchArgs: [page, limit] as [number, number],
    ...options
  });
}

// Hook spécifique pour les zones
export function useZones(options?: Omit<ApiOptions<Zone[], []>, 'fetchArgs'>) {
  return useApi(apiService.getAllZones, {
    initialData: [],
    autoFetch: true,
    fetchArgs: [] as [],
    ...options
  });
}

// Hook pour l'authentification
export function useAuthActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (phoneNumber: string) => {
    setLoading(true);
    setError(null);
    
    try {
      return await apiService.login(phoneNumber);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOTP = useCallback(async (userId: string, otpCode: string) => {
    setLoading(true);
    setError(null);
    
    try {
      return await apiService.verifyOTP(userId, otpCode);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      return await apiService.register(userData);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    login,
    verifyOTP,
    register,
    loading,
    error,
    clearError: () => setError(null)
  };
}