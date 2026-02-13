import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, ChevronDown, ChevronUp, ArrowLeft, AlertCircle, X, ShoppingBag, Star } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { orderService, OrderSummaryResponse, OrderDetailResponse } from '../api/orderService';
import { makeFullSlug } from '../utils/slugUtils';

const statusLabels: Record<string, string> = {
  PENDING: 'Ожидает оплаты',
  PAID: 'Оплачен',
  PROCESSING: 'В обработке',
  SHIPPED: 'Отправлен',
  DELIVERED: 'Доставлен',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  PAID: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-yellow-100 text-yellow-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-green-200 text-green-800',
  CANCELLED: 'bg-red-100 text-red-700',
};

const ACTIVE_STATUSES = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [orderDetails, setOrderDetails] = useState<Record<number, OrderDetailResponse>>({});
  const [loadingDetail, setLoadingDetail] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelDialogOrderId, setCancelDialogOrderId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<'active' | 'all'>('active');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await orderService.getMyOrders();
      setOrders(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (orderId: number) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    if (!orderDetails[orderId]) {
      setLoadingDetail(orderId);
      try {
        const detail = await orderService.getOrder(orderId);
        setOrderDetails(prev => ({ ...prev, [orderId]: detail }));
      } catch {
        // ignore
      } finally {
        setLoadingDetail(null);
      }
    }
  };

  const handleCancelClick = (orderId: number) => {
    setCancelDialogOrderId(orderId);
  };

  const handleCancelConfirm = async () => {
    if (!cancelDialogOrderId) return;
    const orderId = cancelDialogOrderId;
    setCancelDialogOrderId(null);
    setCancellingId(orderId);
    try {
      const updated = await orderService.cancelOrder(orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: updated.status } : o));
      setOrderDetails(prev => ({ ...prev, [orderId]: updated }));
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.error || 'Не удалось отменить заказ');
    } finally {
      setCancellingId(null);
    }
  };

  const activeOrders = orders.filter(o => ACTIVE_STATUSES.includes(o.status));
  const displayedOrders = tab === 'active' ? activeOrders : orders;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2B4A39]" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 md:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-[#2D2E30]/60 hover:text-[#2D2E30] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[#2B4A39] text-xl md:text-2xl font-semibold">Мои заказы</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setTab('active')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              tab === 'active' ? 'bg-[#BCCEA9] text-[#2B4A39]' : 'text-[#2D2E30]/60 hover:text-[#2D2E30]'
            }`}
          >
            Активные
            {activeOrders.length > 0 && (
              <span className="ml-1.5 bg-[#2B4A39] text-white text-xs rounded-full px-1.5 py-0.5">
                {activeOrders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('all')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              tab === 'all' ? 'bg-[#BCCEA9] text-[#2B4A39]' : 'text-[#2D2E30]/60 hover:text-[#2D2E30]'
            }`}
          >
            Все заказы
          </button>
        </div>

        {/* Orders list */}
        {displayedOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <ShoppingBag className="w-12 h-12 text-[#2D2E30]/20 mx-auto mb-3" />
            <p className="text-[#2D2E30]/60 text-sm">
              {tab === 'active' ? 'Нет активных заказов' : 'У вас пока нет заказов'}
            </p>
            <Button
              onClick={() => navigate('/catalog')}
              className="mt-4 bg-[#BCCEA9] hover:bg-[#a8ba95] text-[#2B4A39]"
            >
              Перейти в каталог
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {displayedOrders.map(order => {
              const isExpanded = expandedOrderId === order.id;
              const detail = orderDetails[order.id];
              const isLoadingThis = loadingDetail === order.id;
              const canCancel = ['PAID', 'PENDING'].includes(order.status);

              return (
                <div key={order.id} className={`bg-white rounded-xl shadow-sm overflow-hidden border-l-[3px] transition-colors ${isExpanded ? 'border-l-[#2B4A39]' : 'border-l-transparent hover:border-l-[#BCCEA9]'}`}>
                  {/* Summary row */}
                  <button
                    onClick={() => toggleExpand(order.id)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-[#BCCEA9]/10 transition-colors text-left cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#BCCEA9]/20 flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-[#2B4A39]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[#2D2E30] font-medium text-sm truncate group-hover:text-[#2B4A39] transition-colors">{order.orderNumber}</span>
                        <span className={`rounded-full text-xs px-2 py-0.5 font-medium flex-shrink-0 ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#2D2E30]/50">
                        <span>{order.itemsCount} {order.itemsCount === 1 ? 'товар' : order.itemsCount < 5 ? 'товара' : 'товаров'}</span>
                        <span>·</span>
                        <span>{order.totalAmount} ₽</span>
                        <span>·</span>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs text-[#2D2E30]/30 group-hover:text-[#2B4A39]/60 transition-colors hidden sm:inline">
                        {isExpanded ? 'Свернуть' : 'Подробнее'}
                      </span>
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-[#2B4A39] flex-shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-[#2D2E30]/30 group-hover:text-[#2B4A39] transition-colors flex-shrink-0" />
                      }
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-4 pb-4">
                      {isLoadingThis ? (
                        <div className="py-6 flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2B4A39]" />
                        </div>
                      ) : detail ? (
                        <div className="pt-3">
                          {/* Items */}
                          <div className="flex flex-col gap-2 mb-3">
                            {detail.items.map(item => (
                              <div key={item.id} className="flex items-center gap-3">
                                <Link
                                  to={`/product/${makeFullSlug(item.productName, item.offerId)}`}
                                  className="flex items-center gap-3 flex-1 min-w-0 -m-2 p-2 rounded-lg hover:bg-[#BCCEA9]/10 transition-colors group/item"
                                >
                                  {item.productImageUrl ? (
                                    <img src={item.productImageUrl} alt={item.productName} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 group-hover/item:ring-2 group-hover/item:ring-[#BCCEA9] transition-all" />
                                  ) : (
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                      <ShoppingBag className="w-5 h-5 text-gray-300" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-[#2D2E30] truncate group-hover/item:text-[#2B4A39] transition-colors">
                                      {item.productName}
                                    </p>
                                    <p className="text-xs text-[#2D2E30]/50">{item.quantity} × {item.pricePerUnit} ₽</p>
                                  </div>
                                  <span className="text-sm font-medium text-[#2B4A39] flex-shrink-0">{item.totalPrice} ₽</span>
                                </Link>
                                {(order.status === 'COMPLETED' || order.status === 'DELIVERED') && (
                                  <Link
                                    to={`/product/${makeFullSlug(item.productName, item.offerId)}#reviews`}
                                    className="flex items-center gap-1 text-xs text-[#2B4A39] hover:text-[#1d3528] bg-[#BCCEA9]/30 hover:bg-[#BCCEA9]/50 px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0"
                                  >
                                    <Star className="w-3.5 h-3.5" />
                                    Отзыв
                                  </Link>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Delivery */}
                          {detail.deliveryPrice > 0 && (
                            <div className="flex justify-between text-xs text-[#2D2E30]/60 mb-1">
                              <span>Доставка{detail.deliveryMethodName ? ` (${detail.deliveryMethodName})` : ''}</span>
                              <span>{detail.deliveryPrice} ₽</span>
                            </div>
                          )}

                          <Separator className="my-2" />

                          <div className="flex justify-between text-sm font-bold mb-3">
                            <span className="text-[#2D2E30]">Итого</span>
                            <span className="text-[#2B4A39]">{detail.totalAmount} ₽</span>
                          </div>

                          {/* Address */}
                          {detail.deliveryAddress && (
                            <div className="text-xs text-[#2D2E30]/60 mb-3">
                              <p className="font-medium text-[#2D2E30]/80 mb-0.5">{detail.deliveryAddress.recipientName}</p>
                              <p>{[detail.deliveryAddress.city, detail.deliveryAddress.street, detail.deliveryAddress.building, detail.deliveryAddress.apartment].filter(Boolean).join(', ')}</p>
                            </div>
                          )}

                          {/* Cancellation reason */}
                          {detail.cancellationReason && (
                            <div className="bg-red-50 rounded-lg p-3 text-xs text-red-700 mb-3">
                              <strong>Причина отмены:</strong> {detail.cancellationReason}
                            </div>
                          )}

                          {/* Cancel button */}
                          {canCancel && (
                            <Button
                              onClick={() => handleCancelClick(order.id)}
                              disabled={cancellingId === order.id}
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                            >
                              <X className="w-3 h-3 mr-1" />
                              {cancellingId === order.id ? 'Отмена...' : 'Отменить заказ'}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="py-4 text-center text-sm text-[#2D2E30]/50">
                          <AlertCircle className="w-5 h-5 mx-auto mb-1 text-[#2D2E30]/30" />
                          Не удалось загрузить детали заказа
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />

      {/* Диалог подтверждения отмены */}
      <Dialog open={cancelDialogOrderId !== null} onOpenChange={(open) => { if (!open) setCancelDialogOrderId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Отменить заказ?</DialogTitle>
            <DialogDescription>
              После отмены зарезервированные товары станут доступны другим покупателям. Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCancelDialogOrderId(null)}>
              Нет, оставить
            </Button>
            <Button
              onClick={handleCancelConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Да, отменить заказ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог ошибки */}
      <Dialog open={errorMessage !== null} onOpenChange={(open) => { if (!open) setErrorMessage(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Не удалось отменить заказ</DialogTitle>
            <DialogDescription>{errorMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setErrorMessage(null)} className="bg-[#2B4A39] hover:bg-[#234135] text-white">
              Понятно
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyOrders;
