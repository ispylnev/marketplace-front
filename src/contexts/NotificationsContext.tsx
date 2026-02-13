import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { notificationsService } from '../api/notificationsService';

interface NotificationsContextType {
  unreadCount: number;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshCount: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

const POLL_INTERVAL_MS = 10_000; // 10 секунд

interface NotificationsProviderProps {
  children: ReactNode;
}

export function NotificationsProvider({ children }: NotificationsProviderProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingOpsRef = useRef(0); // счётчик активных optimistic-операций

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    // Не перезаписываем optimistic update пока операция в полёте
    if (pendingOpsRef.current > 0) return;

    try {
      const count = await notificationsService.getUnreadCount();
      // Перепроверяем после await — операция могла начаться пока ждали ответ
      if (pendingOpsRef.current === 0) {
        setUnreadCount(count);
      }
    } catch {
      // Ошибка загрузки — не критично
    }
  }, [isAuthenticated]);

  const resetPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (isAuthenticated) {
      intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    }
  }, [isAuthenticated, fetchUnreadCount]);

  // Загружаем при mount и запускаем polling
  useEffect(() => {
    if (authLoading) return;

    fetchUnreadCount();

    if (isAuthenticated) {
      intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [authLoading, isAuthenticated, fetchUnreadCount]);

  // Слушаем auth-change
  useEffect(() => {
    const handleAuthChange = () => {
      if (!isAuthenticated) {
        setUnreadCount(0);
      }
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (id: number) => {
    // Оптимистичное обновление
    pendingOpsRef.current++;
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await notificationsService.markAsRead(id);
    } catch {
      // Revert при ошибке
      setUnreadCount(prev => prev + 1);
    } finally {
      pendingOpsRef.current--;
      resetPolling(); // сбрасываем таймер, чтобы следующий poll был через полные 10с
    }
  }, [resetPolling]);

  const markAllAsRead = useCallback(async () => {
    const previousCount = unreadCount;
    // Оптимистичное обновление
    pendingOpsRef.current++;
    setUnreadCount(0);

    try {
      await notificationsService.markAllAsRead();
    } catch {
      // Revert при ошибке
      setUnreadCount(previousCount);
    } finally {
      pendingOpsRef.current--;
      resetPolling();
    }
  }, [unreadCount, resetPolling]);

  const refreshCount = useCallback(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const value: NotificationsContextType = {
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshCount,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

/**
 * Хук для работы с уведомлениями.
 */
export function useNotifications(): NotificationsContextType {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
