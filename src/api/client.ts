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

    // Интерцептор для обработки ошибок
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Токен истек или невалиден
          this.clearToken();
          // Можно перенаправить на страницу входа
          // window.location.href = '/login';
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
   * Очистить токены
   */
  clearToken(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
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

