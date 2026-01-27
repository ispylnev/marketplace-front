import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, AlertTriangle, Truck, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import { Button } from '../components/ui/button';
import { cartService, CartResponse, CartItem, SellerGroup, DeliveryOption } from '../api/cartService';

const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const data = await cartService.getCart();
      setCart(data);
    } catch (error) {
      console.error('Ошибка загрузки корзины:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (offerId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    setUpdating(offerId);
    try {
      const updatedCart = await cartService.updateQuantity(offerId, newQuantity);
      setCart(updatedCart);
    } catch (error: any) {
      if (error.response?.data?.code === 'INSUFFICIENT_STOCK') {
        alert(`Недостаточно товара. Доступно: ${error.response.data.available}`);
      }
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveItem = async (offerId: number) => {
    setUpdating(offerId);
    try {
      const updatedCart = await cartService.removeItem(offerId);
      setCart(updatedCart);
    } catch (error) {
      console.error('Ошибка удаления:', error);
    } finally {
      setUpdating(null);
    }
  };

  const handleSelectDelivery = async (sellerId: number, deliveryCode: string) => {
    try {
      const updatedCart = await cartService.selectDelivery(sellerId, deliveryCode);
      setCart(updatedCart);
    } catch (error) {
      console.error('Ошибка выбора доставки:', error);
    }
  };

  const handleCheckout = () => {
    if (cart?.isReadyForCheckout) {
      navigate('/checkout');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2B4A39]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.isEmpty) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-600 mb-2">Корзина пуста</h2>
            <p className="text-gray-500 mb-6">Добавьте товары из каталога</p>
            <Link to="/catalog">
              <Button className="bg-[#2B4A39] hover:bg-[#1f3829]">
                Перейти в каталог
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[#2B4A39] mb-6">
          Корзина ({cart.summary.itemsCount} {cart.summary.itemsCount === 1 ? 'товар' : 'товаров'})
        </h1>

        {cart.hasProblematicItems && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-800 font-medium">Некоторые товары требуют внимания</p>
              <p className="text-yellow-700 text-sm">Проверьте наличие и цены товаров перед оформлением</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Товары по продавцам */}
          <div className="lg:col-span-2 space-y-6">
            {cart.sellerGroups.map((group: SellerGroup) => (
              <div key={group.sellerId} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Шапка продавца */}
                <div className="bg-[#F8F9FA] px-4 py-3 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {group.sellerLogo ? (
                      <img src={group.sellerLogo} alt="" className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#BCCEA9] flex items-center justify-center text-[#2B4A39] font-semibold">
                        {group.sellerName.charAt(0)}
                      </div>
                    )}
                    <span className="font-medium text-[#2D2E30]">{group.sellerName}</span>
                  </div>
                  <span className="text-sm text-gray-500">{group.itemsCount} товаров</span>
                </div>

                {/* Товары */}
                <div className="divide-y">
                  {group.items.map((item: CartItem) => (
                    <div key={item.offerId} className={`p-4 ${!item.isAvailable ? 'bg-red-50' : ''}`}>
                      <div className="flex gap-4">
                        {/* Изображение */}
                        <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <ShoppingBag className="w-8 h-8" />
                            </div>
                          )}
                        </div>

                        {/* Информация */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-[#2D2E30] line-clamp-2">{item.productName}</h3>

                          {item.warningMessage && (
                            <p className="text-sm text-orange-600 mt-1 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {item.warningMessage}
                            </p>
                          )}

                          {!item.isAvailable && (
                            <p className="text-sm text-red-600 mt-1">Товар недоступен</p>
                          )}

                          <div className="flex items-center justify-between mt-3">
                            {/* Количество */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleQuantityChange(item.offerId, item.quantity - 1)}
                                disabled={updating === item.offerId || item.quantity <= 1}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <button
                                onClick={() => handleQuantityChange(item.offerId, item.quantity + 1)}
                                disabled={updating === item.offerId}
                                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Цена */}
                            <div className="text-right">
                              <p className="font-semibold text-[#2B4A39]">{formatPrice(item.subtotal)}</p>
                              {item.priceChanged && (
                                <p className="text-xs text-gray-500 line-through">{formatPrice(item.priceSnapshot * item.quantity)}</p>
                              )}
                            </div>

                            {/* Удалить */}
                            <button
                              onClick={() => handleRemoveItem(item.offerId)}
                              disabled={updating === item.offerId}
                              className="text-gray-400 hover:text-red-500 p-2"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Доставка */}
                <div className="px-4 py-3 bg-gray-50 border-t">
                  <div className="flex items-center gap-2 mb-3">
                    <Truck className="w-4 h-4 text-[#2B4A39]" />
                    <span className="text-sm font-medium">Способ доставки</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {group.deliveryOptions.map((option: DeliveryOption) => (
                      <button
                        key={option.code}
                        onClick={() => handleSelectDelivery(group.sellerId, option.code)}
                        disabled={!option.isAvailable}
                        className={`p-3 rounded-lg border text-left text-sm transition-all ${
                          group.selectedDeliveryCode === option.code
                            ? 'border-[#2B4A39] bg-[#BCCEA9]/20'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${!option.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <p className="font-medium">{option.name}</p>
                        <p className="text-gray-500 text-xs">{option.deliveryTimeText || `${option.minDays}-${option.maxDays} дней`}</p>
                        <p className="text-[#2B4A39] font-medium mt-1">
                          {option.isFree ? 'Бесплатно' : option.priceText || formatPrice(option.minPrice || 0)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Итого по продавцу */}
                <div className="px-4 py-3 border-t flex justify-between items-center">
                  <span className="text-gray-600">Итого от продавца:</span>
                  <span className="font-semibold text-lg">{formatPrice(group.total)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Итого */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Итого</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Товары ({cart.summary.itemsCount})</span>
                  <span>{formatPrice(cart.summary.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Доставка</span>
                  <span>{cart.summary.deliveryTotal > 0 ? formatPrice(cart.summary.deliveryTotal) : 'Выберите'}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-semibold">
                  <span>К оплате</span>
                  <span className="text-[#2B4A39]">{formatPrice(cart.summary.total)}</span>
                </div>
              </div>

              {!cart.allDeliveriesSelected && (
                <p className="text-sm text-orange-600 mt-4 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Выберите способ доставки для всех продавцов
                </p>
              )}

              <Button
                onClick={handleCheckout}
                disabled={!cart.isReadyForCheckout}
                className="w-full mt-6 bg-[#2B4A39] hover:bg-[#1f3829] disabled:bg-gray-300"
              >
                Оформить заказ
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>

              <p className="text-xs text-gray-500 mt-3 text-center">
                Нажимая «Оформить заказ», вы соглашаетесь с условиями покупки
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
