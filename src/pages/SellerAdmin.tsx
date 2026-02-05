import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Package, TrendingUp, Store, Check, X, Eye, Edit,
  Trash2, Plus, Search, LogOut, DollarSign, Users, AlertCircle,
  Clock, ExternalLink, Camera, Upload
} from "lucide-react";
import Header from "../components/Header";
import { Separator } from "../components/ui/separator";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { tokenManager } from '../api/client';
import { sellerService, SellerOrderResponse } from '../api/sellerService';
import { offerService } from '../api/offerService';
import { inventoryService, StockResponse } from '../api/inventoryService';
import { moderationService, EditRequestResponse } from '../api/moderationService';
import { OfferResponse, OfferStatus as OfferStatusType } from '../types/offer';
import { SellerResponse, SellerStatus, SellerStatusLabels } from '../types/seller';

// Типы данных
interface Offer {
  id: number;
  productName: string;
  latinName?: string;
  imageUrl?: string;
  price: number;
  stock: number;
  reservedQuantity: number;
  availableQuantity: number;
  stockId: number | null;
  inventorySkuId: string | null;
  status: "active" | "pending" | "rejected" | "draft" | "disabled";
  views: number;
  sales: number;
  createdAt: string;
  rejectionReason?: string;
}

// Маппинг статусов бэкенда -> фронтенда
const mapOfferStatus = (status: OfferStatusType): Offer['status'] => {
  switch (status) {
    case 'APPROVED': return 'active';
    case 'PENDING_REVIEW': return 'pending';
    case 'REJECTED': return 'rejected';
    case 'DISABLED': return 'disabled';
    case 'DELETED': return 'disabled'; // DELETED не должны приходить, но на всякий случай
    case 'DRAFT':
    default: return 'draft';
  }
};

// Маппинг OfferResponse -> Offer
const mapOfferResponseToOffer = (response: OfferResponse, stockMap: Map<number, StockResponse>): Offer => {
  const stock = stockMap.get(response.id);
  return {
    id: response.id,
    productName: response.title || `Оффер #${response.id}`,
    latinName: response.latinName,
    imageUrl: response.thumbnailUrl || response.mainImageUrl,
    price: response.price,
    stock: stock?.quantity ?? 0,
    reservedQuantity: stock?.reservedQuantity ?? 0,
    availableQuantity: stock?.availableQuantity ?? 0,
    stockId: stock?.id ?? null,
    inventorySkuId: response.inventorySkuId ?? null,
    status: mapOfferStatus(response.status),
    views: 0, // TODO: статистика
    sales: 0, // TODO: статистика
    createdAt: response.createdAt.split('T')[0],
    rejectionReason: response.rejectionReason
  };
};

interface PopularProduct {
  id: number;
  name: string;
  imageUrl: string;
  soldCount: number;
}

const orderStatusLabels: Record<string, string> = {
  PENDING: 'Ожидает оплаты',
  PAID: 'Оплачен',
  PROCESSING: 'В обработке',
  SHIPPED: 'Отправлен',
  DELIVERED: 'Доставлен',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
};

const orderStatusColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800',
  PAID: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-yellow-100 text-yellow-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-green-200 text-green-900',
  CANCELLED: 'bg-red-100 text-red-800',
};

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
  const [sellerProfile, setSellerProfile] = useState<SellerResponse | null>(null);
  const [sellerError, setSellerError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentSection, setCurrentSection] = useState<"shop" | "offers" | "orders" | "stats">("shop");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [orders, setOrders] = useState<SellerOrderResponse[]>([]);
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
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [pendingModerationRequests, setPendingModerationRequests] = useState<EditRequestResponse[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingContacts, setSavingContacts] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Загружаем профиль продавца
      const seller = await sellerService.getMySellerProfile();
      setSellerProfile(seller);

      // Если продавец не одобрен - показываем сообщение
      if (seller.status !== SellerStatus.APPROVED) {
        setSellerError(
          seller.status === SellerStatus.PENDING
            ? 'Ваша заявка на регистрацию магазина находится на рассмотрении. После одобрения вы сможете добавлять товары.'
            : seller.status === SellerStatus.REJECTED
            ? `Ваша заявка была отклонена. ${seller.blockReason || 'Обратитесь в поддержку для уточнения причины.'}`
            : seller.status === SellerStatus.BLOCKED
            ? `Ваш магазин заблокирован. ${seller.blockReason || 'Обратитесь в поддержку.'}`
            : 'Ваш магазин приостановлен.'
        );
        setLoading(false);
        return;
      }

      // Загружаем офферы и склад продавца
      try {
        console.log('Загружаем офферы...');
        const [offersResponse, stocksResponse, breakdownResponse] = await Promise.all([
          offerService.getMyOffers(),
          inventoryService.getMyStocks().catch(() => [] as StockResponse[]),
          sellerService.getReservedBreakdown().catch(() => ({} as Record<string, Record<string, number>>)),
        ]);
        setReservedBreakdown(breakdownResponse);
        console.log('Ответ API офферов:', offersResponse);

        const stockMap = new Map<number, StockResponse>();
        stocksResponse.forEach(s => stockMap.set(s.offerId, s));

        const mappedOffers = offersResponse.map(r => mapOfferResponseToOffer(r, stockMap));
        console.log('Замапленные офферы:', mappedOffers);
        setOffers(mappedOffers);

        // Подсчитываем статистику на основе офферов
        const pendingCount = mappedOffers.filter(o => o.status === 'pending').length;

        setStats({
          totalRevenue: 0, // TODO: интеграция с заказами
          totalOrders: 0,
          totalOffers: mappedOffers.length,
          averageRating: seller.rating || 0,
          newOrders: 0,
          pendingOffers: pendingCount,
          totalViews: 0, // TODO: статистика просмотров
          conversionRate: 0,
          popularProducts: []
        });

        // Заполняем настройки магазина из профиля продавца
        setShopSettings({
          name: seller.shopName || '',
          description: seller.description || '',
          email: seller.contactEmail || '',
          phone: seller.contactPhone || '',
          address: seller.legalAddress || ''
        });
      } catch (offerError: any) {
        console.error('Ошибка загрузки офферов:', offerError);
        console.error('Детали ошибки:', offerError?.response?.data || offerError?.message);
        setOffers([]);
      }

      // Загружаем pending-заявки на модерацию
      try {
        const pendingRequests = await moderationService.getMyPendingRequests();
        setPendingModerationRequests(pendingRequests);
      } catch {
        // Игнорируем ошибки загрузки заявок на модерацию
      }

      // Загружаем заказы продавца
      try {
        const sellerOrders = await sellerService.getSellerOrders();
        setOrders(sellerOrders);
      } catch {
        setOrders([]);
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Ошибка загрузки данных:', error);
      // Если пользователь не является продавцом
      if (error.response?.status === 404) {
        setSellerError('Вы еще не зарегистрированы как продавец. Сначала зарегистрируйте магазин.');
      } else {
        setSellerError('Ошибка загрузки данных. Попробуйте позже.');
      }
      setLoading(false);
    }
  };

  const handleLogout = () => {
    tokenManager.clearToken();
    window.dispatchEvent(new Event('auth-change'));
    navigate('/');
  };

  const handleAcceptOrder = async (orderId: number) => {
    try {
      const updated = await sellerService.acceptOrder(orderId);
      setOrders(orders.map(o => o.id === orderId ? updated : o));
      showAction('success', 'Заказ принят в обработку');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Ошибка при принятии заказа';
      showAction('error', msg);
    }
  };

  const handleShipOrder = async (orderId: number) => {
    try {
      const updated = await sellerService.shipOrder(orderId);
      setOrders(orders.map(o => o.id === orderId ? updated : o));
      showAction('success', 'Заказ отправлен');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Ошибка при отправке заказа';
      showAction('error', msg);
    }
  };

  const handleDeliverOrder = async (orderId: number) => {
    try {
      const updated = await sellerService.deliverOrder(orderId);
      setOrders(orders.map(o => o.id === orderId ? updated : o));
      showAction('success', 'Заказ доставлен');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Ошибка при подтверждении доставки';
      showAction('error', msg);
    }
  };

  const handleDeleteOffer = async (id: number) => {
    try {
      await offerService.softDeleteOffer(id);
      setOffers(offers.filter(o => o.id !== id));
      showAction('success', 'Оффер удалён');
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.response?.data?.error || 'Ошибка удаления';
      showAction('error', msg);
    }
  };

  const [reservedBreakdown, setReservedBreakdown] = useState<Record<string, Record<string, number>>>({});
  const [pendingStockUpdates, setPendingStockUpdates] = useState<Set<number>>(new Set());
  const [savingStock, setSavingStock] = useState<Set<number>>(new Set());

  const updateOfferStock = (id: number, newAvailable: number) => {
    setOffers(offers.map(o =>
      o.id === id
        ? { ...o, availableQuantity: newAvailable, stock: newAvailable + o.reservedQuantity }
        : o
    ));
    setPendingStockUpdates(prev => new Set(prev).add(id));
  };

  const submitStock = async (offer: Offer) => {
    if (!offer.inventorySkuId) {
      showAction('error', 'Оффер не одобрен. Склад создаётся после одобрения оффера.');
      return;
    }
    setSavingStock(prev => new Set(prev).add(offer.id));
    try {
      // quantity = доступное + зарезервированное
      const totalQuantity = offer.availableQuantity + offer.reservedQuantity;
      const updated = await inventoryService.updateStockBySku(offer.inventorySkuId, { quantity: totalQuantity });
      setOffers(offers.map(o =>
        o.id === offer.id
          ? { ...o, stock: updated.quantity, reservedQuantity: updated.reservedQuantity, availableQuantity: updated.availableQuantity }
          : o
      ));
      setPendingStockUpdates(prev => {
        const next = new Set(prev);
        next.delete(offer.id);
        return next;
      });
      showAction('success', `Склад обновлён: доступно ${updated.availableQuantity} шт.`);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Ошибка обновления склада';
      showAction('error', msg);
    } finally {
      setSavingStock(prev => {
        const next = new Set(prev);
        next.delete(offer.id);
        return next;
      });
    }
  };

  const showAction = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Отправить оффер на модерацию
  const handleSubmitForReview = async (id: number) => {
    try {
      await offerService.submitForReview(id);
      setOffers(offers.map(o => o.id === id ? { ...o, status: 'pending' as const } : o));
      showAction('success', 'Оффер отправлен на модерацию');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Ошибка отправки на модерацию';
      showAction('error', msg);
    }
  };

  // Повторно подать отклонённый оффер
  const handleResubmit = async (id: number) => {
    try {
      await offerService.resubmitOffer(id);
      setOffers(offers.map(o => o.id === id ? { ...o, status: 'pending' as const, rejectionReason: undefined } : o));
      showAction('success', 'Оффер повторно отправлен на модерацию');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Ошибка повторной подачи';
      showAction('error', msg);
    }
  };

  // Деактивировать оффер (APPROVED → DISABLED)
  const handleDeactivate = async (id: number) => {
    try {
      await offerService.deactivateOffer(id);
      setOffers(offers.map(o => o.id === id ? { ...o, status: 'disabled' as const } : o));
      showAction('success', 'Оффер снят с продажи');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Ошибка деактивации';
      showAction('error', msg);
    }
  };

  // Реактивировать оффер
  const handleReactivate = async (id: number) => {
    try {
      await offerService.reactivateOffer(id);
      setOffers(offers.map(o => o.id === id ? { ...o, status: 'active' as const } : o));
      showAction('success', 'Оффер активирован');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Ошибка реактивации';
      showAction('error', msg);
    }
  };

  const filteredOffers = offers.filter(o => {
    if (filterStatus !== "all" && o.status !== filterStatus) return false;
    if (searchQuery && !o.productName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredOrders = orders.filter(o => {
    if (filterStatus !== "all" && o.status !== filterStatus) return false;
    if (searchQuery && !o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const newOrdersCount = orders.filter(o => o.status === "PAID").length;
  const pendingOffersCount = offers.filter(o => o.status === "pending").length;

  // Получаем set полей, находящихся на модерации
  const pendingFieldNames = new Set<string>();
  pendingModerationRequests.forEach(req => {
    req.changes.forEach(change => pendingFieldNames.add(change.fieldName));
  });

  const ModerationBadge = ({ fieldName }: { fieldName: string }) => {
    if (!pendingFieldNames.has(fieldName)) return null;
    return (
      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        На модерации
      </span>
    );
  };

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

  // Показываем сообщение если продавец не одобрен или не зарегистрирован
  if (sellerError) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <Header />
        <div className="mx-auto px-4 py-8 md:px-6 md:py-12 lg:px-12 max-w-2xl">
          <div className="bg-white shadow-md rounded-xl p-6 md:p-8 text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Clock className="w-8 h-8 md:w-10 md:h-10 text-yellow-600" />
            </div>
            <h1 className="text-[#2B4A39] text-xl md:text-2xl font-semibold mb-3 md:mb-4">
              {sellerProfile ? SellerStatusLabels[sellerProfile.status] : 'Доступ ограничен'}
            </h1>
            <p className="text-[#2D2E30]/70 text-sm md:text-base mb-6">
              {sellerError}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate('/profile')}
                className="bg-[#BCCEA9] hover:bg-[#a8ba95] text-[#2B4A39]"
              >
                Вернуться в профиль
              </Button>
              {!sellerProfile && (
                <Button
                  onClick={() => navigate('/register-store')}
                  variant="outline"
                  className="border-[#2B4A39] text-[#2B4A39] hover:bg-[#BCCEA9]/20"
                >
                  Зарегистрировать магазин
                </Button>
              )}
              {sellerProfile?.status === SellerStatus.REJECTED && (
                <Button
                  onClick={() => navigate('/register-store')}
                  variant="outline"
                  className="border-[#2B4A39] text-[#2B4A39] hover:bg-[#BCCEA9]/20"
                >
                  Подать заявку повторно
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      
      <div className="mx-auto px-4 py-4 md:px-6 md:py-6 lg:px-12 lg:py-8">
        {/* Заголовок */}
        <div className="mb-6 md:mb-8 bg-[#2B4A39] rounded-xl p-4 md:p-6">
          <h1 className="text-white text-2xl md:text-3xl lg:text-4xl mb-2">
            Мой магазин
          </h1>
          <p className="text-white/70 text-sm md:text-base">
            Управление магазином
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
                    setCurrentSection("shop");
                    setSearchQuery("");
                    setFilterStatus("all");
                  }}
                  className={`flex flex-col lg:flex-row items-center lg:items-center justify-center lg:justify-start transition-colors px-3 py-3 md:px-4 md:py-3 rounded-lg text-sm md:text-base ${
                    currentSection === "shop"
                      ? "bg-[#BCCEA9] text-[#2B4A39]"
                      : "hover:bg-[#F8F9FA] text-[#2D2E30]"
                  }`}
                >
                  <Store className="w-6 h-6 lg:w-5 lg:h-5 flex-shrink-0 mb-1 lg:mb-0 lg:mr-3" />
                  <span className="text-center lg:text-left lg:flex-1 text-xs lg:text-base">О магазине</span>
                </button>

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
            {/* Уведомление о действии */}
            {actionMessage && (
              <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
                actionMessage.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {actionMessage.text}
              </div>
            )}

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
                        onClick={() => navigate('/seller/offers/new')}
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
                        <option value="rejected">Отклонённые</option>
                        <option value="disabled">Отключённые</option>
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
                                offer.status === "rejected" ? "bg-red-100 text-red-800" :
                                offer.status === "disabled" ? "bg-orange-100 text-orange-800" :
                                "bg-gray-100 text-gray-800"
                              }`}>
                                {offer.status === "active" ? "Активен" :
                                 offer.status === "pending" ? "Модерация" :
                                 offer.status === "rejected" ? "Отклонён" :
                                 offer.status === "disabled" ? "Отключён" : "Черновик"}
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

                            {offer.status === "active" && (
                            <div className="mb-2 md:mb-3">
                              <div className="flex items-center gap-2 md:gap-3">
                                <span className="text-[#2D2E30]/70 text-xs md:text-sm">Доступно:</span>
                                <div className="flex items-center border border-[#2D2E30]/20 rounded overflow-hidden">
                                  <button
                                    onClick={() => updateOfferStock(offer.id, Math.max(0, offer.availableQuantity - 1))}
                                    className="px-2 py-1 hover:bg-gray-100 text-[#2D2E30]/70 transition-colors"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    max="999999"
                                    value={offer.availableQuantity}
                                    onChange={(e) => updateOfferStock(offer.id, Math.max(0, Math.min(999999, parseInt(e.target.value) || 0)))}
                                    className="text-center font-semibold focus:outline-none w-12 px-1 py-1 text-xs md:text-sm"
                                  />
                                  <button
                                    onClick={() => updateOfferStock(offer.id, Math.min(999999, offer.availableQuantity + 1))}
                                    className="px-2 py-1 hover:bg-gray-100 text-[#2D2E30]/70 transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                                <span className={`font-semibold text-xs md:text-sm ${offer.availableQuantity > 0 ? "text-green-600" : "text-red-600"}`}>
                                  {offer.availableQuantity > 0 ? "В наличии" : "Нет в наличии"}
                                </span>
                                {offer.inventorySkuId && (
                                  <Button
                                    onClick={() => submitStock(offer)}
                                    disabled={savingStock.has(offer.id) || !pendingStockUpdates.has(offer.id)}
                                    size="sm"
                                    className={`text-xs h-7 px-2 ${
                                      pendingStockUpdates.has(offer.id)
                                        ? "bg-[#2B4A39] hover:bg-[#1d3527] text-white"
                                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    }`}
                                  >
                                    <Package className="w-3 h-3 mr-1" />
                                    {savingStock.has(offer.id) ? "Сохранение..." : "Обновить склад"}
                                  </Button>
                                )}
                              </div>
                              {offer.reservedQuantity > 0 && (() => {
                                const breakdown = reservedBreakdown[String(offer.id)];
                                const statusLabels: Record<string, string> = {
                                  PAID: 'Оплачено',
                                  PROCESSING: 'В обработке',
                                  SHIPPED: 'В пути',
                                  DELIVERED: 'Доставлено',
                                };
                                const statusColors: Record<string, string> = {
                                  PAID: 'text-blue-600',
                                  PROCESSING: 'text-yellow-600',
                                  SHIPPED: 'text-purple-600',
                                  DELIVERED: 'text-green-600',
                                };
                                if (breakdown && Object.keys(breakdown).length > 0) {
                                  return (
                                    <p className="text-xs mt-1 ml-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                                      {Object.entries(breakdown)
                                        .filter(([, qty]) => qty > 0)
                                        .map(([status, qty]) => (
                                          <span key={status} className={statusColors[status] || 'text-orange-500'}>
                                            {statusLabels[status] || status}: {qty} шт.
                                          </span>
                                        ))}
                                    </p>
                                  );
                                }
                                return (
                                  <p className="text-xs text-orange-500 mt-1 ml-0.5">
                                    В резерве: {offer.reservedQuantity} шт.
                                  </p>
                                );
                              })()}
                            </div>
                            )}

                            <div className="flex flex-wrap gap-1.5 md:gap-2">
                              <Button
                                onClick={() => navigate(`/seller/offers/${offer.id}/edit`)}
                                size="sm"
                                variant="ghost"
                                className="text-[#2B4A39] text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                              >
                                <Edit className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                                Редактировать
                              </Button>
                              {offer.status === "active" && (
                                <Button
                                  onClick={() => handleDeactivate(offer.id)}
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
                                  onClick={() => handleSubmitForReview(offer.id)}
                                  size="sm"
                                  className="bg-[#BCCEA9] hover:bg-[#a8ba95] text-[#2B4A39] text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                                >
                                  <Check className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                                  На модерацию
                                </Button>
                              )}
                              {offer.status === "rejected" && (
                                <Button
                                  onClick={() => handleResubmit(offer.id)}
                                  size="sm"
                                  className="bg-[#BCCEA9] hover:bg-[#a8ba95] text-[#2B4A39] text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                                >
                                  <Check className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                                  Подать повторно
                                </Button>
                              )}
                              {offer.status === "disabled" && (
                                <Button
                                  onClick={() => handleReactivate(offer.id)}
                                  size="sm"
                                  className="bg-[#BCCEA9] hover:bg-[#a8ba95] text-[#2B4A39] text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                                >
                                  <Check className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                                  Активировать
                                </Button>
                              )}
                              {offer.status === "disabled" && (
                                <Button
                                  onClick={() => handleDeleteOffer(offer.id)}
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                                >
                                  <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                                  Удалить
                                </Button>
                              )}
                            </div>

                            {/* Причина отклонения */}
                            {offer.status === "rejected" && offer.rejectionReason && (
                              <div className="mt-2 p-2 bg-red-50 rounded text-xs md:text-sm text-red-700">
                                <strong>Причина отклонения:</strong> {offer.rejectionReason}
                              </div>
                            )}
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
                          placeholder="Поиск по номеру заказа..."
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
                        <option value="PAID">Оплачен</option>
                        <option value="PROCESSING">В обработке</option>
                        <option value="SHIPPED">Отправлен</option>
                        <option value="DELIVERED">Доставлен</option>
                        <option value="COMPLETED">Завершён</option>
                        <option value="CANCELLED">Отменён</option>
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
                              orderStatusColors[order.status] || 'bg-gray-100 text-gray-800'
                            }`}>
                              {orderStatusLabels[order.status] || order.status}
                            </span>
                          </div>

                          {order.deliveryAddress && (
                            <div className="text-[#2D2E30]/70 text-xs md:text-sm mb-3 md:mb-4 flex flex-col gap-1 md:gap-1.5">
                              <p className="font-semibold text-[#2D2E30]">{order.deliveryAddress.recipientName}</p>
                              <p>{order.deliveryAddress.recipientPhone}</p>
                              <p>{[order.deliveryAddress.city, order.deliveryAddress.street, order.deliveryAddress.building, order.deliveryAddress.apartment].filter(Boolean).join(', ')}</p>
                            </div>
                          )}

                          <p className="text-[#2D2E30]/50 text-xs mb-3">
                            {new Date(order.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            {order.paymentMethod && <span className="ml-2">· {order.paymentMethod === 'CARD' ? 'Картой' : order.paymentMethod === 'SBP' ? 'СБП' : 'Наложенный платёж'}</span>}
                          </p>

                          {order.buyerComment && (
                            <p className="text-xs text-[#2D2E30]/60 mb-3 italic">
                              Комментарий: {order.buyerComment}
                            </p>
                          )}

                          <div className="bg-[#F8F9FA] rounded-lg p-3 md:p-4 mb-3 md:mb-4">
                            <p className="text-[#2D2E30]/70 font-semibold text-xs md:text-sm mb-2 md:mb-3">Товары:</p>
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-center gap-3 text-xs md:text-sm mb-2">
                                {item.productImageUrl && (
                                  <img src={item.productImageUrl} alt={item.productName} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                                )}
                                <span className="text-[#2D2E30] flex-1 min-w-0 truncate">{item.productName}</span>
                                <span className="text-[#2D2E30]/60 flex-shrink-0">{item.quantity} × {item.pricePerUnit} ₽</span>
                                <span className="text-[#2B4A39] font-semibold flex-shrink-0">{item.totalPrice} ₽</span>
                              </div>
                            ))}
                            {order.deliveryPrice > 0 && (
                              <>
                                <Separator className="bg-[#2D2E30]/10 my-2" />
                                <div className="flex justify-between text-xs md:text-sm">
                                  <span className="text-[#2D2E30]/60">Доставка{order.deliveryMethodName ? ` (${order.deliveryMethodName})` : ''}</span>
                                  <span className="text-[#2D2E30]">{order.deliveryPrice} ₽</span>
                                </div>
                              </>
                            )}
                            <Separator className="bg-[#2D2E30]/10 my-2 md:my-3" />
                            <div className="flex justify-between font-bold text-sm md:text-base lg:text-lg">
                              <span className="text-[#2D2E30]">Итого:</span>
                              <span className="text-[#2B4A39]">{order.totalAmount} ₽</span>
                            </div>
                          </div>

                          {order.cancellationReason && (
                            <div className="p-2 bg-red-50 rounded text-xs md:text-sm text-red-700 mb-3">
                              <strong>Причина отмены:</strong> {order.cancellationReason}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {order.status === "PAID" && (
                            <Button
                              onClick={() => handleAcceptOrder(order.id)}
                              size="sm"
                              className="bg-[#BCCEA9] hover:bg-[#a8ba95] text-[#2B4A39] text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                            >
                              <Check className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                              Принять в обработку
                            </Button>
                          )}
                          {order.status === "PROCESSING" && (
                            <Button
                              onClick={() => handleShipOrder(order.id)}
                              size="sm"
                              className="bg-[#BCCEA9] hover:bg-[#a8ba95] text-[#2B4A39] text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                            >
                              <Package className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                              Отправить
                            </Button>
                          )}
                          {order.status === "SHIPPED" && (
                            <Button
                              onClick={() => handleDeliverOrder(order.id)}
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

            {/* О МАГАЗИНЕ */}
            {currentSection === "shop" && (
              <div className="flex flex-col gap-4 md:gap-6">
                {/* Зона A — Модерируемые поля (read-only) */}
                <div className="bg-white shadow-md rounded-xl p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
                    <h2 className="text-[#2B4A39] font-semibold text-xl md:text-2xl">
                      О магазине
                    </h2>
                    <div className="flex items-center gap-3">
                      {sellerProfile && (
                        <a
                          href={`/seller/${sellerProfile.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-[#2B4A39] hover:text-[#1d3527] transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Открыть публичную страницу
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Уведомление о полях на модерации */}
                  {pendingModerationRequests.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Некоторые изменения на модерации</p>
                          <p className="text-sm text-yellow-700 mt-1">
                            Поля, отмеченные значком "На модерации", ожидают проверки. До одобрения покупатели видят предыдущие значения.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-4 md:gap-6">
                    {/* Логотип */}
                    <div>
                      <Label className="text-[#2B4A39] block mb-2 md:mb-3 text-sm md:text-base">
                        Логотип <ModerationBadge fieldName="logoUrl" />
                      </Label>
                      <div className="flex items-center gap-4">
                        {sellerProfile?.logoUrl ? (
                          <img
                            src={sellerProfile.logoUrl}
                            alt="Логотип магазина"
                            className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover border border-[#2D2E30]/10"
                          />
                        ) : (
                          <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-[#F8F9FA] border border-[#2D2E30]/10 flex items-center justify-center">
                            {sellerProfile ? (
                              <span
                                className="text-2xl md:text-3xl font-bold text-white rounded-xl w-full h-full flex items-center justify-center"
                                style={{ backgroundColor: sellerProfile.avatarBackgroundColor }}
                              >
                                {sellerProfile.avatarInitials}
                              </span>
                            ) : (
                              <Camera className="w-8 h-8 text-[#2D2E30]/30" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-[#2B4A39] block mb-2 md:mb-3 text-sm md:text-base">
                        Название магазина <ModerationBadge fieldName="shopName" />
                      </Label>
                      <p className="text-[#2D2E30] text-sm md:text-base bg-[#F8F9FA] rounded-lg px-3 py-2 md:px-4 md:py-3">
                        {shopSettings.name || <span className="text-[#2D2E30]/40 italic">Не указано</span>}
                      </p>
                    </div>

                    <div>
                      <Label className="text-[#2B4A39] block mb-2 md:mb-3 text-sm md:text-base">
                        Описание магазина <ModerationBadge fieldName="description" />
                      </Label>
                      <p className="text-[#2D2E30] text-sm md:text-base bg-[#F8F9FA] rounded-lg px-3 py-2 md:px-4 md:py-3 whitespace-pre-wrap min-h-[60px]">
                        {shopSettings.description || <span className="text-[#2D2E30]/40 italic">Не указано</span>}
                      </p>
                    </div>

                    <Button
                      onClick={() => {
                        setEditForm({ name: shopSettings.name, description: shopSettings.description });
                        setLogoFile(null);
                        setLogoPreview(null);
                        setEditDialogOpen(true);
                      }}
                      variant="outline"
                      className="border-[#2B4A39] text-[#2B4A39] hover:bg-[#BCCEA9]/20 w-fit flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Редактировать
                    </Button>
                  </div>
                </div>

                {/* Dialog для редактирования модерируемых полей */}
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Редактирование информации о магазине</DialogTitle>
                      <DialogDescription>
                        Изменения будут отправлены на модерацию. До одобрения покупатели будут видеть текущие значения.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 py-4">
                      {/* Логотип */}
                      <div>
                        <Label className="text-[#2B4A39] block mb-2 text-sm">
                          Логотип
                          {pendingFieldNames.has('logoUrl') && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Уже на модерации
                            </span>
                          )}
                        </Label>
                        <div className="flex items-center gap-4">
                          {/* Текущее / превью */}
                          {logoPreview ? (
                            <img
                              src={logoPreview}
                              alt="Превью нового логотипа"
                              className="w-16 h-16 rounded-lg object-cover border border-[#BCCEA9]"
                            />
                          ) : sellerProfile?.logoUrl ? (
                            <img
                              src={sellerProfile.logoUrl}
                              alt="Текущий логотип"
                              className="w-16 h-16 rounded-lg object-cover border border-[#2D2E30]/10"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-[#F8F9FA] border border-[#2D2E30]/10 flex items-center justify-center">
                              <Camera className="w-6 h-6 text-[#2D2E30]/30" />
                            </div>
                          )}

                          {!pendingFieldNames.has('logoUrl') && (
                            <div className="flex flex-col gap-1">
                              <label className="cursor-pointer inline-flex items-center gap-1.5 text-sm text-[#2B4A39] hover:text-[#1d3527] transition-colors">
                                <Upload className="w-4 h-4" />
                                {logoPreview ? 'Заменить' : 'Загрузить'}
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    if (file.size > 10 * 1024 * 1024) {
                                      showAction('error', 'Максимальный размер файла — 10 МБ');
                                      return;
                                    }
                                    setLogoFile(file);
                                    setLogoPreview(URL.createObjectURL(file));
                                  }}
                                />
                              </label>
                              {logoPreview && (
                                <button
                                  onClick={() => {
                                    if (logoPreview) URL.revokeObjectURL(logoPreview);
                                    setLogoFile(null);
                                    setLogoPreview(null);
                                  }}
                                  className="text-xs text-red-600 hover:text-red-700 text-left"
                                >
                                  Отменить
                                </button>
                              )}
                              <p className="text-xs text-[#2D2E30]/50">JPEG, PNG, WebP. До 10 МБ</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label className="text-[#2B4A39] block mb-2 text-sm">
                          Название магазина
                          {pendingFieldNames.has('shopName') && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Уже на модерации
                            </span>
                          )}
                        </Label>
                        <Input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full"
                          disabled={pendingFieldNames.has('shopName')}
                        />
                      </div>

                      <div>
                        <Label className="text-[#2B4A39] block mb-2 text-sm">
                          Описание магазина
                          {pendingFieldNames.has('description') && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Уже на модерации
                            </span>
                          )}
                        </Label>
                        <textarea
                          rows={4}
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="w-full border border-[#2D2E30]/20 focus:outline-none focus:border-[#BCCEA9] px-3 py-2 text-sm rounded-lg resize-none"
                          disabled={pendingFieldNames.has('description')}
                        />
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                          <p className="text-xs text-yellow-700">
                            Изменения будут отправлены на модерацию и применены после проверки.
                          </p>
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (logoPreview) URL.revokeObjectURL(logoPreview);
                          setLogoFile(null);
                          setLogoPreview(null);
                          setEditDialogOpen(false);
                        }}
                      >
                        Отмена
                      </Button>
                      <Button
                        onClick={async () => {
                          setSavingSettings(true);
                          try {
                            let hasChanges = false;

                            // 1. Загрузка лого (если выбран файл)
                            if (logoFile && !pendingFieldNames.has('logoUrl')) {
                              await sellerService.uploadLogo(logoFile);
                              hasChanges = true;
                            }

                            // 2. Текстовые поля
                            const request: Record<string, string> = {};
                            if (!pendingFieldNames.has('shopName') && editForm.name !== shopSettings.name) {
                              request.shopName = editForm.name;
                            }
                            if (!pendingFieldNames.has('description') && editForm.description !== shopSettings.description) {
                              request.description = editForm.description;
                            }

                            if (Object.keys(request).length > 0) {
                              await sellerService.updateMySellerProfile(request);
                              hasChanges = true;
                            }

                            if (!hasChanges) {
                              showAction('error', 'Нет изменений для отправки');
                              setSavingSettings(false);
                              return;
                            }

                            showAction('success', 'Изменения отправлены на модерацию');
                            if (logoPreview) URL.revokeObjectURL(logoPreview);
                            setLogoFile(null);
                            setLogoPreview(null);
                            setEditDialogOpen(false);
                            // Перезагружаем pending-заявки
                            try {
                              const pendingRequests = await moderationService.getMyPendingRequests();
                              setPendingModerationRequests(pendingRequests);
                            } catch { /* ignore */ }
                          } catch (error: any) {
                            const msg = error?.response?.data?.message || 'Ошибка отправки изменений';
                            showAction('error', msg);
                          } finally {
                            setSavingSettings(false);
                          }
                        }}
                        disabled={savingSettings || (
                          pendingFieldNames.has('shopName') &&
                          pendingFieldNames.has('description') &&
                          pendingFieldNames.has('logoUrl')
                        )}
                        className="bg-[#2B4A39] hover:bg-[#234135] text-white"
                      >
                        {savingSettings ? 'Отправка...' : 'Отправить на модерацию'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Зона B — Контактные данные (прямое редактирование) */}
                <div className="bg-white shadow-md rounded-xl p-4 md:p-6">
                  <h2 className="text-[#2B4A39] font-semibold text-xl md:text-2xl mb-4 md:mb-6">
                    Контактные данные
                  </h2>

                  <div className="flex flex-col gap-4 md:gap-6">
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
                      onClick={async () => {
                        setSavingContacts(true);
                        try {
                          await sellerService.updateMySellerProfile({
                            contactEmail: shopSettings.email,
                            contactPhone: shopSettings.phone,
                            legalAddress: shopSettings.address,
                          });
                          showAction('success', 'Контактные данные сохранены');
                        } catch (error: any) {
                          const msg = error?.response?.data?.message || 'Ошибка сохранения';
                          showAction('error', msg);
                        } finally {
                          setSavingContacts(false);
                        }
                      }}
                      disabled={savingContacts}
                      className="bg-[#2B4A39] hover:bg-[#234135] text-white px-4 py-2 md:px-6 md:py-3 text-sm md:text-base w-fit"
                    >
                      {savingContacts ? 'Сохранение...' : 'Сохранить контакты'}
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

