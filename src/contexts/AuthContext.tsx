import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { tokenManager } from '../api/client';
import { UserInfo } from '../types';
import apiClient from '../api/client';
import { cartService } from '../api/cartService';

/**
 * Роли пользователей
 */
export type UserRole = 'ROLE_USER' | 'ROLE_SELLER' | 'ROLE_MODERATOR' | 'ROLE_ADMIN';

/**
 * Состояние авторизации
 */
interface AuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Контекст авторизации
 */
interface AuthContextType extends AuthState {
  // Проверки ролей
  isAdmin: boolean;
  isModerator: boolean;
  isSeller: boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;

  // Действия
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * JWT payload type
 */
interface JwtPayload {
  roles?: string[];
  authorities?: string[];
  sub?: string;
  exp?: number;
}

/**
 * Декодировать JWT токен (без верификации - только для получения claims)
 */
function decodeToken(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

/**
 * Проверить, истёк ли токен
 */
function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  return decoded.exp * 1000 < Date.now();
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  /**
   * Загрузить информацию о пользователе
   */
  const loadUserInfo = useCallback(async () => {
    const token = tokenManager.getToken();

    if (!token || isTokenExpired(token)) {
      tokenManager.clearToken();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      return;
    }

    try {
      // Получаем информацию о пользователе с сервера
      const response = await apiClient.get<UserInfo>('/api/auth/me');
      const user = response.data;

      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      // Токен невалиден или сервер недоступен
      tokenManager.clearToken();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Ошибка авторизации',
      });
    }
  }, []);

  /**
   * Войти в систему
   */
  const login = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiClient.post<{
        accessToken: string;
        refreshToken: string;
        user: UserInfo;
      }>('/api/auth/login', { email, password });

      const { accessToken, refreshToken, user } = response.data;

      tokenManager.setToken(accessToken);
      tokenManager.setRefreshToken(refreshToken);

      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Уведомляем другие компоненты об изменении авторизации
      window.dispatchEvent(new Event('auth-change'));

      // Объединяем анонимную корзину с пользовательской
      try {
        await cartService.mergeCartsOnLogin();
        window.dispatchEvent(new CustomEvent('cart-change'));
      } catch {
        // Игнорируем ошибки merge — не критично
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Ошибка входа';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw new Error(message);
    }
  }, []);

  /**
   * Выйти из системы
   */
  const logout = useCallback(() => {
    tokenManager.clearToken();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    window.dispatchEvent(new Event('auth-change'));
  }, []);

  /**
   * Обновить состояние авторизации
   */
  const refreshAuth = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    await loadUserInfo();
  }, [loadUserInfo]);

  // Загружаем информацию о пользователе при монтировании
  useEffect(() => {
    loadUserInfo();
  }, [loadUserInfo]);

  // Слушаем события изменения авторизации (из других вкладок)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken') {
        loadUserInfo();
      }
    };

    const handleAuthChange = () => {
      loadUserInfo();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-change', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [loadUserInfo]);

  // Вычисляемые значения
  const roles = state.user?.roles || [];

  const hasRole = useCallback((role: UserRole): boolean => {
    return roles.some(r => r === role || r === role.replace('ROLE_', ''));
  }, [roles]);

  const hasAnyRole = useCallback((checkRoles: UserRole[]): boolean => {
    return checkRoles.some(role => hasRole(role));
  }, [hasRole]);

  const isAdmin = hasRole('ROLE_ADMIN');
  const isModerator = hasAnyRole(['ROLE_ADMIN', 'ROLE_MODERATOR']);
  const isSeller = hasRole('ROLE_SELLER');

  const value: AuthContextType = {
    ...state,
    isAdmin,
    isModerator,
    isSeller,
    hasRole,
    hasAnyRole,
    login,
    logout,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Хук для использования контекста авторизации
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

