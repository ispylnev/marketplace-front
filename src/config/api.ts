/**
 * Конфигурация API
 */

// URL бекенда по умолчанию (теперь все запросы идут через vega-api на порту 8080)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Таймаут для запросов (в миллисекундах)
export const API_TIMEOUT = 10000;

// Настройки API
export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
};

