import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface ErrorAlertProps {
  /** Error message or object from backend */
  error: string | any | null;
  /** Optional title for the error */
  title?: string;
  /** Whether to show the close button */
  closable?: boolean;
  /** Callback when error is closed */
  onClose?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Компонент для отображения ошибок от бэкенда
 * Поддерживает различные форматы ошибок:
 * - Простая строка
 * - Массив ошибок валидации Spring Boot
 * - Объект с ошибками по полям
 * - Объект с полем message
 */
export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  title = 'Ошибка',
  closable = false,
  onClose,
  className = ''
}) => {
  if (!error) return null;

  /**
   * Преобразует ошибку в массив сообщений для отображения
   */
  const parseErrorMessages = (error: any): string[] => {
    if (!error) return [];

    // Если это уже строка
    if (typeof error === 'string') {
      return [error];
    }

    // ПРИОРИТЕТ 1: Проверяем ответ от сервера (response.data.message)
    // Это самый важный источник - реальное сообщение от бэкенда
    if (error.response?.data?.message) {
      return [error.response.data.message];
    }

    // ПРИОРИТЕТ 2: Проверяем ошибки валидации от Spring Boot (response.data.errors)
    if (error.response?.data?.errors) {
      const validationErrors = error.response.data.errors;

      // Массив ошибок валидации
      if (Array.isArray(validationErrors)) {
        return validationErrors.map((e: any) =>
          e.defaultMessage || e.message || String(e)
        );
      }

      // Объект с ошибками по полям
      if (typeof validationErrors === 'object') {
        return Object.values(validationErrors).flat().map((msg: any) =>
          typeof msg === 'string' ? msg : String(msg)
        );
      }
    }

    // ПРИОРИТЕТ 3: Проверяем errors напрямую в объекте ошибки (для обратной совместимости)
    if (error.errors) {
      const validationErrors = error.errors;

      // Массив ошибок валидации
      if (Array.isArray(validationErrors)) {
        return validationErrors.map((e: any) =>
          e.defaultMessage || e.message || 'Неизвестная ошибка'
        );
      }

      // Объект с ошибками по полям
      if (typeof validationErrors === 'object') {
        return Object.values(validationErrors).flat().map((msg: any) =>
          typeof msg === 'string' ? msg : String(msg)
        );
      }
    }

    // ПРИОРИТЕТ 4: Если это объект с полем message (но не от axios)
    // Проверяем, что это НЕ стандартное сообщение axios "Request failed with status code XXX"
    if (error.message && typeof error.message === 'string') {
      // Если сообщение похоже на стандартное axios сообщение, пропускаем его
      if (!/^Request failed with status code \d+$/.test(error.message)) {
        return [error.message];
      }
    }

    // ПРИОРИТЕТ 5: Fallback - пытаемся преобразовать в строку
    try {
      return [JSON.stringify(error)];
    } catch {
      return ['Произошла неизвестная ошибка'];
    }
  };

  const errorMessages = parseErrorMessages(error);

  if (errorMessages.length === 0) return null;

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium text-red-800 mb-2">
              {title}
            </h3>
          )}
          <div className="text-sm text-red-700">
            {errorMessages.length === 1 ? (
              <p>{errorMessages[0]}</p>
            ) : (
              <ul className="list-disc pl-5 space-y-1">
                {errorMessages.map((message, index) => (
                  <li key={index}>{message}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {closable && onClose && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorAlert;
