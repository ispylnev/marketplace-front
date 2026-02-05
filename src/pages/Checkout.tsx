import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShoppingBag, MapPin, CreditCard, ChevronLeft,
  CheckCircle, AlertTriangle, Truck, Package, Plus, Shield
} from 'lucide-react';
import Header from '../components/Header';
import { Button } from '../components/ui/button';
import {
  checkoutService,
  CheckoutResultResponse,
  DeliveryAddress,
  NewAddressRequest,
  PlaceOrderRequest,
} from '../api/checkoutService';
import { cartService, CartResponse } from '../api/cartService';

type PaymentMethod = 'CARD' | 'SBP' | 'CASH_ON_DELIVERY';

type Step = 'loading' | 'form' | 'placing' | 'success' | 'error';

const formatPrice = (price: number | undefined | null) => {
  if (price === undefined || price === null || isNaN(price)) return '0 \u20BD';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(price);
};

const Checkout = () => {
  const navigate = useNavigate();

  // State
  const [step, setStep] = useState<Step>('loading');
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<NewAddressRequest>({
    recipientName: '',
    recipientPhone: '',
    city: '',
    street: '',
    building: '',
    apartment: '',
    postalCode: '',
  });
  const [saveNewAddress, setSaveNewAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckoutResultResponse | null>(null);
  const [placing, setPlacing] = useState(false);

  // Load cart and addresses on mount (no reservation, no session)
  useEffect(() => {
    loadCheckoutData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCheckoutData = async () => {
    setStep('loading');
    setError(null);

    try {
      const [cartData, addressData] = await Promise.all([
        cartService.getCart(),
        checkoutService.getAddresses().catch(() => [] as DeliveryAddress[]),
      ]);

      if (cartData.isEmpty || cartData.sellerGroups.length === 0) {
        setError('Корзина пуста');
        setStep('error');
        return;
      }

      setCart(cartData);
      setAddresses(addressData);

      // Auto-select default address
      const defaultAddr = addressData.find((a) => a.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else if (addressData.length > 0) {
        setSelectedAddressId(addressData[0].id);
      } else {
        setShowNewAddress(true);
      }

      setStep('form');
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'Ошибка загрузки данных для оформления заказа';
      setError(msg);
      setStep('error');
    }
  };

  // Validate address
  const isAddressValid = useCallback(() => {
    if (selectedAddressId) return true;
    if (showNewAddress) {
      return (
        newAddress.recipientName.trim() !== '' &&
        newAddress.recipientPhone.trim() !== '' &&
        newAddress.city.trim() !== '' &&
        newAddress.street.trim() !== '' &&
        newAddress.building.trim() !== ''
      );
    }
    return false;
  }, [selectedAddressId, showNewAddress, newAddress]);

  // Place order
  const handlePlaceOrder = async () => {
    if (!cart || placing) return;

    setPlacing(true);
    setStep('placing');
    setError(null);

    try {
      const request: PlaceOrderRequest = {
        paymentMethod,
        comment: comment || undefined,
      };

      if (selectedAddressId) {
        request.deliveryAddressId = selectedAddressId;
      } else if (showNewAddress) {
        // Clean up empty strings to undefined so backend @Pattern validators don't fire on ""
        request.newAddress = {
          recipientName: newAddress.recipientName,
          recipientPhone: newAddress.recipientPhone.replace(/[\s()\-]/g, ''),
          city: newAddress.city,
          street: newAddress.street,
          building: newAddress.building,
          apartment: newAddress.apartment || undefined,
          postalCode: newAddress.postalCode || undefined,
        };
        request.saveNewAddress = saveNewAddress;
      }

      const res = await checkoutService.placeOrder(request);

      if (res.success) {
        setResult(res);
        setStep('success');
        // Notify cart change
        window.dispatchEvent(new CustomEvent('cart-change'));
      } else {
        setError(res.message || 'Ошибка оформления заказа');
        setStep('form');
      }
    } catch (err: any) {
      const data = err.response?.data;
      let msg = data?.message || 'Ошибка при оформлении заказа';
      // Show field-level validation errors if present
      if (data?.errors && typeof data.errors === 'object') {
        const fieldErrors = Object.values(data.errors).join('; ');
        if (fieldErrors) msg = fieldErrors;
      }
      setError(msg);
      setStep('form');
    } finally {
      setPlacing(false);
    }
  };

  // ======================== RENDER ========================

  // Loading
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2B4A39]" />
            <p className="text-gray-600">Загружаем данные...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Не удалось оформить заказ
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link to="/cart">
              <Button className="bg-[#2B4A39] hover:bg-[#1f3829]">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Вернуться в корзину
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success
  if (step === 'success' && result) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#2B4A39] mb-2">Заказ оформлен!</h1>
            <p className="text-gray-600">
              {result.orders && result.orders.length > 1
                ? `Создано ${result.orders.length} заказа на сумму ${formatPrice(result.totalPaid)}`
                : `Заказ на сумму ${formatPrice(result.totalPaid)} успешно создан`}
            </p>
          </div>

          <div className="space-y-4 max-w-lg mx-auto">
            {result.orders?.map((order) => (
              <div
                key={order.orderId}
                className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-[#2B4A39]">{order.orderNumber}</p>
                  <p className="text-sm text-gray-500">{order.sellerName}</p>
                  <p className="text-sm text-gray-500">
                    {order.itemsCount} {order.itemsCount === 1 ? 'товар' : 'товаров'} &middot;{' '}
                    {formatPrice(order.total)}
                  </p>
                </div>
                <Package className="w-8 h-8 text-[#BCCEA9]" />
              </div>
            ))}
          </div>

          <div className="text-center mt-8 space-x-4">
            <Link to="/catalog">
              <Button variant="outline">Продолжить покупки</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Placing order
  if (step === 'placing') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2B4A39]" />
            <p className="text-gray-600">Оформляем заказ...</p>
          </div>
        </div>
      </div>
    );
  }

  // Main checkout form
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/cart')} className="text-gray-500 hover:text-gray-700">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-[#2B4A39]">Оформление заказа</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left side: address + payment + items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#2B4A39]" />
                Адрес доставки
              </h2>

              {addresses.length > 0 && !showNewAddress && (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedAddressId === addr.id
                          ? 'border-[#2B4A39] bg-[#BCCEA9]/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddressId === addr.id}
                        onChange={() => {
                          setSelectedAddressId(addr.id);
                          setShowNewAddress(false);
                        }}
                        className="mt-1 accent-[#2B4A39]"
                      />
                      <div>
                        <p className="font-medium">
                          {addr.recipientName}
                          {addr.isDefault && (
                            <span className="ml-2 text-xs bg-[#BCCEA9]/30 text-[#2B4A39] px-2 py-0.5 rounded">
                              По умолчанию
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600">
                          {addr.fullAddress ||
                            [addr.city, addr.street, addr.building, addr.apartment && `кв. ${addr.apartment}`]
                              .filter(Boolean)
                              .join(', ')}
                        </p>
                        <p className="text-sm text-gray-500">{addr.recipientPhone}</p>
                      </div>
                    </label>
                  ))}

                  <button
                    onClick={() => {
                      setSelectedAddressId(null);
                      setShowNewAddress(true);
                    }}
                    className="flex items-center gap-2 text-[#2B4A39] text-sm font-medium hover:underline mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    Добавить новый адрес
                  </button>
                </div>
              )}

              {(showNewAddress || addresses.length === 0) && (
                <div className="space-y-4">
                  {addresses.length > 0 && (
                    <button
                      onClick={() => {
                        setShowNewAddress(false);
                        const def = addresses.find((a) => a.isDefault) || addresses[0];
                        if (def) setSelectedAddressId(def.id);
                      }}
                      className="text-sm text-[#2B4A39] hover:underline mb-2"
                    >
                      Выбрать из сохраненных
                    </button>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Получатель *</label>
                      <input
                        type="text"
                        value={newAddress.recipientName}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, recipientName: e.target.value })
                        }
                        placeholder="Иван Иванов"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B4A39] focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Телефон *</label>
                      <input
                        type="tel"
                        value={newAddress.recipientPhone}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, recipientPhone: e.target.value })
                        }
                        placeholder="+7 (900) 123-45-67"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B4A39] focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Город *</label>
                      <input
                        type="text"
                        value={newAddress.city}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, city: e.target.value })
                        }
                        placeholder="Москва"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B4A39] focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Улица *</label>
                      <input
                        type="text"
                        value={newAddress.street}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, street: e.target.value })
                        }
                        placeholder="ул. Ленина"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B4A39] focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Дом *</label>
                      <input
                        type="text"
                        value={newAddress.building}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, building: e.target.value })
                        }
                        placeholder="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B4A39] focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Квартира</label>
                      <input
                        type="text"
                        value={newAddress.apartment || ''}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, apartment: e.target.value })
                        }
                        placeholder="42"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B4A39] focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Индекс</label>
                      <input
                        type="text"
                        value={newAddress.postalCode || ''}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, postalCode: e.target.value })
                        }
                        placeholder="101000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B4A39] focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={saveNewAddress}
                      onChange={(e) => setSaveNewAddress(e.target.checked)}
                      className="accent-[#2B4A39]"
                    />
                    <span className="text-gray-700">Сохранить адрес для будущих заказов</span>
                  </label>
                </div>
              )}
            </div>

            {/* Payment method */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#2B4A39]" />
                Способ оплаты
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([
                  { value: 'CARD', label: 'Картой онлайн', icon: CreditCard },
                  { value: 'SBP', label: 'СБП', icon: Shield },
                  { value: 'CASH_ON_DELIVERY', label: 'При получении', icon: Package },
                ] as const).map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setPaymentMethod(m.value)}
                    className={`p-3 rounded-lg border text-left text-sm flex items-center gap-3 transition-colors ${
                      paymentMethod === m.value
                        ? 'border-[#2B4A39] bg-[#BCCEA9]/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <m.icon className={`w-5 h-5 ${paymentMethod === m.value ? 'text-[#2B4A39]' : 'text-gray-400'}`} />
                    <span className="font-medium">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Комментарий к заказу</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="Оставьте пожелания к заказу"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B4A39] focus:border-transparent outline-none resize-none"
              />
            </div>

            {/* Items grouped by seller */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#2B4A39]" />
                  Ваш заказ
                </h2>
              </div>

              {cart?.sellerGroups.map((group) => (
                <div key={group.sellerId} className="border-b last:border-b-0">
                  <div className="px-6 py-3 bg-gray-50 flex items-center justify-between">
                    <span className="font-medium text-[#2D2E30]">{group.sellerName}</span>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Truck className="w-4 h-4" />
                      <span>{group.selectedDelivery?.name || 'Доставка'}</span>
                      {group.deliveryPrice > 0 && (
                        <span className="text-[#2B4A39] font-medium">
                          {formatPrice(group.deliveryPrice)}
                        </span>
                      )}
                      {group.deliveryPrice === 0 && (
                        <span className="text-green-600 font-medium">Бесплатно</span>
                      )}
                    </div>
                  </div>

                  <div className="divide-y">
                    {group.items.map((item) => (
                      <div key={item.offerId} className="px-6 py-3 flex items-center gap-4">
                        <div className="w-14 h-14 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <ShoppingBag className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{item.productName}</p>
                          <p className="text-xs text-gray-500">
                            {formatPrice(item.currentPrice)} x {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold text-[#2B4A39] whitespace-nowrap">
                          {formatPrice(item.subtotal)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side: summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Итого</h2>

              {cart && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Товары ({cart.summary.totalItems})</span>
                    <span>{formatPrice(cart.summary.itemsPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Доставка</span>
                    <span>
                      {cart.summary.deliveryPrice > 0
                        ? formatPrice(cart.summary.deliveryPrice)
                        : 'Бесплатно'}
                    </span>
                  </div>
                  {cart.summary.sellersCount > 1 && (
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Заказов</span>
                      <span>{cart.summary.sellersCount}</span>
                    </div>
                  )}
                  <div className="border-t pt-3 flex justify-between text-lg font-semibold">
                    <span>К оплате</span>
                    <span className="text-[#2B4A39]">{formatPrice(cart.summary.totalPrice)}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={handlePlaceOrder}
                disabled={!isAddressValid() || placing}
                className="w-full mt-6 bg-[#2B4A39] hover:bg-[#1f3829] disabled:bg-gray-300"
              >
                {placing ? 'Оформляем...' : 'Оформить заказ'}
              </Button>

              {!isAddressValid() && (
                <p className="text-sm text-orange-600 mt-3 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Укажите адрес доставки
                </p>
              )}

              <p className="text-xs text-gray-500 mt-3 text-center">
                Нажимая "Оформить заказ", вы подтверждаете заказ и соглашаетесь с условиями покупки
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
