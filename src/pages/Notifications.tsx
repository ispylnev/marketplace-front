import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ChevronDown, Store, Package, CreditCard, Truck, AlertTriangle } from 'lucide-react';
import { notificationsService, NotificationItem } from '../api/notificationsService';
import { useNotifications } from '../contexts/NotificationsContext';

/**
 * Иконка по типу уведомления
 */
function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case 'SELLER_APPROVED':
    case 'SELLER_REJECTED':
    case 'SELLER_BLOCKED':
      return <Store className="w-5 h-5" />;
    case 'OFFER_APPROVED':
    case 'OFFER_REJECTED':
    case 'OFFER_DEACTIVATED':
      return <Package className="w-5 h-5" />;
    case 'REFUND_REQUESTED':
    case 'REFUND_COMPLETED':
    case 'REFUND_FAILED':
      return <CreditCard className="w-5 h-5" />;
    case 'ORDER_SHIPPED':
    case 'ORDER_DELIVERED':
      return <Truck className="w-5 h-5" />;
    default:
      return <Bell className="w-5 h-5" />;
  }
}

/**
 * Цвет фона иконки по типу
 */
function getIconBgColor(type: string): string {
  if (type.includes('APPROVED') || type.includes('COMPLETED') || type.includes('DELIVERED')) {
    return 'bg-green-100 text-green-600';
  }
  if (type.includes('REJECTED') || type.includes('BLOCKED') || type.includes('FAILED')) {
    return 'bg-red-100 text-red-600';
  }
  if (type.includes('REQUESTED') || type.includes('SHIPPED')) {
    return 'bg-blue-100 text-blue-600';
  }
  if (type.includes('DEACTIVATED')) {
    return 'bg-yellow-100 text-yellow-600';
  }
  return 'bg-gray-100 text-gray-600';
}

/**
 * Форматирование даты
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Только что';
  if (diffMin < 60) return `${diffMin} мин. назад`;
  if (diffHours < 24) return `${diffHours} ч. назад`;
  if (diffDays < 7) return `${diffDays} дн. назад`;

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

const PAGE_SIZE = 20;

export default function Notifications() {
  const navigate = useNavigate();
  const { markAsRead, markAllAsRead } = useNotifications();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadNotifications = useCallback(async (pageNum: number, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const data = await notificationsService.getNotifications(pageNum, PAGE_SIZE);

      if (append) {
        setNotifications(prev => [...prev, ...data]);
      } else {
        setNotifications(data);
      }

      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      if (!append) {
        // Extract error message for debugging
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        const axiosError = err as { response?: { status?: number; data?: unknown } };
        const status = axiosError.response?.status;
        const detail = status ? `HTTP ${status}` : errorMessage;
        console.error('Failed to load notifications:', detail, err);
        setError(detail);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications(0);
  }, [loadNotifications]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadNotifications(nextPage, true);
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.read) {
      await markAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
    }

    const link = notification.metadata?.link;
    if (link) {
      navigate(link);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const hasUnread = notifications.some(n => !n.read);

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Уведомления
          </h1>
          {hasUnread && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1 text-sm text-[#4A7C59] hover:text-[#3d6a4a] transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Отметить все как прочитанные
            </button>
          )}
        </div>

        {/* Список уведомлений */}
        {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <AlertTriangle className="w-12 h-12 text-red-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Не удалось загрузить уведомления</p>
              <p className="text-gray-400 text-sm mt-1">{error}</p>
              <button
                onClick={() => loadNotifications(0)}
                className="mt-4 px-4 py-2 text-sm text-[#4A7C59] hover:bg-[#4A7C59]/10 rounded-lg transition-colors"
              >
                Попробовать снова
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Уведомлений пока нет</p>
              <p className="text-gray-400 text-sm mt-1">
                Здесь будут появляться уведомления о статусе ваших заказов и магазина
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map(notification => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left rounded-lg p-4 transition-colors border ${
                    notification.read
                      ? 'bg-white border-gray-100 hover:bg-gray-50'
                      : 'bg-blue-50 border-blue-100 hover:bg-blue-100/70'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconBgColor(notification.type)}`}>
                      <NotificationIcon type={notification.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-sm ${notification.read ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-400">
                            {formatDate(notification.createdAt)}
                          </span>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{notification.message}</p>
                    </div>
                  </div>
                </button>
              ))}

              {/* Кнопка "Показать ещё" */}
              {hasMore && (
                <div className="text-center pt-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-1 px-4 py-2 text-sm text-[#4A7C59] hover:bg-[#4A7C59]/10 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? (
                      'Загрузка...'
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Показать ещё
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
}
