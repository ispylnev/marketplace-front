import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Состояние запроса
 */
interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isError: boolean;
}

/**
 * Опции для useFetch
 */
interface UseFetchOptions<T> {
  /**
   * Начальные данные
   */
  initialData?: T | null;
  /**
   * Выполнить запрос при монтировании
   */
  immediate?: boolean;
  /**
   * Зависимости для повторного запроса
   */
  deps?: unknown[];
  /**
   * Callback при успехе
   */
  onSuccess?: (data: T) => void;
  /**
   * Callback при ошибке
   */
  onError?: (error: string) => void;
  /**
   * Количество попыток при ошибке
   */
  retryCount?: number;
  /**
   * Задержка между попытками (мс)
   */
  retryDelay?: number;
}

/**
 * Результат useFetch
 */
interface UseFetchResult<T> extends FetchState<T> {
  /**
   * Выполнить запрос
   */
  execute: () => Promise<T | null>;
  /**
   * Повторить последний запрос
   */
  refetch: () => Promise<T | null>;
  /**
   * Сбросить состояние
   */
  reset: () => void;
  /**
   * Установить данные вручную
   */
  setData: (data: T | null) => void;
}

/**
 * Хук для выполнения асинхронных запросов
 *
 * @example
 * const { data, isLoading, error, execute } = useFetch(
 *   () => api.getProducts(),
 *   { immediate: true }
 * );
 *
 * @example
 * const { execute } = useFetch(
 *   () => api.createProduct(data),
 *   {
 *     immediate: false,
 *     onSuccess: () => toast.success('Создано!'),
 *     onError: (err) => toast.error(err)
 *   }
 * );
 */
export function useFetch<T>(
  fetcher: () => Promise<T>,
  options: UseFetchOptions<T> = {}
): UseFetchResult<T> {
  const {
    initialData = null,
    immediate = true,
    deps = [],
    onSuccess,
    onError,
    retryCount = 0,
    retryDelay = 1000,
  } = options;

  const [state, setState] = useState<FetchState<T>>({
    data: initialData,
    isLoading: immediate,
    error: null,
    isError: false,
  });

  const retriesLeft = useRef(retryCount);
  const mounted = useRef(true);

  const execute = useCallback(async (): Promise<T | null> => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      isError: false,
    }));

    try {
      const data = await fetcher();

      if (mounted.current) {
        setState({
          data,
          isLoading: false,
          error: null,
          isError: false,
        });
        onSuccess?.(data);
      }

      retriesLeft.current = retryCount;
      return data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Произошла ошибка';

      // Пробуем повторить
      if (retriesLeft.current > 0) {
        retriesLeft.current--;
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return execute();
      }

      if (mounted.current) {
        setState({
          data: null,
          isLoading: false,
          error: errorMessage,
          isError: true,
        });
        onError?.(errorMessage);
      }

      return null;
    }
  }, [fetcher, onSuccess, onError, retryCount, retryDelay]);

  const refetch = useCallback(() => {
    retriesLeft.current = retryCount;
    return execute();
  }, [execute, retryCount]);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      isLoading: false,
      error: null,
      isError: false,
    });
    retriesLeft.current = retryCount;
  }, [initialData, retryCount]);

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  // Выполняем при монтировании если immediate: true
  useEffect(() => {
    mounted.current = true;

    if (immediate) {
      execute();
    }

    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    ...state,
    execute,
    refetch,
    reset,
    setData,
  };
}

/**
 * Хук для мутаций (POST, PUT, DELETE)
 */
export function useMutation<T, P = void>(
  mutationFn: (params: P) => Promise<T>,
  options: Omit<UseFetchOptions<T>, 'immediate' | 'deps'> = {}
) {
  const [state, setState] = useState<FetchState<T>>({
    data: options.initialData || null,
    isLoading: false,
    error: null,
    isError: false,
  });

  const mutate = useCallback(
    async (params: P): Promise<T | null> => {
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        isError: false,
      }));

      try {
        const data = await mutationFn(params);
        setState({
          data,
          isLoading: false,
          error: null,
          isError: false,
        });
        options.onSuccess?.(data);
        return data;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Произошла ошибка';
        setState({
          data: null,
          isLoading: false,
          error: errorMessage,
          isError: true,
        });
        options.onError?.(errorMessage);
        return null;
      }
    },
    [mutationFn, options]
  );

  const reset = useCallback(() => {
    setState({
      data: options.initialData || null,
      isLoading: false,
      error: null,
      isError: false,
    });
  }, [options.initialData]);

  return {
    ...state,
    mutate,
    reset,
  };
}

export default useFetch;
