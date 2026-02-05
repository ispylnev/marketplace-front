import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { favoritesService } from '../api/favoritesService';

interface FavoritesContextType {
  favoriteIds: Set<number>;
  isFavorited: (offerId: number) => boolean;
  toggleFavorite: (offerId: number) => Promise<void>;
  favoritesCount: number;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

interface FavoritesProviderProps {
  children: ReactNode;
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  /**
   * Загрузить ID избранных офферов.
   */
  const loadFavoriteIds = useCallback(async () => {
    if (!isAuthenticated) {
      setFavoriteIds(new Set());
      return;
    }

    try {
      setLoading(true);
      const ids = await favoritesService.getFavoriteIds();
      setFavoriteIds(new Set(ids));
    } catch {
      // Ошибка загрузки — не критично
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Загружаем при mount и смене авторизации
  useEffect(() => {
    if (!authLoading) {
      loadFavoriteIds();
    }
  }, [authLoading, loadFavoriteIds]);

  // Слушаем события изменения избранного (для обновления из других компонентов)
  useEffect(() => {
    const handleFavoritesChange = () => loadFavoriteIds();
    const handleAuthChange = () => {
      // При logout очищаем, при login загружаем
      if (!isAuthenticated) {
        setFavoriteIds(new Set());
      }
    };

    window.addEventListener('favorites-change', handleFavoritesChange);
    window.addEventListener('auth-change', handleAuthChange);

    return () => {
      window.removeEventListener('favorites-change', handleFavoritesChange);
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [loadFavoriteIds, isAuthenticated]);

  const isFavorited = useCallback((offerId: number): boolean => {
    return favoriteIds.has(offerId);
  }, [favoriteIds]);

  /**
   * Переключить избранное (optimistic update).
   */
  const toggleFavorite = useCallback(async (offerId: number) => {
    if (!isAuthenticated) return;

    const wasFavorited = favoriteIds.has(offerId);

    // Optimistic update
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (wasFavorited) {
        next.delete(offerId);
      } else {
        next.add(offerId);
      }
      return next;
    });

    try {
      if (wasFavorited) {
        await favoritesService.removeFavorite(offerId);
      } else {
        await favoritesService.addFavorite(offerId);
      }
    } catch {
      // Revert при ошибке
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (wasFavorited) {
          next.add(offerId);
        } else {
          next.delete(offerId);
        }
        return next;
      });
    }
  }, [isAuthenticated, favoriteIds]);

  const value: FavoritesContextType = {
    favoriteIds,
    isFavorited,
    toggleFavorite,
    favoritesCount: favoriteIds.size,
    loading,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

/**
 * Хук для работы с избранным.
 */
export function useFavorites(): FavoritesContextType {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
