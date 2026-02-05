import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../config/api';

/**
 * HTTP клиент для работы с API
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create(API_CONFIG);

    // Интерцептор для добавления токена к запросам
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Интерцептор для обработки ошибок с автоматическим обновлением токена
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const refreshToken = this.getRefreshToken();
          if (refreshToken) {
            try {
              const response = await axios.post(
                `${API_CONFIG.baseURL}/api/auth/refresh`,
                { refreshToken }
              );
              const { accessToken, refreshToken: newRefreshToken } = response.data;

              this.setToken(accessToken);
              if (newRefreshToken) {
                this.setRefreshToken(newRefreshToken);
              }

              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              }
              return this.client(originalRequest);
            } catch {
              this.clearToken();
            }
          } else {
            this.clearToken();
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Получить экземпляр axios клиента
   */
  getClient(): AxiosInstance {
    return this.client;
  }

  /**
   * Сохранить токен в localStorage
   */
  setToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }

  /**
   * Получить токен из localStorage
   */
  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Сохранить refresh токен
   */
  setRefreshToken(token: string): void {
    localStorage.setItem('refreshToken', token);
  }

  /**
   * Получить refresh токен
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  /**
   * Очистить токены и уведомить AuthContext
   */
  clearToken(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.dispatchEvent(new Event('auth-change'));
  }

  /**
   * Проверить, авторизован ли пользователь
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

// Экспортируем singleton экземпляр
const apiClientInstance = new ApiClient();
export const apiClient = apiClientInstance.getClient();

// Экспортируем методы для управления токенами
export const tokenManager = {
  setToken: (token: string) => apiClientInstance.setToken(token),
  getToken: () => apiClientInstance.getToken(),
  setRefreshToken: (token: string) => apiClientInstance.setRefreshToken(token),
  getRefreshToken: () => apiClientInstance.getRefreshToken(),
  clearToken: () => apiClientInstance.clearToken(),
  isAuthenticated: () => apiClientInstance.isAuthenticated(),
};

export default apiClient;

