// services/api.ts - VERSION FINALE POUR VENDEURS INFORMELS
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.43.103:5000/api';
const REQUEST_TIMEOUT = 30000;

// ======================
// ✅ TYPES PRINCIPAUX
// ======================
export type User = {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  nifNumber?: string;
  activityType: 'ALIMENTATION' | 'ARTISANAT' | 'COMMERCE' | 'SERVICES' | 'AUTRE';
  nifStatus: 'PENDING' | 'VALIDATED' | 'REJECTED' | 'SUSPENDED';
  role: 'VENDEUR' | 'ADMIN' | 'AGENT';
  zoneId?: number;
  zone?: {
    id: number;
    name: string;
    code: string;
    region: string;
    isActive: boolean;
  };
  isActive: boolean;
  createdAt?: string;
  lastActivityAt?: string;
  nifAttributionDate?: string;
  validatedBy?: string;
  rejectionReason?: string;
  suspendedAt?: string;
  suspensionReason?: string;
};

export type Declaration = {
  id: string;
  userId: string;
  amount: number;
  nifNumber: string;
  period: string;
  activityType: 'ALIMENTATION' | 'ARTISANAT' | 'COMMERCE' | 'SERVICES' | 'AUTRE';
  status: 'PENDING' | 'VALIDATED' | 'REJECTED' | 'PARTIALLY_PAID' | 'PAID';
  taxAmount: number;
  paidAmount: number;
  remainingAmount: number;
  description?: string;
  validatedAt?: string;
  validatedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  internalNotes?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: User;
  payments?: Payment[];
};

export type PaymentProvider = 'ORANGE_MONEY' | 'MVOLA' | 'AIRTEL_MONEY';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export type Payment = {
  id: string;
  declarationId: string;
  userId: string;
  amount: number;
  paymentType: 'FULL' | 'PARTIAL';
  remainingAmount: number;
  provider: PaymentProvider;
  nifNumber: string;
  transactionId: string;
  status: PaymentStatus;
  phoneNumber: string;
  paidAt?: string;
  refundedAt?: string;
  refundReason?: string;
  adminNotes?: string;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
  declaration?: Declaration;
};

export type TransactionLog = {
  id: string;
  transactionId: string;
  provider: PaymentProvider;
  userId: string;
  declarationId: string;
  amount: number;
  phoneNumber: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
  mode: 'REAL' | 'SIMULATION' | 'SANDBOX';
  metadata?: {
    initiatedAt?: string;
    confirmedAt?: string;
    action?: string;
    simulation?: any;
    mode?: string;
    provider?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  user?: User;
  declaration?: Declaration;
};

// ======================
// ✅ TYPES NOTIFICATIONS POUR VENDEURS
// ======================
export type NotificationType = 
  | 'WELCOME'               // Bienvenue nouveau vendeur
  | 'NIF_VALIDATED'         // NIF validé
  | 'NEW_DECLARATION'       // Nouvelle déclaration créée
  | 'PAYMENT_SUCCESS'       // Paiement réussi
  | 'MONTHLY_REMINDER'      // Rappel mensuel (20-25 du mois)
  | 'MISSING_DECLARATION'   // Déclaration manquante (mois précédent)
  | 'OVERDUE_DECLARATION'   // Déclaration en retard
  | 'SYSTEM_ALERT'          // Alerte système
  | 'NEW_FEATURE';          // Nouvelle fonctionnalité

export type ApiNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  isActive: boolean;
  actionUrl?: string;
  metadata?: NotificationMetadata;
  expiresAt?: string;
  createdAt: string;
  readAt?: string;
  updatedAt?: string;
};

export type NotificationMetadata = {
  type?: string;
  amount?: number;
  period?: string;
  nextMonth?: string;
  daysLeft?: number;
  missingPeriod?: string;
  monthsLate?: number;
  remaining?: number;
  declarationId?: string;
  nifNumber?: string;
  [key: string]: any;
};

export type NotificationsResponse = {
  notifications: ApiNotification[];
  unreadCount: number;
};

export type Zone = {
  id: number;
  name: string;
  code: string;
  region: string;
  isActive: boolean;
};

export type PendingOTP = {
  id: string;
  userId: string;
  phoneNumber: string;
  otpCode: string;
  purpose: 'LOGIN' | 'REGISTRATION' | 'PASSWORD_RESET' | 'PHONE_VERIFICATION';
  attempts: number;
  expiresAt: string;
  isUsed: boolean;
  createdAt?: string;
};

// ======================
// ✅ TYPES DE RÉPONSE
// ======================
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  transactionId?: string;
};

export interface PaymentIntent {
  declarationId: string;
  provider: PaymentProvider;
  paymentAmount?: number;
}

export interface PaymentConfirmation {
  transactionId: string;
  provider: PaymentProvider;
}

export interface LoginResponse {
  userId: string;
  message: string;
  debugInfo?: {
    phoneNumber: string;
    role: string;
    timestamp: string;
  };
  otpCode?: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    role: string;
    activityType: string;
    zone: string;
    nifNumber: string;
    nifStatus: string;
  };
  otpCode?: string;
  message: string;
}

export interface VerifyOTPResponse {
  token: string;
  user: User;
  refreshToken?: string;
}

export interface InitiatePaymentResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  data?: {
    payment?: Payment;
    transactionId?: string;
    nextStep?: string;
    simulationInfo?: any;
  };
}

export interface ConfirmPaymentResponse {
  success: boolean;
  message: string;
  data?: {
    payment?: Payment;
    declaration?: {
      id: string;
      status: string;
      paidAmount: number;
      remainingAmount: number;
    };
  };
}

// ======================
// ✅ ApiService - Version finale pour vendeurs
// ======================
class ApiService {
  private token: string | null = null;
  private refreshTokenInProgress: boolean = false;
  private requestQueue: (() => void)[] = [];

  // ======================
  // ✅ INITIALISATION
  // ======================
  async initialize(): Promise<void> {
    try {
      this.token = await SecureStore.getItemAsync('auth_token');
      console.log('🔑 API Service initialisé:', { hasToken: !!this.token });
    } catch (error) {
      console.error('❌ Erreur initialisation API:', error);
      await this.clearTokens();
    }
  }

  async hasValidToken(): Promise<boolean> {
    if (!this.token) await this.initialize();
    return !!this.token;
  }

  setToken(token: string): void {
    console.log('🔑 Token défini:', token ? `${token.substring(0, 20)}...` : 'NON');
    this.token = token;
    
    if (token) {
      SecureStore.setItemAsync('auth_token', token).catch(error => {
        console.error('❌ Erreur sauvegarde token:', error);
      });
    }
  }

  setTokens(token: string, refreshToken?: string): void {
    this.token = token;
    
    const storageOps = [SecureStore.setItemAsync('auth_token', token)];
    if (refreshToken) {
      storageOps.push(SecureStore.setItemAsync('refresh_token', refreshToken));
    }
    
    Promise.all(storageOps).catch(console.error);
  }

  async clearTokens(): Promise<void> {
    this.token = null;
    try {
      await Promise.all([
        SecureStore.deleteItemAsync('auth_token'),
        SecureStore.deleteItemAsync('refresh_token'),
        SecureStore.deleteItemAsync('user_data')
      ]);
      console.log('✅ Tokens et données utilisateur supprimés');
    } catch (error) {
      console.error('❌ Erreur suppression tokens:', error);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // ======================
  // ✅ MÉTHODES DE REQUÊTE
  // ======================
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    authRequired: boolean = true,
    retryCount: number = 0
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers as Record<string, string> || {})
      };

      if (authRequired) {
        if (!this.token) {
          await this.initialize();
        }
        if (!this.token && authRequired) {
          throw new Error('Authentification requise. Veuillez vous reconnecter.');
        }
        if (this.token) {
          headers['Authorization'] = `Bearer ${this.token}`;
        }
      }

      const url = `${API_BASE_URL}${endpoint}`;
      console.log(`🌐 ${options.method || 'GET'} ${url}`);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return {} as T;
      }

      let responseData;
      try {
        responseData = await response.json();
        console.log(`📥 Réponse ${response.status}:`, responseData);
      } catch (e) {
        console.error('❌ Erreur parsing JSON:', e);
        throw new Error(`Réponse invalide du serveur: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        if (response.status === 401 && authRequired && retryCount === 0) {
          console.log('🔄 Token expiré, tentative de rafraîchissement...');
          const refreshed = await this.tryRefreshToken();
          if (refreshed) {
            console.log('✅ Token rafraîchi, nouvelle tentative...');
            return this.request<T>(endpoint, options, authRequired, retryCount + 1);
          }
          await this.clearTokens();
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }

        const errorMessage = responseData.message || 
                            responseData.error || 
                            `Erreur ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      return responseData;

    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('La requête a expiré. Vérifiez votre connexion.');
      }
      
      if (error.message.includes('Network request failed')) {
        throw new Error('Problème de connexion. Vérifiez votre internet et réessayez.');
      }
      
      console.error(`❌ API Error ${endpoint}:`, error.message);
      throw error;
    }
  }

  private async tryRefreshToken(): Promise<boolean> {
    if (this.refreshTokenInProgress) {
      return new Promise((resolve) => {
        this.requestQueue.push(() => resolve(this.tryRefreshToken()));
      });
    }

    this.refreshTokenInProgress = true;

    try {
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (!refreshToken) {
        console.log('ℹ️ Aucun refresh token disponible');
        return false;
      }

      console.log('🔄 Tentative de rafraîchissement du token...');
      
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.token) {
            this.setTokens(data.data.token, data.data.refreshToken);
            console.log('✅ Token rafraîchi avec succès');
            return true;
          }
        }
      } catch (fetchError) {
        console.error('❌ Erreur lors du refresh token:', fetchError);
      }

      console.log('⚠️ Refresh token échoué, déconnexion...');
      await this.clearTokens();
      return false;

    } finally {
      this.refreshTokenInProgress = false;
      const nextRequest = this.requestQueue.shift();
      if (nextRequest) nextRequest();
    }
  }

  private fetchPublic<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, options, false);
  }

  private fetchAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, options, true);
  }

  // ======================
  // ✅ AUTHENTIFICATION
  // ======================
  async login(phoneNumber: string): Promise<LoginResponse> {
    console.log('📱 Tentative de connexion:', phoneNumber);
    
    const data = await this.fetchPublic<ApiResponse<LoginResponse>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber })
    });
    
    if (!data.success) throw new Error(data.message || data.error || 'Échec de la connexion');
    return data.data!;
  }

  async register(userData: {
    phoneNumber: string;
    firstName: string;
    lastName: string;
    activityType: string;
    zoneId: number;
  }): Promise<RegisterResponse> {
    console.log('📝 Inscription utilisateur:', userData.phoneNumber);
    
    const data = await this.fetchPublic<ApiResponse<RegisterResponse>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    if (!data.success) throw new Error(data.message || data.error || 'Échec de l\'inscription');
    return data.data!;
  }

  async verifyOTP(userId: string, otpCode: string): Promise<VerifyOTPResponse> {
    console.log('🔐 Vérification OTP pour userId:', userId);
    
    const data = await this.fetchPublic<ApiResponse<VerifyOTPResponse>>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ userId, otpCode })
    });
    
    if (!data.success) throw new Error(data.message || data.error || 'Code OTP invalide');
    
    const result = data.data!;
    this.setTokens(result.token, result.refreshToken);
    return result;
  }

  async resendOtp(userId: string): Promise<{ otpCode?: string; phone: string }> {
    console.log('🔄 Renvoi OTP pour userId:', userId);
    
    const data = await this.fetchPublic<ApiResponse<{ otpCode?: string; phone: string }>>('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
    
    if (!data.success) throw new Error(data.message || data.error || 'Échec de l\'envoi');
    return data.data!;
  }

  async logout(): Promise<void> {
    try {
      console.log('🚪 Déconnexion en cours...');
      await this.fetchAuth('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('⚠️ Erreur lors de la déconnexion API:', error);
    } finally {
      await this.clearTokens();
    }
  }

  // ======================
  // ✅ REFRESH TOKEN
  // ======================
  async refreshAuthToken(): Promise<{ token: string; refreshToken?: string }> {
    const data = await this.fetchPublic<ApiResponse<{ token: string; refreshToken?: string }>>('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ 
        refreshToken: await SecureStore.getItemAsync('refresh_token') 
      })
    });
    
    if (!data.success) throw new Error(data.message || data.error || 'Échec du rafraîchissement');
    
    const result = data.data!;
    this.setTokens(result.token, result.refreshToken);
    return result;
  }

  // ======================
  // ✅ PROFIL UTILISATEUR
  // ======================
  async getProfile(): Promise<User> {
    console.log('👤 Chargement du profil...');
    
    const data = await this.fetchAuth<ApiResponse<User>>('/auth/profile');
    if (!data.success) throw new Error(data.message || data.error || 'Erreur chargement profil');
    return data.data!;
  }

  async updateProfile(profileData: Partial<User>): Promise<User> {
    console.log('✏️ Mise à jour du profil...');
    
    const data = await this.fetchAuth<ApiResponse<User>>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    
    if (!data.success) throw new Error(data.message || data.error || 'Erreur mise à jour profil');
    return data.data!;
  }

  // ======================
  // ✅ ZONES
  // ======================
  async getAllZones(): Promise<Zone[]> {
    console.log('🗺️ Chargement des zones...');
    
    const data = await this.fetchPublic<ApiResponse<Zone[]>>('/auth/zones');
    return data.data || [];
  }

  // ======================
  // ✅ DÉCLARATIONS
  // ======================
  async getUserDeclarations(page: number = 1, limit: number = 20): Promise<Declaration[]> {
    console.log('📋 Chargement des déclarations page', page);
    
    const data = await this.fetchAuth<ApiResponse<{ declarations: Declaration[] }>>(
      `/declarations?page=${page}&limit=${limit}`
    );
    
    return data.data?.declarations || [];
  }

  async getDeclaration(id: string): Promise<Declaration> {
    console.log('📄 Chargement déclaration:', id);
    
    const data = await this.fetchAuth<ApiResponse<{ declaration: Declaration }>>(`/declarations/${id}`);
    if (!data.success) throw new Error(data.message || data.error || 'Déclaration non trouvée');
    return data.data!.declaration;
  }

  async createDeclaration(declarationData: {
    amount: number;
    period: string;
    activityType: string;
    description?: string;
  }): Promise<Declaration> {
    console.log('➕ Création déclaration:', declarationData.period);
    
    const data = await this.fetchAuth<ApiResponse<Declaration>>('/declarations', {
      method: 'POST',
      body: JSON.stringify(declarationData)
    });
    
    if (!data.success) throw new Error(data.message || data.error || 'Erreur création déclaration');
    return data.data!;
  }

  async updateDeclaration(id: string, updateData: { amount?: number; description?: string }): Promise<Declaration> {
    console.log('✏️ Mise à jour déclaration:', id);
    
    const data = await this.fetchAuth<ApiResponse<{ declaration: Declaration }>>(
      `/declarations/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(updateData)
      }
    );
    
    if (!data.success) throw new Error(data.message || data.error || 'Erreur mise à jour déclaration');
    return data.data!.declaration;
  }

  async deleteDeclaration(id: string): Promise<void> {
    console.log('🗑️ Suppression déclaration:', id);
    
    const data = await this.fetchAuth<ApiResponse>(`/declarations/${id}`, { 
      method: 'DELETE' 
    });
    if (!data.success) throw new Error(data.message || data.error || 'Erreur suppression déclaration');
  }

  async getDeclarationsStats(): Promise<any> {
    console.log('📊 Chargement statistiques déclarations...');
    
    const data = await this.fetchAuth<ApiResponse<any>>('/declarations/stats/status');
    return data.data || {};
  }

  async getStatsSummary(): Promise<any> {
    console.log('📈 Chargement résumé statistiques...');
    
    const data = await this.fetchAuth<ApiResponse<any>>('/declarations/stats/summary');
    return data.data || {};
  }

  // ======================
  // ✅ PAIEMENTS
  // ======================
  
  async initiatePayment(paymentData: PaymentIntent): Promise<InitiatePaymentResponse> {
    console.log('💳 Initiation paiement:', paymentData);
    
    try {
      const requestData = {
        declarationId: paymentData.declarationId,
        provider: this.mapProviderToBackend(paymentData.provider),
        paymentAmount: paymentData.paymentAmount,
        mode: 'SIMULATION'
      };
      
      console.log('📤 Données envoyées:', requestData);
      
      const data = await this.fetchAuth<InitiatePaymentResponse>('/payments/initiate', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });
      
      console.log('✅ Initiation paiement réponse:', data);
      return data;
      
    } catch (error: any) {
      console.error('❌ Erreur initiation paiement:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de l\'initiation du paiement'
      };
    }
  }

  async confirmPayment(confirmation: PaymentConfirmation): Promise<ConfirmPaymentResponse> {
    console.log('✅ Confirmation paiement:', confirmation);
    
    try {
      const requestData = {
        transactionId: confirmation.transactionId,
        provider: this.mapProviderToBackend(confirmation.provider),
        mode: 'SIMULATION'
      };
      
      console.log('📤 Données confirmation:', requestData);
      
      const data = await this.fetchAuth<ConfirmPaymentResponse>('/payments/confirm', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });
      
      console.log('✅ Confirmation paiement réponse:', data);
      return data;
      
    } catch (error: any) {
      console.error('❌ Erreur confirmation paiement:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la confirmation du paiement'
      };
    }
  }

  private mapProviderToBackend(provider: PaymentProvider): string {
    const mapping = {
      'ORANGE_MONEY': 'orange',
      'MVOLA': 'mvola',
      'AIRTEL_MONEY': 'airtel'
    };
    return mapping[provider] || 'orange';
  }

  async processPayment(
    paymentData: PaymentIntent,
    onStatusChange?: (status: string) => void
  ): Promise<{ 
    success: boolean; 
    transactionId?: string; 
    payment?: Payment;
    error?: string;
  }> {
    try {
      onStatusChange?.('INITIATION_EN_COURS');
      const initiationResult = await this.initiatePayment(paymentData);
      
      if (!initiationResult.success || !initiationResult.transactionId) {
        return {
          success: false,
          error: initiationResult.message || 'Échec de l\'initiation'
        };
      }
      
      onStatusChange?.('CONFIRMATION_EN_ATTENTE');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onStatusChange?.('CONFIRMATION_EN_COURS');
      const confirmationResult = await this.confirmPayment({
        transactionId: initiationResult.transactionId,
        provider: paymentData.provider
      });
      
      if (!confirmationResult.success) {
        return {
          success: false,
          transactionId: initiationResult.transactionId,
          error: confirmationResult.message || 'Échec de la confirmation'
        };
      }
      
      return {
        success: true,
        transactionId: initiationResult.transactionId,
        payment: confirmationResult.data?.payment
      };
      
    } catch (error: any) {
      console.error('❌ Erreur dans processPayment:', error);
      return {
        success: false,
        error: error.message || 'Erreur inattendue'
      };
    }
  }

  async getPaymentHistory(page: number = 1, limit: number = 20): Promise<{ 
    payments: Payment[]; 
    total: number;
    page: number;
    totalPages: number;
  }> {
    console.log('💾 Historique paiements page', page);
    
    const data = await this.fetchAuth<ApiResponse<{ 
      payments: Payment[]; 
      total: number;
      page: number;
      totalPages: number;
    }>>(`/payments/history?page=${page}&limit=${limit}`);
    
    if (!data.success) {
      throw new Error(data.message || data.error || 'Erreur chargement historique');
    }
    
    return {
      payments: data.data?.payments || [],
      total: data.data?.total || 0,
      page: data.data?.page || page,
      totalPages: data.data?.totalPages || 0
    };
  }

  async getPaymentDetails(id: string): Promise<Payment> {
    console.log('🔍 Détails paiement API:', id);
    
    const response = await this.fetchAuth<ApiResponse<{ payment: Payment }>>(`/payments/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || response.error || 'Paiement non trouvé');
    }
    
    const payment = response.data?.payment;
    
    if (!payment) {
      throw new Error('Format de réponse invalide');
    }
    
    console.log('✅ Détails paiement récupérés:', {
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      transactionId: payment.transactionId
    });
    
    return payment;
  }

  async getTransactionHistory(
    page: number = 1, 
    limit: number = 20,
    filters?: { status?: string; provider?: PaymentProvider }
  ): Promise<{ 
    transactions: TransactionLog[]; 
    total: number;
    page: number;
    totalPages: number;
  }> {
    console.log('📋 Historique transactions page', page);
    
    let url = `/transactions/history?page=${page}&limit=${limit}`;
    if (filters?.status) url += `&status=${filters.status}`;
    if (filters?.provider) url += `&provider=${filters.provider}`;
    
    const data = await this.fetchAuth<ApiResponse<{ 
      transactions: TransactionLog[]; 
      total: number;
      page: number;
      totalPages: number;
    }>>(url);
    
    if (!data.success) {
      throw new Error(data.message || data.error || 'Erreur chargement transactions');
    }
    
    return {
      transactions: data.data?.transactions || [],
      total: data.data?.total || 0,
      page: data.data?.page || page,
      totalPages: data.data?.totalPages || 0
    };
  }

  async getTransactionDetails(transactionId: string): Promise<TransactionLog> {
    console.log('🔍 Détails transaction:', transactionId);
    
    const data = await this.fetchAuth<ApiResponse<TransactionLog>>(`/transactions/${transactionId}`);
    if (!data.success) throw new Error(data.message || data.error || 'Transaction non trouvée');
    return data.data!;
  }

  async getPaymentStats(): Promise<{
    totalPaid: number;
    pendingCount: number;
    completedCount: number;
    failedCount: number;
    byProvider: Record<PaymentProvider, number>;
  }> {
    console.log('📊 Chargement statistiques paiements...');
    
    const data = await this.fetchAuth<ApiResponse<any>>('/payments/stats');
    
    if (!data.success) {
      return {
        totalPaid: 0,
        pendingCount: 0,
        completedCount: 0,
        failedCount: 0,
        byProvider: {
          ORANGE_MONEY: 0,
          MVOLA: 0,
          AIRTEL_MONEY: 0
        }
      };
    }
    
    return data.data || {
      totalPaid: 0,
      pendingCount: 0,
      completedCount: 0,
      failedCount: 0,
      byProvider: {
        ORANGE_MONEY: 0,
        MVOLA: 0,
        AIRTEL_MONEY: 0
      }
    };
  }

  // ======================
  // ✅ NOTIFICATIONS POUR VENDEURS
  // ======================
  async getUserNotifications(unreadOnly: boolean = false, limit: number = 20): Promise<NotificationsResponse> {
    try {
      console.log('🔔 Chargement notifications pour vendeurs...');
      
      const data = await this.fetchAuth<ApiResponse<NotificationsResponse>>(
        `/notifications?unreadOnly=${unreadOnly}&limit=${limit}`
      );
      
      if (!data.success) {
        throw new Error(data.message || data.error || 'Tsy nahomby ny fandraisana ny fampahatsiahivana');
      }
      
      const result = data.data || { notifications: [], unreadCount: 0 };
      
      console.log(`✅ ${result.notifications.length} notifications chargées, ${result.unreadCount} non lues`);
      return result;
      
    } catch (error: any) {
      console.error('❌ Erreur chargement notifications:', error.message);
      return { notifications: [], unreadCount: 0 };
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      console.log('📖 Marquer notification comme lue:', notificationId);
      
      const data = await this.fetchAuth<ApiResponse>(`/notifications/${notificationId}/read`, { 
        method: 'PUT' 
      });
      
      if (!data.success) {
        throw new Error(data.message || data.error || 'Tsy nahomby ny marika fampahatsiahivana');
      }
      
      console.log('✅ Notification marquée comme lue');
      
    } catch (error: any) {
      console.error('❌ Erreur marquage notification:', error.message);
      throw error;
    }
  }

  async markAllNotificationsAsRead(): Promise<number> {
    try {
      console.log('📖 Marquer toutes notifications comme lues');
      
      const data = await this.fetchAuth<ApiResponse<{ updatedCount: number }>>(
        '/notifications/read-all',
        { method: 'PUT' }
      );
      
      if (!data.success) {
        throw new Error(data.message || data.error || 'Tsy nahomby ny marika fampahatsiahivana');
      }
      
      const updatedCount = data.data?.updatedCount || 0;
      console.log(`✅ ${updatedCount} notifications marquées comme lues`);
      return updatedCount;
      
    } catch (error: any) {
      console.error('❌ Erreur marquage toutes notifications:', error.message);
      throw error;
    }
  }

  async getUnreadNotificationsCount(): Promise<number> {
    try {
      const { unreadCount } = await this.getUserNotifications(true, 1);
      return unreadCount;
    } catch {
      return 0;
    }
  }

  // ======================
  // ✅ UTILITAIRES NOTIFICATIONS
  // ======================
  isNotificationRecent(notification: ApiNotification): boolean {
    if (!notification.createdAt) return false;
    
    const notificationDate = new Date(notification.createdAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return diffDays <= 7;
  }

  getNotificationIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      'WELCOME': '👋',
      'NIF_VALIDATED': '🎊',
      'NEW_DECLARATION': '📄',
      'PAYMENT_SUCCESS': '🎉',
      'MONTHLY_REMINDER': '🔔',
      'MISSING_DECLARATION': '⚠️',
      'OVERDUE_DECLARATION': '🚨',
      'SYSTEM_ALERT': 'ℹ️',
      'NEW_FEATURE': '✨'
    };
    return icons[type] || '📢';
  }

  getNotificationColor(type: NotificationType): string {
    const colors: Record<NotificationType, string> = {
      'WELCOME': '#3498db',
      'NIF_VALIDATED': '#2ecc71',
      'NEW_DECLARATION': '#9b59b6',
      'PAYMENT_SUCCESS': '#27ae60',
      'MONTHLY_REMINDER': '#f39c12',
      'MISSING_DECLARATION': '#e74c3c',
      'OVERDUE_DECLARATION': '#c0392b',
      'SYSTEM_ALERT': '#34495e',
      'NEW_FEATURE': '#8e44ad'
    };
    return colors[type] || '#7f8c8d';
  }

  formatNotificationDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMins < 1) return 'Vao izao';
      if (diffMins < 60) return `Avy ela ${diffMins} minitra`;
      if (diffHours < 24) return `Avy ela ${diffHours} ora`;
      if (diffDays === 1) return 'Omaly';
      if (diffDays < 7) return `Avy ela ${diffDays} andro`;
      
      return new Intl.DateTimeFormat('fr-MG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(date);
    } catch {
      return dateString;
    }
  }

  filterNotificationsByType(
    notifications: ApiNotification[], 
    types: NotificationType[]
  ): ApiNotification[] {
    return notifications.filter(notification => 
      types.includes(notification.type)
    );
  }

  groupNotificationsByDay(notifications: ApiNotification[]): Record<string, ApiNotification[]> {
    const groups: Record<string, ApiNotification[]> = {};
    
    notifications.forEach(notification => {
      if (!notification.createdAt) return;
      
      const date = new Date(notification.createdAt);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(notification);
    });
    
    return groups;
  }

  getNotificationAction(notification: ApiNotification): { label: string; url: string } {
    const defaultAction = { label: 'Jereo', url: '/' };
    
    if (notification.actionUrl) {
      return { label: 'Jereo', url: notification.actionUrl };
    }
    
    switch (notification.type) {
      case 'NEW_DECLARATION':
      case 'OVERDUE_DECLARATION':
        return { label: 'Mandehana anjara', url: '/payments' };
      case 'PAYMENT_SUCCESS':
        return { label: 'Jereo ny voaloa', url: '/history' };
      case 'MISSING_DECLARATION':
        return { label: 'Manao famaranana', url: '/declarations/new' };
      case 'MONTHLY_REMINDER':
        return { label: 'Jereo ny tari-dalana', url: '/declarations' };
      case 'NIF_VALIDATED':
        return { label: 'Manao famaranana voalohany', url: '/declarations/new' };
      case 'WELCOME':
        return { label: 'Manomboka', url: '/guide' };
      default:
        return defaultAction;
    }
  }

  // ======================
  // ✅ SYSTÈME
  // ======================
  async getSystemHealth(): Promise<any> {
    console.log('🩺 Vérification santé système...');
    
    const data = await this.fetchAuth<ApiResponse<any>>('/system/health');
    return data.data || {};
  }

  async getMobileMoneyStatus(): Promise<any> {
    console.log('📱 Statut Mobile Money...');
    
    const data = await this.fetchAuth<ApiResponse<any>>('/system/mobile-money-status');
    return data.data || {};
  }

  async validateConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
      
    } catch {
      return false;
    }
  }

  // ======================
  // ✅ UTILITAIRES GÉNÉRAUX
  // ======================
  async testConnection(): Promise<{ success: boolean; message: string; ping?: number }> {
    try {
      const startTime = Date.now();
      const health = await this.getSystemHealth();
      const ping = Date.now() - startTime;
      
      return {
        success: true,
        message: `API connectée - ${health.status || 'OK'}`,
        ping
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Impossible de se connecter à l\'API'
      };
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-MG', {
      style: 'currency',
      currency: 'MGA',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fr-MG', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return dateString;
    }
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'PENDING': '#FFA500',
      'VALIDATED': '#007AFF',
      'REJECTED': '#FF3B30',
      'PARTIALLY_PAID': '#5856D6',
      'PAID': '#34C759',
      'COMPLETED': '#34C759',
      'FAILED': '#FF3B30',
      'REFUNDED': '#8E8E93',
      'EXPIRED': '#8E8E93'
    };
    return colors[status] || '#8E8E93';
  }

  getProviderColor(provider: PaymentProvider): string {
    const colors: Record<PaymentProvider, string> = {
      'ORANGE_MONEY': '#FF6600',
      'MVOLA': '#00A859',
      'AIRTEL_MONEY': '#ED1C24'
    };
    return colors[provider] || '#8E8E93';
  }

  getProviderIcon(provider: PaymentProvider): string {
    const icons: Record<PaymentProvider, string> = {
      'ORANGE_MONEY': '🟠',
      'MVOLA': '🟢',
      'AIRTEL_MONEY': '🔴'
    };
    return icons[provider] || '💳';
  }

  canPayDeclaration(declaration: Declaration): { canPay: boolean; reason?: string } {
    if (declaration.status === 'PAID') {
      return { canPay: false, reason: 'Cette déclaration est déjà payée' };
    }
    
    if (declaration.remainingAmount <= 0) {
      return { canPay: false, reason: 'Aucun montant à payer' };
    }
    
    if (declaration.status !== 'VALIDATED') {
      return { canPay: false, reason: 'NIF non validé' };
    }
    
    return { canPay: true };
  }

  // ======================
  // ✅ MÉTHODES POUR JOBS
  // ======================
  async runJobsTest(): Promise<any> {
    try {
      console.log('🚀 Test des jobs...');
      
      const response = await fetch(`${API_BASE_URL}/jobs/run-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      const data = await response.json();
      console.log('✅ Test jobs résultat:', data);
      return data;
      
    } catch (error: any) {
      console.error('❌ Erreur test jobs:', error);
      return { success: false, error: error.message };
    }
  }

  async getJobsStatus(): Promise<any> {
    try {
      console.log('📊 Statut des jobs...');
      
      const response = await fetch(`${API_BASE_URL}/jobs/status`);
      const data = await response.json();
      console.log('✅ Statut jobs:', data);
      return data;
      
    } catch (error: any) {
      console.error('❌ Erreur statut jobs:', error);
      return { success: false, error: error.message };
    }
  }
}

// ======================
// ✅ INSTANCE UNIQUE EXPORTÉE
// ======================
const apiService = new ApiService();

// Initialisation automatique au démarrage
apiService.initialize().catch(console.error);

export { apiService };
