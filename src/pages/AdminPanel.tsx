import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Users,
  FolderTree,
  BookOpen,
  Check,
  X,
  Eye,
  Edit,
  Trash2,
  Search,
  AlertCircle,
  LogOut,
  Lock,
  Loader2
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { tokenManager } from '../api/client';
import { adminService, OfferForModeration, CategoryResponse, BrandResponse } from '../api/adminService';
import { SellerResponse, SellerStatus, SellerStatusLabels, CompanyTypeLabels, CompanyType } from '../types/seller';

type Section = "offers" | "sellers" | "categories" | "brands";

export default function AdminPanel() {
  const navigate = useNavigate();
  
  // Аутентификация
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Состояние разделов
  const [currentSection, setCurrentSection] = useState<Section>("offers");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Данные
  const [offers, setOffers] = useState<OfferForModeration[]>([]);
  const [sellers, setSellers] = useState<SellerResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  
  // UI состояния
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [blockReason, setBlockReason] = useState<{ [key: number]: string }>({});
  const [rejectReason, setRejectReason] = useState<{ [key: number]: string }>({});
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Проверка авторизации при загрузке и при изменении авторизации
  useEffect(() => {
    checkAuthentication();
    
    // Слушаем событие изменения авторизации
    const handleAuthChange = () => {
      console.log('🔄 Auth change event detected, rechecking authentication...');
      checkAuthentication();
    };
    
    window.addEventListener('auth-change', handleAuthChange);
    
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, []);

  const checkAuthentication = async () => {
    setCheckingAuth(true);
    
    // Проверяем наличие токена и роли админа/модератора
    const token = tokenManager.getToken();
    console.log('🔐 Checking authentication...');
    console.log('📝 Token exists:', !!token);
    
    if (!token) {
      console.log('❌ No token found');
      setIsAuthenticated(false);
      setCheckingAuth(false);
      return;
    }

    // Декодируем JWT для проверки роли (простая проверка)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('📦 JWT Payload:', payload);
      
      const roles = payload.roles || payload.authorities || [];
      console.log('👥 Roles found:', roles);
      
      const hasAdminRole = roles.some((r: string) => 
        r.includes('ADMIN') || r.includes('MODERATOR') || r === 'ROLE_ADMIN' || r === 'ROLE_MODERATOR'
      );
      
      console.log('✅ Has admin role:', hasAdminRole);
      
      if (hasAdminRole) {
        console.log('✅ Authentication successful! Loading admin panel...');
        setIsAuthenticated(true);
        loadData();
      } else {
        console.log('❌ User does not have admin/moderator role');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ Error decoding token:', error);
      setIsAuthenticated(false);
    }
    
    setCheckingAuth(false);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Загружаем данные с бэкенда
      const [offersData, sellersData, categoriesData, brandsData] = await Promise.all([
        adminService.getPendingOffers().catch(() => []),
        adminService.getPendingSellers().catch(() => []),
        adminService.getCategories().catch(() => []),
        adminService.getAllBrands().catch(() => []),
      ]);
      
      setOffers(offersData);
      setSellers(sellersData);
      setCategories(categoriesData);
      setBrands(brandsData);
      
    } catch (err: any) {
      console.error('Ошибка загрузки данных:', err);
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  // Функция выхода
  const handleLogout = () => {
    tokenManager.clearToken();
    window.dispatchEvent(new Event('auth-change'));
    setIsAuthenticated(false);
    navigate('/login');
  };

  // ==================== Модерация офферов ====================
  
  const approveOffer = async (id: number) => {
    setProcessingId(id);
    setError(null);
    try {
      await adminService.approveOffer(id);
      // Убираем из списка после одобрения
      setOffers(prev => prev.filter(o => o.id !== id));
    } catch (err: any) {
      console.error('Ошибка одобрения оффера:', err);
      setError('Ошибка одобрения оффера');
    } finally {
      setProcessingId(null);
    }
  };

  const rejectOffer = async (id: number) => {
    const reason = rejectReason[id]?.trim();
    if (!reason) {
      setError('Укажите причину отклонения');
      return;
    }

    setProcessingId(id);
    setError(null);
    try {
      await adminService.rejectOffer(id, reason);
      // Убираем из списка после отклонения
      setOffers(prev => prev.filter(o => o.id !== id));
      // Очищаем поле причины
      setRejectReason(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    } catch (err: any) {
      console.error('Ошибка отклонения оффера:', err);
      setError('Ошибка отклонения оффера');
    } finally {
      setProcessingId(null);
    }
  };

  // ==================== Модерация продавцов ====================

  const handleApproveSeller = async (sellerId: number) => {
    setProcessingId(sellerId);
    setError(null);
    try {
      await adminService.approveSeller(sellerId);
      setSellers(prev => prev.filter(s => s.id !== sellerId));
    } catch (err: any) {
      console.error('Ошибка одобрения продавца:', err);
      setError('Ошибка одобрения продавца');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSeller = async (sellerId: number) => {
    const reason = rejectReason[sellerId]?.trim();
    if (!reason) {
      setError('Укажите причину отклонения');
      return;
    }

    setProcessingId(sellerId);
    setError(null);
    try {
      await adminService.rejectSeller(sellerId, reason);
      setSellers(prev => prev.filter(s => s.id !== sellerId));
      setRejectReason(prev => {
        const newState = { ...prev };
        delete newState[sellerId];
        return newState;
      });
    } catch (err: any) {
      console.error('Ошибка отклонения заявки продавца:', err);
      setError('Ошибка отклонения заявки продавца');
    } finally {
      setProcessingId(null);
    }
  };

  const handleBlockSeller = async (sellerId: number) => {
    const reason = blockReason[sellerId]?.trim();
    if (!reason) {
      setError('Укажите причину блокировки');
      return;
    }

    setProcessingId(sellerId);
    setError(null);
    try {
      await adminService.blockSeller(sellerId, reason);
      setSellers(prev => prev.filter(s => s.id !== sellerId));
      setBlockReason(prev => {
        const newState = { ...prev };
        delete newState[sellerId];
        return newState;
      });
    } catch (err: any) {
      console.error('Ошибка блокировки продавца:', err);
      setError('Ошибка блокировки продавца');
    } finally {
      setProcessingId(null);
    }
  };

  // ==================== Управление категориями ====================

  const deleteCategory = async (id: number) => {
    if (!confirm('Вы уверены что хотите удалить эту категорию?')) return;
    
    setProcessingId(id);
    setError(null);
    try {
      await adminService.deleteCategory(id);
      setCategories(categories.filter(c => c.id !== id));
    } catch (err: any) {
      console.error('Ошибка удаления категории:', err);
      setError('Ошибка удаления категории');
    } finally {
      setProcessingId(null);
    }
  };

  const toggleCategoryActive = async (id: number, isActive: boolean) => {
    setProcessingId(id);
    setError(null);
    try {
      const updated = isActive 
        ? await adminService.deactivateCategory(id)
        : await adminService.activateCategory(id);
      setCategories(categories.map(c => c.id === id ? updated : c));
    } catch (err: any) {
      console.error('Ошибка изменения статуса категории:', err);
      setError('Ошибка изменения статуса');
    } finally {
      setProcessingId(null);
    }
  };

  // ==================== Управление брендами ====================

  const deleteBrand = async (id: number) => {
    if (!confirm('Вы уверены что хотите удалить этот бренд?')) return;
    
    setProcessingId(id);
    setError(null);
    try {
      await adminService.deleteBrand(id);
      setBrands(brands.filter(b => b.id !== id));
    } catch (err: any) {
      console.error('Ошибка удаления бренда:', err);
      setError('Ошибка удаления бренда');
    } finally {
      setProcessingId(null);
    }
  };

  const toggleBrandActive = async (id: number, isActive: boolean) => {
    setProcessingId(id);
    setError(null);
    try {
      const updated = isActive 
        ? await adminService.deactivateBrand(id)
        : await adminService.activateBrand(id);
      setBrands(brands.map(b => b.id === id ? updated : b));
    } catch (err: any) {
      console.error('Ошибка изменения статуса бренда:', err);
      setError('Ошибка изменения статуса');
    } finally {
      setProcessingId(null);
    }
  };

  // ==================== Фильтрация ====================

  const filteredOffers = offers.filter(o => {
    if (filterStatus !== "all" && o.status !== filterStatus) return false;
    if (searchQuery && o.sku && !o.sku.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredSellers = sellers.filter(s => {
    if (filterStatus !== "all") {
      if (filterStatus === "active" && s.status !== SellerStatus.APPROVED) return false;
      if (filterStatus === "pending" && s.status !== SellerStatus.PENDING) return false;
      if (filterStatus === "blocked" && s.status !== SellerStatus.BLOCKED) return false;
    }
    if (searchQuery && !s.shopName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredCategories = categories.filter(c => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredBrands = brands.filter(b => {
    if (searchQuery && !b.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Статистика
  const pendingOffersCount = offers.filter(o => o.status === "PENDING_REVIEW").length;
  const pendingSellersCount = sellers.filter(s => s.status === SellerStatus.PENDING).length;

  // ==================== Проверка загрузки ====================

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#2B4A39]" />
          <p className="mt-4 text-gray-600">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  // ==================== Форма входа ====================

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-md p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#BCCEA9] rounded-full mb-4">
                <Lock className="w-8 h-8 text-[#2B4A39]" />
              </div>
              <h1 className="text-2xl font-bold text-[#2B4A39] mb-2">
                Административная панель
              </h1>
              <p className="text-[#2D2E30]/70">
                Для доступа необходима авторизация с правами администратора или модератора
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => navigate('/login?redirect=/admin')}
                className="w-full bg-[#2B4A39] hover:bg-[#234135] text-white py-3"
              >
                Войти в систему
              </Button>

              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full border-[#2B4A39] text-[#2B4A39] hover:bg-[#BCCEA9]/20 py-3"
              >
                Вернуться на главную
              </Button>
            </div>

            <div className="text-center text-sm text-[#2D2E30]/70 mt-6">
              <p>Если у вас есть права доступа, войдите в систему с вашим аккаунтом.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== Основной интерфейс админки ====================

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Простой хедер для админки */}
      <header className="bg-[#2B4A39] text-white py-4 px-6 shadow-md">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">VEGA Admin</h1>
            <span className="text-sm text-[#BCCEA9]">Панель управления</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="text-white hover:text-[#BCCEA9] hover:bg-white/10"
            >
              На сайт
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="text-white hover:text-red-300 hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Выход
            </Button>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto py-6 px-4 lg:px-6">
        {/* Заголовок */}
        <div className="mb-6">
          <h1 className="text-[#2B4A39] text-2xl lg:text-3xl font-bold mb-2">
            Административная панель
          </h1>
          <p className="text-[#2D2E30]/70">
            Управление маркетплейсом растений
          </p>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Боковое меню навигации - Desktop */}
          <div className="hidden lg:block w-64 shrink-0">
            <div className="bg-white rounded-xl shadow-md p-4 sticky top-6">
              <h2 className="text-[#2B4A39] font-semibold mb-4">
                Разделы
              </h2>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setCurrentSection("offers");
                    setSearchQuery("");
                    setFilterStatus("all");
                  }}
                  className={`w-full flex items-center justify-start gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                    currentSection === "offers"
                      ? "bg-[#BCCEA9] text-[#2B4A39]"
                      : "hover:bg-[#F8F9FA] text-[#2D2E30]"
                  }`}
                >
                  <ShoppingBag className="w-5 h-5 shrink-0" />
                  <span className="flex-1 text-left">Модерация офферов</span>
                  {pendingOffersCount > 0 && (
                    <span className="bg-[#2B4A39] text-white text-xs px-2 py-0.5 rounded-full">
                      {pendingOffersCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setCurrentSection("sellers");
                    setSearchQuery("");
                    setFilterStatus("all");
                  }}
                  className={`w-full flex items-center justify-start gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                    currentSection === "sellers"
                      ? "bg-[#BCCEA9] text-[#2B4A39]"
                      : "hover:bg-[#F8F9FA] text-[#2D2E30]"
                  }`}
                >
                  <Users className="w-5 h-5 shrink-0" />
                  <span className="flex-1 text-left">Модерация продавцов</span>
                  {pendingSellersCount > 0 && (
                    <span className="bg-[#2B4A39] text-white text-xs px-2 py-0.5 rounded-full">
                      {pendingSellersCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setCurrentSection("categories");
                    setSearchQuery("");
                    setFilterStatus("all");
                  }}
                  className={`w-full flex items-center justify-start gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                    currentSection === "categories"
                      ? "bg-[#BCCEA9] text-[#2B4A39]"
                      : "hover:bg-[#F8F9FA] text-[#2D2E30]"
                  }`}
                >
                  <FolderTree className="w-5 h-5 shrink-0" />
                  <span className="flex-1 text-left">Категории</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection("brands");
                    setSearchQuery("");
                    setFilterStatus("all");
                  }}
                  className={`w-full flex items-center justify-start gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                    currentSection === "brands"
                      ? "bg-[#BCCEA9] text-[#2B4A39]"
                      : "hover:bg-[#F8F9FA] text-[#2D2E30]"
                  }`}
                >
                  <BookOpen className="w-5 h-5 shrink-0" />
                  <span className="flex-1 text-left">Бренды</span>
                </button>
              </div>

              <Separator className="my-4 bg-[#2D2E30]/10" />

              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Выход
              </Button>
            </div>
          </div>

          {/* Мобильное меню */}
          <div className="lg:hidden mb-4 bg-white rounded-xl shadow-md p-4 w-full">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[#2B4A39] font-semibold">
                Разделы
              </h2>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Выход
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCurrentSection("offers")}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  currentSection === "offers"
                    ? "bg-[#BCCEA9] text-[#2B4A39]"
                    : "hover:bg-[#F8F9FA] text-[#2D2E30]"
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="text-xs">Офферы</span>
                {pendingOffersCount > 0 && (
                  <span className="bg-[#2B4A39] text-white text-xs px-1.5 rounded-full">{pendingOffersCount}</span>
                )}
              </button>
              <button
                onClick={() => setCurrentSection("sellers")}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  currentSection === "sellers"
                    ? "bg-[#BCCEA9] text-[#2B4A39]"
                    : "hover:bg-[#F8F9FA] text-[#2D2E30]"
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="text-xs">Продавцы</span>
                {pendingSellersCount > 0 && (
                  <span className="bg-[#2B4A39] text-white text-xs px-1.5 rounded-full">{pendingSellersCount}</span>
                )}
              </button>
              <button
                onClick={() => setCurrentSection("categories")}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  currentSection === "categories"
                    ? "bg-[#BCCEA9] text-[#2B4A39]"
                    : "hover:bg-[#F8F9FA] text-[#2D2E30]"
                }`}
              >
                <FolderTree className="w-5 h-5" />
                <span className="text-xs">Категории</span>
              </button>
              <button
                onClick={() => setCurrentSection("brands")}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  currentSection === "brands"
                    ? "bg-[#BCCEA9] text-[#2B4A39]"
                    : "hover:bg-[#F8F9FA] text-[#2D2E30]"
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <span className="text-xs">Бренды</span>
              </button>
            </div>
          </div>

          {/* Основной контент */}
          <div className="flex-1">
            {loading ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#2B4A39]" />
                <p className="mt-4 text-gray-600">Загрузка данных...</p>
              </div>
            ) : (
              <>
                {/* МОДЕРАЦИЯ ОФФЕРОВ */}
                {currentSection === "offers" && (
                  <div className="bg-white rounded-xl shadow-md p-4 lg:p-6">
                    <div className="flex flex-col gap-4 mb-6">
                      <h2 className="text-[#2B4A39] font-semibold text-xl">
                        Модерация офферов
                      </h2>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2D2E30]/50" />
                          <Input
                            type="text"
                            placeholder="Поиск по SKU..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="px-3 py-2 text-sm border border-[#2D2E30]/20 rounded-lg focus:outline-none focus:border-[#BCCEA9]"
                        >
                          <option value="all">Все</option>
                          <option value="PENDING_REVIEW">Модерация</option>
                          <option value="APPROVED">Одобрено</option>
                          <option value="REJECTED">Отклонено</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {filteredOffers.map(offer => (
                        <div key={offer.id} className="border border-[#2D2E30]/10 rounded-lg p-4 hover:border-[#BCCEA9] transition-colors">
                          <div className="flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h3 className="text-[#2D2E30] font-semibold text-base mb-1">
                                  Оффер #{offer.id} 
                                  {offer.sku && <span className="text-sm text-[#2D2E30]/70 ml-2">SKU: {offer.sku}</span>}
                                </h3>
                                <p className="text-sm text-[#2D2E30]/70">
                                  Продукт ID: {offer.productId} • Продавец ID: {offer.sellerId}
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold shrink-0 ${
                                offer.status === "PENDING_REVIEW" ? "bg-yellow-100 text-yellow-800" :
                                offer.status === "APPROVED" ? "bg-green-100 text-green-800" :
                                offer.status === "REJECTED" ? "bg-red-100 text-red-800" :
                                "bg-gray-100 text-gray-800"
                              }`}>
                                {offer.status === "PENDING_REVIEW" ? "Модерация" :
                                 offer.status === "APPROVED" ? "Одобрено" :
                                 offer.status === "REJECTED" ? "Отклонено" :
                                 offer.status}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="text-[#2D2E30]/70">Цена:</span>
                                <p className="text-[#2B4A39] font-bold">{offer.price} {offer.currency}</p>
                              </div>
                              <div>
                                <span className="text-[#2D2E30]/70">Состояние:</span>
                                <p className="text-[#2D2E30]">{offer.condition || 'NEW'}</p>
                              </div>
                              <div>
                                <span className="text-[#2D2E30]/70">Инвентарь:</span>
                                <p className="text-[#2D2E30] text-xs truncate">{offer.inventorySkuId}</p>
                              </div>
                              {offer.handlingTimeDays && (
                                <div>
                                  <span className="text-[#2D2E30]/70">Обработка:</span>
                                  <p className="text-[#2D2E30]">{offer.handlingTimeDays} дн.</p>
                                </div>
                              )}
                              {offer.warrantyMonths && (
                                <div>
                                  <span className="text-[#2D2E30]/70">Гарантия:</span>
                                  <p className="text-[#2D2E30]">{offer.warrantyMonths} мес.</p>
                                </div>
                              )}
                              {offer.barcode && (
                                <div>
                                  <span className="text-[#2D2E30]/70">Баркод:</span>
                                  <p className="text-[#2D2E30] text-xs">{offer.barcode}</p>
                                </div>
                              )}
                            </div>

                            {offer.status === "PENDING_REVIEW" && (
                              <div className="mb-2">
                                <Label className="text-[#2D2E30] text-xs mb-1">
                                  Причина отклонения (при отклонении)
                                </Label>
                                <Input
                                  value={rejectReason[offer.id] || ''}
                                  onChange={(e) => setRejectReason(prev => ({
                                    ...prev,
                                    [offer.id]: e.target.value
                                  }))}
                                  placeholder="Укажите причину..."
                                  className="text-sm"
                                  disabled={processingId === offer.id}
                                />
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                              {offer.status === "PENDING_REVIEW" && (
                                <>
                                  <Button
                                    onClick={() => approveOffer(offer.id)}
                                    disabled={processingId !== null}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                                  >
                                    {processingId === offer.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                    ) : (
                                      <Check className="w-3 h-3 mr-1" />
                                    )}
                                    <span className="hidden sm:inline">Одобрить</span>
                                  </Button>
                                  <Button
                                    onClick={() => rejectOffer(offer.id)}
                                    disabled={processingId !== null}
                                    size="sm"
                                    variant="outline"
                                    className="border-red-600 text-red-600 hover:bg-red-50 text-xs h-8"
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    <span className="hidden sm:inline">Отклонить</span>
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-[#2B4A39] text-xs h-8"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                <span className="hidden sm:inline">Детали</span>
                              </Button>
                            </div>

                            {offer.rejectionReason && (
                              <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                                <p className="text-xs text-red-800">
                                  <strong>Причина отклонения:</strong> {offer.rejectionReason}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {filteredOffers.length === 0 && (
                      <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-[#2D2E30]/30 mx-auto mb-3" />
                        <p className="text-[#2D2E30]/70">
                          {offers.length === 0 ? 'Нет офферов на модерации' : 'Офферы не найдены'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* МОДЕРАЦИЯ ПРОДАВЦОВ */}
                {currentSection === "sellers" && (
                  <div className="bg-white rounded-xl shadow-md p-4 lg:p-6">
                    <div className="flex flex-col gap-4 mb-6">
                      <h2 className="text-[#2B4A39] font-semibold text-xl">
                        Модерация продавцов
                      </h2>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2D2E30]/50" />
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
                          className="px-3 py-2 text-sm border border-[#2D2E30]/20 rounded-lg focus:outline-none focus:border-[#BCCEA9]"
                        >
                          <option value="all">Все</option>
                          <option value="pending">Модерация</option>
                          <option value="active">Активные</option>
                          <option value="blocked">Заблокированные</option>
                        </select>
                      </div>
                    </div>

                    {filteredSellers.length === 0 ? (
                      <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-[#2D2E30]/30 mx-auto mb-3" />
                        <p className="text-[#2D2E30]/70">
                          {sellers.length === 0 ? 'Нет продавцов на модерации' : 'Продавцы не найдены'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredSellers.map(seller => (
                          <div key={seller.id} className="border border-[#2D2E30]/10 rounded-lg p-4 hover:border-[#BCCEA9] transition-colors">
                            <div className="mb-3">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                <h3 className="text-[#2D2E30] font-semibold flex-1">
                                  {seller.shopName}
                                </h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold self-start ${
                                  seller.status === SellerStatus.PENDING ? "bg-yellow-100 text-yellow-800" :
                                  seller.status === SellerStatus.APPROVED ? "bg-green-100 text-green-800" :
                                  "bg-red-100 text-red-800"
                                }`}>
                                  {SellerStatusLabels[seller.status]}
                                </span>
                              </div>
                              
                              <p className="text-[#2D2E30]/70 text-sm mb-3">
                                {seller.description || 'Описание не указано'}
                              </p>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#2D2E30]/70">
                                <span>📧 {seller.contactEmail}</span>
                                {seller.contactPhone && <span>📱 {seller.contactPhone}</span>}
                                <span>🏢 {CompanyTypeLabels[seller.companyType as CompanyType] || seller.companyType}</span>
                                <span>📋 ИНН: {seller.inn}</span>
                                <span className="sm:col-span-2">📅 {new Date(seller.createdAt).toLocaleDateString('ru-RU')}</span>
                              </div>
                            </div>

                            {/* Поля для причины отклонения/блокировки */}
                            {seller.status === SellerStatus.PENDING && (
                              <div className="mb-3 space-y-2">
                                <div>
                                  <Label className="text-[#2D2E30] text-xs mb-1">
                                    Причина отклонения (для повторной подачи)
                                  </Label>
                                  <Input
                                    value={rejectReason[seller.id] || ''}
                                    onChange={(e) => setRejectReason(prev => ({
                                      ...prev,
                                      [seller.id]: e.target.value
                                    }))}
                                    placeholder="Например: Нужны дополнительные документы..."
                                    className="text-sm"
                                    disabled={processingId === seller.id}
                                  />
                                </div>
                                <div>
                                  <Label className="text-[#2D2E30] text-xs mb-1">
                                    Причина блокировки (запрет деятельности)
                                  </Label>
                                  <Input
                                    value={blockReason[seller.id] || ''}
                                    onChange={(e) => setBlockReason(prev => ({
                                      ...prev,
                                      [seller.id]: e.target.value
                                    }))}
                                    placeholder="Например: Нарушение правил площадки..."
                                    className="text-sm"
                                    disabled={processingId === seller.id}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                              {seller.status === SellerStatus.PENDING && (
                                <>
                                  <Button
                                    onClick={() => handleApproveSeller(seller.id)}
                                    disabled={processingId !== null}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                                  >
                                    {processingId === seller.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                    ) : (
                                      <Check className="w-3 h-3 mr-1" />
                                    )}
                                    <span className="hidden sm:inline">Одобрить</span>
                                  </Button>
                                  <Button
                                    onClick={() => handleRejectSeller(seller.id)}
                                    disabled={processingId !== null}
                                    size="sm"
                                    variant="outline"
                                    className="border-yellow-600 text-yellow-600 hover:bg-yellow-50 text-xs h-8"
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    <span className="hidden sm:inline">Отклонить</span>
                                  </Button>
                                  <Button
                                    onClick={() => handleBlockSeller(seller.id)}
                                    disabled={processingId !== null}
                                    size="sm"
                                    variant="outline"
                                    className="border-red-600 text-red-600 hover:bg-red-50 text-xs h-8"
                                  >
                                    <X className="w-3 h-3 mr-1" />
                                    <span className="hidden sm:inline">Заблокировать</span>
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-[#2B4A39] text-xs h-8"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                <span className="hidden sm:inline">Подробнее</span>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* КАТЕГОРИИ */}
                {currentSection === "categories" && (
                  <div className="bg-white rounded-xl shadow-md p-4 lg:p-6">
                    <div className="flex flex-col gap-4 mb-6">
                      <h2 className="text-[#2B4A39] font-semibold text-xl">
                        Категории каталога
                      </h2>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2D2E30]/50" />
                        <Input
                          type="text"
                          placeholder="Поиск категории..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      {filteredCategories.map(category => (
                        <div key={category.id} className="border border-[#2D2E30]/10 rounded-lg p-4 hover:border-[#BCCEA9] transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-[#2D2E30]">
                                  {category.name}
                                </h3>
                                <span className="text-xs text-[#2D2E30]/50">({category.slug})</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  category.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                }`}>
                                  {category.isActive ? "Активна" : "Неактивна"}
                                </span>
                              </div>
                              {category.description && (
                                <p className="text-[#2D2E30]/70 text-sm mb-2">{category.description}</p>
                              )}
                              <div className="flex flex-wrap gap-2 text-xs text-[#2D2E30]/70">
                                {category.categoryType && (
                                  <span>Тип: {category.categoryType}</span>
                                )}
                                {category.parentId && (
                                  <span>• Родитель ID: {category.parentId}</span>
                                )}
                                <span>• Уровень: {category.level || 0}</span>
                                <span>• Порядок: {category.sortOrder || 0}</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                onClick={() => toggleCategoryActive(category.id, category.isActive)}
                                disabled={processingId === category.id}
                                size="sm"
                                className={category.isActive 
                                  ? "bg-gray-600 hover:bg-gray-700 text-white text-xs h-7"
                                  : "bg-green-600 hover:bg-green-700 text-white text-xs h-7"
                                }
                              >
                                {processingId === category.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  category.isActive ? 
                                    <X className="w-3 h-3 mr-1" /> :
                                    <Check className="w-3 h-3 mr-1" />
                                )}
                                <span className="hidden sm:inline">
                                  {category.isActive ? 'Отключить' : 'Включить'}
                                </span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-[#2B4A39] h-7"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                onClick={() => deleteCategory(category.id)}
                                disabled={processingId === category.id}
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 h-7"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {filteredCategories.length === 0 && (
                      <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-[#2D2E30]/30 mx-auto mb-3" />
                        <p className="text-[#2D2E30]/70">
                          {categories.length === 0 ? 'Нет категорий' : 'Категории не найдены'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* БРЕНДЫ */}
                {currentSection === "brands" && (
                  <div className="bg-white rounded-xl shadow-md p-4 lg:p-6">
                    <div className="flex flex-col gap-4 mb-6">
                      <h2 className="text-[#2B4A39] font-semibold text-xl">
                        Управление брендами
                      </h2>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2D2E30]/50" />
                          <Input
                            type="text"
                            placeholder="Поиск бренда..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {filteredBrands.map(brand => (
                        <div key={brand.id} className="border border-[#2D2E30]/10 rounded-lg p-4 hover:border-[#BCCEA9] transition-colors">
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="w-full sm:w-24 h-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                              {brand.logoUrl ? (
                                <img 
                                  src={brand.logoUrl} 
                                  alt={brand.name}
                                  className="w-full h-full object-contain p-2"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <BookOpen className="w-8 h-8" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1">
                                  <h3 className="text-[#2D2E30] font-semibold text-base">
                                    {brand.name}
                                  </h3>
                                  {brand.country && (
                                    <p className="text-[#2D2E30]/50 text-sm">{brand.country}</p>
                                  )}
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold shrink-0 ${
                                  brand.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                }`}>
                                  {brand.isActive ? "Активен" : "Неактивен"}
                                </span>
                              </div>
                              
                              {brand.description && (
                                <p className="text-[#2D2E30]/70 text-sm mb-2 line-clamp-2">
                                  {brand.description}
                                </p>
                              )}

                              <p className="text-[#2D2E30]/70 text-xs mb-3">
                                Slug: {brand.slug} • Создан: {new Date(brand.createdAt).toLocaleDateString('ru-RU')}
                              </p>

                              <div className="flex flex-wrap gap-2">
                                <Button
                                  onClick={() => toggleBrandActive(brand.id, brand.isActive)}
                                  disabled={processingId === brand.id}
                                  size="sm"
                                  className={brand.isActive 
                                    ? "bg-gray-600 hover:bg-gray-700 text-white text-xs h-8"
                                    : "bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                                  }
                                >
                                  {processingId === brand.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  ) : (
                                    brand.isActive ? 
                                      <X className="w-3 h-3 mr-1" /> :
                                      <Check className="w-3 h-3 mr-1" />
                                  )}
                                  <span className="hidden sm:inline">
                                    {brand.isActive ? 'Деактивировать' : 'Активировать'}
                                  </span>
                                </Button>
                                <Button
                                  onClick={() => deleteBrand(brand.id)}
                                  disabled={processingId === brand.id}
                                  size="sm"
                                  variant="outline"
                                  className="border-red-600 text-red-600 hover:bg-red-50 text-xs h-8"
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  <span className="hidden sm:inline">Удалить</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-[#2B4A39] text-xs h-8"
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  <span className="hidden sm:inline">Редактировать</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {filteredBrands.length === 0 && (
                      <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-[#2D2E30]/30 mx-auto mb-3" />
                        <p className="text-[#2D2E30]/70">
                          {brands.length === 0 ? 'Нет брендов' : 'Бренды не найдены'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

