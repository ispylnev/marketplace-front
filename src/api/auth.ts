import apiClient, { tokenManager } from './client';

/**
 * Типы для аутентификации
 */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UserInfo {
  id: number;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  roles: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserInfo;
}

/**
 * API для аутентификации
 */
export const authApi = {
  /**
   * Регистрация нового пользователя
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/register', data);
    const authData = response.data;
    
    // Сохраняем токены
    tokenManager.setToken(authData.accessToken);
    tokenManager.setRefreshToken(authData.refreshToken);
    
    return authData;
  },

  /**
   * Вход пользователя
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', data);
    const authData = response.data;
    
    // Сохраняем токены
    tokenManager.setToken(authData.accessToken);
    tokenManager.setRefreshToken(authData.refreshToken);
    
    return authData;
  },

  /**
   * Обновление токена
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/refresh', {
      refreshToken,
    });
    const authData = response.data;
    
    // Сохраняем новые токены
    tokenManager.setToken(authData.accessToken);
    tokenManager.setRefreshToken(authData.refreshToken);
    
    return authData;
  },

  /**
   * Выход из системы
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout', { refreshToken });
    } finally {
      tokenManager.clearToken();
    }
  },

  /**
   * Получение информации о текущем пользователе
   */
  async getCurrentUser(): Promise<UserInfo> {
    const response = await apiClient.get<UserInfo>('/api/users/me');
    return response.data;
  },
};

