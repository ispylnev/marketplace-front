import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Package, TrendingUp, Settings, Check, X, Eye, Edit, 
  Trash2, Plus, Search, LogOut, DollarSign, Users, AlertCircle,
  Clock, Truck, MapPin
} from "lucide-react";
import Header from "../components/Header";
import { Separator } from "../components/ui/separator";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import api, { tokenManager } from '../api/client';

// Типы данных
interface Offer {
  id: number;
  productName: string;
  latinName?: string;
  imageUrl?: string;
  price: number;
  stock: number;
  status: "active" | "pending" | "rejected" | "draft";
  views: number;
  sales: number;
  createdAt: string;
}

interface PopularProduct {
  id: number;
  name: string;
  imageUrl: string;
  soldCount: number;
}

interface Order {
  id: number;
  orderNumber: string;
  customer: string;
  customerEmail: string;
  customerPhone: string;
  products: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  status: "new" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "paid" | "pending" | "refunded";
  createdAt: string;
  shippingAddress: string;
}

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalOffers: number;
  averageRating: number;
  newOrders: number;
  pendingOffers: number;
  totalViews: number;
  conversionRate: number;
  popularProducts: PopularProduct[];
}

interface ShopSettings {
  name: string;
  description: string;
  email: string;
  phone: string;
  address: string;
}

const SellerAdmin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState<"offers" | "orders" | "stats" | "settings">("offers");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalOffers: 0,
    averageRating: 4.8,
    newOrders: 0,
    pendingOffers: 0,
    totalViews: 0,
    conversionRate: 0,
    popularProducts: []
  });
  
  const [shopSettings, setShopSettings] = useState<ShopSettings>({
    name: "",
    description: "",
    email: "",
    phone: "",
    address: ""
  });
  
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isAddingOffer, setIsAddingOffer] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // ВРЕМЕННО: моковые данные для верстки
      // TODO: заменить на реальные API вызовы
      setTimeout(() => {
        setOffers([
          {
            id: 1,
            productName: "Флокс метельчатый 'Розовый закат'",
            latinName: "Phlox paniculata",
            imageUrl: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=200&h=200&fit=crop",
            price: 380,
            stock: 15,
            status: "active",
            views: 245,
            sales: 18,
            createdAt: "2025-01-10"
          },
          {
            id: 2,
            productName: "Ирис бородатый 'Purple Dream'",
            latinName: "Iris germanica",
            imageUrl: "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=200&h=200&fit=crop",
            price: 450,
            stock: 8,
            status: "active",
            views: 189,
            sales: 12,
            createdAt: "2025-01-08"
          },
          {
            id: 3,
            productName: "Хоста 'Зеленый каскад'",
            latinName: "Hosta",
            imageUrl: "https://images.unsplash.com/photo-1598912887792-8c8c8c8c8c8c?w=200&h=200&fit=crop",
            price: 520,
            stock: 22,
            status: "pending",
            views: 134,
            sales: 9,
            createdAt: "2025-01-11"
          }
        ]);

        setOrders([
          {
            id: 1,
            orderNumber: "ORD-2025-001234",
            customer: "Анна Петрова",
            customerEmail: "anna.petrova@email.com",
            customerPhone: "+7 (925) 123-45-67",
            products: [
              { name: "Флокс метельчатый 'Розовый закат'", quantity: 2, price: 380 },
              { name: "Ирис бородатый 'Purple Dream'", quantity: 1, price: 450 }
            ],
            totalAmount: 1210,
            status: "new",
            paymentStatus: "paid",
            createdAt: "2025-01-11 14:30",
            shippingAddress: "г. Москва, ул. Садовая, д. 15, кв. 42"
          }
        ]);

        setStats({
          totalRevenue: 45680,
          totalOrders: 78,
          totalOffers: 6,
          averageRating: 4.8,
          newOrders: 2,
          pendingOffers: 1,
          totalViews: 1323,
          conversionRate: 5.9,
          popularProducts: [
            { id: 1, name: "Лилейник 'Огненный шар'", imageUrl: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=100&h=100&fit=crop", soldCount: 24 },
            { id: 2, name: "Флокс метельчатый 'Розовый закат'", imageUrl: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=100&h=100&fit=crop", soldCount: 18 },
            { id: 3, name: "Ирис бородатый 'Purple Dream'", imageUrl: "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=100&h=100&fit=crop", soldCount: 12 },
            { id: 4, name: "Хоста 'Зеленый каскад'", imageUrl: "https://images.unsplash.com/photo-1598912887792-8c8c8c8c8c8c?w=100&h=100&fit=crop", soldCount: 9 }
          ]
        });

        setShopSettings({
          name: "Питомник Ситцевый Сад",
          description: "Профессиональный питомник многолетних растений с 15-летним опытом. Предлагаем качественные саженцы с гарантией приживаемости.",
          email: "info@sitcevysad.ru",
          phone: "+7 (495) 123-45-67",
          address: "Московская обл., г. Подольск, ул. Садовая, д. 10"
        });

        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    tokenManager.clearToken();
    window.dispatchEvent(new Event('auth-change'));
    navigate('/');
  };

  const updateOfferStatus = (id: number, status: Offer["status"]) => {
    setOffers(offers.map(o => o.id === id ? { ...o, status } : o));
  };

  const updateOrderStatus = (id: number, status: Order["status"]) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
  };

  const deleteOffer = (id: number) => {
    setOffers(offers.filter(o => o.id !== id));
  };

  const updateOfferStock = (id: number, newStock: number) => {
    setOffers(offers.map(o => 
      o.id === id 
        ? { ...o, stock: newStock } 
        : o
    ));
  };

  const filteredOffers = offers.filter(o => {
    if (filterStatus !== "all" && o.status !== filterStatus) return false;
    if (searchQuery && !o.productName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredOrders = orders.filter(o => {
    if (filterStatus !== "all" && o.status !== filterStatus) return false;
    if (searchQuery && !o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !o.customer.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const newOrdersCount = orders.filter(o => o.status === "new").length;
  const pendingOffersCount = offers.filter(o => o.status === "pending").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2B4A39] mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      
      <div className="mx-auto px-4 py-4 md:px-6 md:py-6 lg:px-12 lg:py-8">
        {/* Заголовок */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-[#2B4A39] text-2xl md:text-3xl lg:text-4xl mb-2">
            Панель продавца
          </h1>
          <p className="text-[#2D2E30]/70 text-sm md:text-base">
            Управление вашим магазином растений
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* Боковое меню навигации */}
          <div className="lg:w-64 lg:flex-shrink-0">
            <div className="bg-white shadow-md lg:sticky rounded-xl p-4 md:p-6 lg:top-8">
              <h2 className="text-[#2B4A39] font-semibold mb-4 text-base md:text-lg">
                Разделы
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 md:gap-3">
                <button
                  onClick={() => {
                    setCurrentSection("offers");
                    setSearchQuery("");
                    setFilterStatus("all");
                  }}
                  className={`flex flex-col lg:flex-row items-center lg:items-center justify-center lg:justify-start transition-colors px-3 py-3 md:px-4 md:py-3 rounded-lg text-sm md:text-base ${
                    currentSection === "offers"
                      ? "bg-[#BCCEA9] text-[#2B4A39]"
                      : "hover:bg-[#F8F9FA] text-[#2D2E30]"
                  }`}
                >
                  <ShoppingBag className="w-6 h-6 lg:w-5 lg:h-5 flex-shrink-0 mb-1 lg:mb-0 lg:mr-3" />
                  <span className="text-center lg:text-left lg:flex-1 text-xs lg:text-base">Товары</span>
                  {pendingOffersCount > 0 && (
                    <span className="bg-[#2B4A39] text-white rounded-full text-xs px-2 py-0.5 mt-1 lg:mt-0 lg:ml-2">
                      {pendingOffersCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setCurrentSection("orders");
                    setSearchQuery("");
                    setFilterStatus("all");
                  }}
                  className={`flex flex-col lg:flex-row items-center lg:items-center justify-center lg:justify-start transition-colors px-3 py-3 md:px-4 md:py-3 rounded-lg text-sm md:text-base ${
                    currentSection === "orders"
                      ? "bg-[#BCCEA9] text-[#2B4A39]"
                      : "hover:bg-[#F8F9FA] text-[#2D2E30]"
                  }`}
                >
                  <Package className="w-6 h-6 lg:w-5 lg:h-5 flex-shrink-0 mb-1 lg:mb-0 lg:mr-3" />
                  <span className="text-center lg:text-left lg:flex-1 text-xs lg:text-base">Заказы</span>
                  {newOrdersCount > 0 && (
                    <span className="bg-[#2B4A39] text-white rounded-full text-xs px-2 py-0.5 mt-1 lg:mt-0 lg:ml-2">
                      {newOrdersCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setCurrentSection("stats");
                    setSearchQuery("");
                    setFilterStatus("all");
                  }}
                  className={`flex flex-col lg:flex-row items-center lg:items-center justify-center lg:justify-start transition-colors px-3 py-3 md:px-4 md:py-3 rounded-lg text-sm md:text-base ${
                    currentSection === "stats"
                      ? "bg-[#BCCEA9] text-[#2B4A39]"
                      : "hover:bg-[#F8F9FA] text-[#2D2E30]"
                  }`}
                >
                  <TrendingUp className="w-6 h-6 lg:w-5 lg:h-5 flex-shrink-0 mb-1 lg:mb-0 lg:mr-3" />
                  <span className="text-center lg:text-left lg:flex-1 text-xs lg:text-base">Статистика</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection("settings");
                    setSearchQuery("");
                    setFilterStatus("all");
                  }}
                  className={`flex flex-col lg:flex-row items-center lg:items-center justify-center lg:justify-start transition-colors px-3 py-3 md:px-4 md:py-3 rounded-lg text-sm md:text-base ${
                    currentSection === "settings"
                      ? "bg-[#BCCEA9] text-[#2B4A39]"
                      : "hover:bg-[#F8F9FA] text-[#2D2E30]"
                  }`}
                >
                  <Settings className="w-6 h-6 lg:w-5 lg:h-5 flex-shrink-0 mb-1 lg:mb-0 lg:mr-3" />
                  <span className="text-center lg:text-left lg:flex-1 text-xs lg:text-base">Настройки</span>
                </button>
              </div>

              <Separator className="bg-[#2D2E30]/10 my-4 md:my-6 hidden lg:block" />

              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 gap-2 px-3 py-2 md:px-4 md:py-3 text-sm md:text-base hidden lg:flex"
              >
                <LogOut className="w-5 h-5" />
                Выход
              </Button>
            </div>
          </div>

          {/* Основной контент */}
          <div className="flex-1">
            {/* МОИ ТОВАРЫ (ОФФЕРЫ) */}
            {currentSection === "offers" && (
              <div>
                <div className="bg-white shadow-md rounded-xl p-4 md:p-6 mb-4 md:mb-6">
                  <div className="flex flex-col gap-4 md:gap-6 mb-4 md:mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <h2 className="text-[#2B4A39] font-semibold text-xl md:text-2xl">
                        Мои товары
                      </h2>
                      <Button
                        onClick={() => setIsAddingOffer(true)}
                        className="bg-[#BCCEA9] hover:bg-[#a8ba95] text-[#2B4A39] flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="hidden sm:inline">Добавить товар</span>
                        <span className="sm:hidden">Добавить</span>
                      </Button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute text-[#2D2E30]/50 left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5" />
                        <Input
                          type="text"
                          placeholder="Поиск..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="border border-[#2D2E30]/20 focus:outline-none focus:border-[#BCCEA9] px-3 py-2 md:py-3 text-sm md:text-base rounded-lg"
                      >
                        <option value="all">Все статусы</option>
                        <option value="active">Активные</option>
                        <option value="pending">На модерации</option>
                        <option value="draft">Черновики</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 md:gap-4">
                    {filteredOffers.map(offer => (
                      <div key={offer.id} className="border border-[#2D2E30]/10 hover:border-[#BCCEA9] transition-colors rounded-lg md:rounded-xl p-3 md:p-4 lg:p-5">
                        <div className="flex flex-row gap-3 md:gap-4">
                          {/* Изображение товара */}
                          <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                            {offer.imageUrl ? (
                              <img 
                                src={offer.imageUrl} 
                                alt={offer.productName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <ShoppingBag className="w-8 h-8" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 md:gap-3 mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-[#2D2E30] font-semibold text-sm md:text-base lg:text-lg mb-0.5 truncate">
                                  {offer.productName}
                                </h3>
                                {offer.latinName && (
                                  <p className="text-[#2D2E30]/50 text-xs md:text-sm italic">
                                    {offer.latinName}
                                  </p>
                                )}
                              </div>
                              <span className={`shrink-0 rounded-full font-semibold text-xs px-2 py-1 md:px-3 md:py-1 ${
                                offer.status === "active" ? "bg-green-100 text-green-800" :
                                offer.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                "bg-gray-100 text-gray-800"
                              }`}>
                                {offer.status === "active" ? "Активен" :
                                 offer.status === "pending" ? "Модерация" : "Черновик"}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between mb-2 md:mb-3">
                              <span className="text-[#2B4A39] font-bold text-base md:text-lg lg:text-xl">
                                {offer.price} ₽
                              </span>
                              <div className="flex text-[#2D2E30]/60 gap-3 md:gap-4 text-xs md:text-sm">
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3.5 h-3.5" /> {offer.views}
                                </span>
                                <span className="flex items-center gap-1">
                                  <ShoppingBag className="w-3.5 h-3.5" /> {offer.sales}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                              <span className="text-[#2D2E30]/70 text-xs md:text-sm">Склад:</span>
                              <div className="flex items-center border border-[#2D2E30]/20 rounded overflow-hidden">
                                <button
                                  onClick={() => updateOfferStock(offer.id, Math.max(0, offer.stock - 1))}
                                  className="px-2 py-1 hover:bg-gray-100 text-[#2D2E30]/70 transition-colors"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  value={offer.stock}
                                  onChange={(e) => updateOfferStock(offer.id, Math.max(0, parseInt(e.target.value) || 0))}
                                  className="text-center font-semibold focus:outline-none w-12 px-1 py-1 text-xs md:text-sm"
                                />
                                <button
                                  onClick={() => updateOfferStock(offer.id, offer.stock + 1)}
                                  className="px-2 py-1 hover:bg-gray-100 text-[#2D2E30]/70 transition-colors"
                                >
                                  +
                                </button>
                              </div>
                              <span className={`font-semibold text-xs md:text-sm ${offer.stock > 0 ? "text-green-600" : "text-red-600"}`}>
                                {offer.stock > 0 ? "В наличии" : "Нет"}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5 md:gap-2">
                              <Button
                                onClick={() => setSelectedOffer(offer)}
                                size="sm"
                                variant="ghost"
                                className="text-[#2B4A39] text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                              >
                                <Edit className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                                Редактировать
                              </Button>
                              {offer.status === "active" && (
                                <Button
                                  onClick={() => updateOfferStatus(offer.id, "draft")}
                                  size="sm"
                                  variant="ghost"
                                  className="text-[#2D2E30]/70 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                                >
                                  <X className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                                  Снять
                                </Button>
                              )}
                              {offer.status === "draft" && (
                                <Button
                                  onClick={() => updateOfferStatus(offer.id, "active")}
                                  size="sm"
                                  className="bg-[#BCCEA9] hover:bg-[#a8ba95] text-[#2B4A39] text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                                >
                                  <Check className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                                  Опубликовать
                                </Button>
                              )}
                              <Button
                                onClick={() => deleteOffer(offer.id)}
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                              >
                                <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                                Удалить
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredOffers.length === 0 && (
                    <div className="text-center py-8 md:py-12">
                      <AlertCircle className="text-[#2D2E30]/30 mx-auto w-12 h-12 md:w-16 md:h-16 mb-3 md:mb-4" />
                      <p className="text-[#2D2E30]/70 text-sm md:text-base">
                        Товары не найдены
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ЗАКАЗЫ */}
            {currentSection === "orders" && (
              <div>
                <div className="bg-white shadow-md rounded-xl p-4 md:p-6">
                  <div className="flex flex-col gap-4 md:gap-6 mb-4 md:mb-6">
                    <h2 className="text-[#2B4A39] font-semibold text-xl md:text-2xl">
                      Заказы
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute text-[#2D2E30]/50 left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5" />
                        <Input
                          type="text"
                          placeholder="Поиск..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="border border-[#2D2E30]/20 focus:outline-none focus:border-[#BCCEA9] px-3 py-2 md:py-3 text-sm md:text-base rounded-lg"
                      >
                        <option value="all">Все статусы</option>
                        <option value="new">Новые</option>
                        <option value="processing">В обработке</option>
                        <option value="shipped">Отправлено</option>
                        <option value="delivered">Доставлено</option>
                        <option value="cancelled">Отменено</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 md:gap-5">
                    {filteredOrders.map(order => (
                      <div key={order.id} className="border border-[#2D2E30]/10 hover:border-[#BCCEA9] transition-colors rounded-lg md:rounded-xl p-3 md:p-5">
                        <div className="mb-3 md:mb-4">
                          <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                            <h3 className="text-[#2D2E30] font-semibold flex-1 text-sm md:text-base lg:text-lg">
                              {order.orderNumber}
                            </h3>
                            <span className={`self-start rounded-full font-semibold text-xs px-2 py-1 md:px-3 md:py-1 ${
                              order.status === "new" ? "bg-blue-100 text-blue-800" :
                              order.status === "processing" ? "bg-yellow-100 text-yellow-800" :
                              order.status === "shipped" ? "bg-purple-100 text-purple-800" :
                              order.status === "delivered" ? "bg-green-100 text-green-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {order.status === "new" ? "Новый" :
                               order.status === "processing" ? "В обработке" :
                               order.status === "shipped" ? "Отправлен" :
                               order.status === "delivered" ? "Доставлен" : "Отменен"}
                            </span>
                          </div>
                          
                          <div className="text-[#2D2E30]/70 text-xs md:text-sm mb-3 md:mb-4 flex flex-col gap-1 md:gap-1.5">
                            <p className="font-semibold text-[#2D2E30]">{order.customer}</p>
                            <p>📧 {order.customerEmail}</p>
                            <p>📱 {order.customerPhone}</p>
                            <p>📍 {order.shippingAddress}</p>
                            <p>📅 {order.createdAt}</p>
                          </div>

                          <div className="bg-[#F8F9FA] rounded-lg p-3 md:p-4 mb-3 md:mb-4">
                            <p className="text-[#2D2E30]/70 font-semibold text-xs md:text-sm mb-2 md:mb-3">Товары:</p>
                            {order.products.map((product, idx) => (
                              <div key={idx} className="flex justify-between text-xs md:text-sm mb-1.5">
                                <span className="text-[#2D2E30]">{product.name} × {product.quantity}</span>
                                <span className="text-[#2B4A39] font-semibold">{product.price * product.quantity} ₽</span>
                              </div>
                            ))}
                            <Separator className="bg-[#2D2E30]/10 my-2 md:my-3" />
                            <div className="flex justify-between font-bold text-sm md:text-base lg:text-lg">
                              <span className="text-[#2D2E30]">Итого:</span>
                              <span className="text-[#2B4A39]">{order.totalAmount} ₽</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {order.status === "new" && (
                            <Button
                              onClick={() => updateOrderStatus(order.id, "processing")}
                              size="sm"
                              className="bg-[#BCCEA9] hover:bg-[#a8ba95] text-[#2B4A39] text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                            >
                              <Check className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                              Принять
                            </Button>
                          )}
                          {order.status === "processing" && (
                            <Button
                              onClick={() => updateOrderStatus(order.id, "shipped")}
                              size="sm"
                              className="bg-[#BCCEA9] hover:bg-[#a8ba95] text-[#2B4A39] text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                            >
                              <Package className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                              Отправить
                            </Button>
                          )}
                          {order.status === "shipped" && (
                            <Button
                              onClick={() => updateOrderStatus(order.id, "delivered")}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                            >
                              <Check className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                              Доставлено
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredOrders.length === 0 && (
                    <div className="text-center py-8 md:py-12">
                      <AlertCircle className="text-[#2D2E30]/30 mx-auto w-12 h-12 md:w-16 md:h-16 mb-3 md:mb-4" />
                      <p className="text-[#2D2E30]/70 text-sm md:text-base">
                        Заказы не найдены
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* СТАТИСТИКА */}
            {currentSection === "stats" && (
              <div>
                <div className="bg-white shadow-md rounded-xl p-4 md:p-6 mb-4 md:mb-6">
                  <h2 className="text-[#2B4A39] font-semibold text-xl md:text-2xl mb-4 md:mb-6">
                    Статистика
                  </h2>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5 mb-4 md:mb-6">
                    <div className="bg-gradient-to-br from-[#BCCEA9]/20 to-[#BCCEA9]/5 rounded-lg md:rounded-xl p-3 md:p-4 lg:p-5">
                      <div className="flex items-center gap-2 md:gap-3 lg:gap-4 mb-2 md:mb-3">
                        <div className="bg-[#2B4A39] flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg">
                          <DollarSign className="text-white w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div>
                          <p className="text-[#2D2E30]/70 text-xs md:text-sm">Общий доход</p>
                          <p className="text-[#2B4A39] font-bold text-sm md:text-base lg:text-lg">{stats.totalRevenue.toLocaleString()} ₽</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#BCCEA9]/20 to-[#BCCEA9]/5 rounded-lg md:rounded-xl p-3 md:p-4 lg:p-5">
                      <div className="flex items-center gap-2 md:gap-3 lg:gap-4 mb-2 md:mb-3">
                        <div className="bg-[#2B4A39] flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg">
                          <Package className="text-white w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div>
                          <p className="text-[#2D2E30]/70 text-xs md:text-sm">Всего заказов</p>
                          <p className="text-[#2B4A39] font-bold text-sm md:text-base lg:text-lg">{stats.totalOrders}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#BCCEA9]/20 to-[#BCCEA9]/5 rounded-lg md:rounded-xl p-3 md:p-4 lg:p-5">
                      <div className="flex items-center gap-2 md:gap-3 lg:gap-4 mb-2 md:mb-3">
                        <div className="bg-[#2B4A39] flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg">
                          <ShoppingBag className="text-white w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div>
                          <p className="text-[#2D2E30]/70 text-xs md:text-sm">Товаров</p>
                          <p className="text-[#2B4A39] font-bold text-sm md:text-base lg:text-lg">{stats.totalOffers}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#BCCEA9]/20 to-[#BCCEA9]/5 rounded-lg md:rounded-xl p-3 md:p-4 lg:p-5">
                      <div className="flex items-center gap-2 md:gap-3 lg:gap-4 mb-2 md:mb-3">
                        <div className="bg-[#2B4A39] flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg">
                          <Users className="text-white w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div>
                          <p className="text-[#2D2E30]/70 text-xs md:text-sm">Рейтинг</p>
                          <p className="text-[#2B4A39] font-bold text-sm md:text-base lg:text-lg">{stats.averageRating} ⭐</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
                    <div className="border border-[#2D2E30]/10 rounded-lg md:rounded-xl p-3 md:p-4 lg:p-5">
                      <h3 className="text-[#2D2E30] font-semibold mb-3 md:mb-4 text-base md:text-lg">Активность</h3>
                      <div className="flex flex-col gap-2 md:gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[#2D2E30]/70 text-xs md:text-sm">Новые заказы</span>
                          <span className="text-[#2B4A39] font-semibold text-sm md:text-base">{stats.newOrders}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#2D2E30]/70 text-xs md:text-sm">На модерации</span>
                          <span className="text-[#2B4A39] font-semibold text-sm md:text-base">{stats.pendingOffers}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#2D2E30]/70 text-xs md:text-sm">Просмотров</span>
                          <span className="text-[#2B4A39] font-semibold text-sm md:text-base">{stats.totalViews}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#2D2E30]/70 text-xs md:text-sm">Конверсия</span>
                          <span className="text-[#2B4A39] font-semibold text-sm md:text-base">{stats.conversionRate}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="border border-[#2D2E30]/10 rounded-lg md:rounded-xl p-3 md:p-4 lg:p-5">
                      <h3 className="text-[#2D2E30] font-semibold mb-3 md:mb-4 text-base md:text-lg">Популярные товары</h3>
                      <div className="flex flex-col gap-2 md:gap-3">
                        {stats.popularProducts.map((product) => (
                          <div key={product.id} className="flex items-center gap-3">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              <img 
                                src={product.imageUrl} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[#2D2E30] text-xs md:text-sm font-medium truncate">
                                {product.name}
                              </p>
                              <p className="text-[#2D2E30]/60 text-xs">
                                Продано: {product.soldCount}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* НАСТРОЙКИ */}
            {currentSection === "settings" && (
              <div>
                <div className="bg-white shadow-md rounded-xl p-4 md:p-6">
                  <h2 className="text-[#2B4A39] font-semibold text-xl md:text-2xl mb-4 md:mb-6">
                    Настройки магазина
                  </h2>

                  <div className="flex flex-col gap-4 md:gap-6">
                    <div>
                      <Label className="text-[#2B4A39] block mb-2 md:mb-3 text-sm md:text-base">
                        Название магазина
                      </Label>
                      <Input
                        type="text"
                        value={shopSettings.name}
                        onChange={(e) => setShopSettings({...shopSettings, name: e.target.value})}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label className="text-[#2B4A39] block mb-2 md:mb-3 text-sm md:text-base">
                        Описание магазина
                      </Label>
                      <textarea
                        rows={4}
                        value={shopSettings.description}
                        onChange={(e) => setShopSettings({...shopSettings, description: e.target.value})}
                        className="w-full border border-[#2D2E30]/20 focus:outline-none focus:border-[#BCCEA9] px-3 py-2 md:px-4 md:py-3 text-sm md:text-base rounded-lg resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                      <div>
                        <Label className="text-[#2B4A39] block mb-2 md:mb-3 text-sm md:text-base">
                          Email
                        </Label>
                        <Input
                          type="email"
                          value={shopSettings.email}
                          onChange={(e) => setShopSettings({...shopSettings, email: e.target.value})}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <Label className="text-[#2B4A39] block mb-2 md:mb-3 text-sm md:text-base">
                          Телефон
                        </Label>
                        <Input
                          type="tel"
                          value={shopSettings.phone}
                          onChange={(e) => setShopSettings({...shopSettings, phone: e.target.value})}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-[#2B4A39] block mb-2 md:mb-3 text-sm md:text-base">
                        Адрес
                      </Label>
                      <Input
                        type="text"
                        value={shopSettings.address}
                        onChange={(e) => setShopSettings({...shopSettings, address: e.target.value})}
                        className="w-full"
                      />
                    </div>

                    <Button
                      className="bg-[#2B4A39] hover:bg-[#234135] text-white px-4 py-2 md:px-6 md:py-3 text-sm md:text-base w-fit"
                    >
                      Сохранить изменения
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerAdmin;

