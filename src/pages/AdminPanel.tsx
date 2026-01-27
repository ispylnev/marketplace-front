import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Users, FolderTree, BookOpen, LogOut, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { adminService, OfferForModeration, CategoryResponse, BrandResponse } from '../api/adminService';
import { SellerResponse, SellerStatus } from '../types/seller';
import { OfferModerationTab, SellerModerationTab, CategoriesTab, BrandsTab } from '../components/admin';

type Section = 'offers' | 'sellers' | 'categories' | 'brands';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { isModerator, logout, isLoading: authLoading } = useAuth();
  const { error: showError, success: showSuccess } = useToast();

  const [currentSection, setCurrentSection] = useState<Section>('offers');
  const [loading, setLoading] = useState(true);

  // Data
  const [offers, setOffers] = useState<OfferForModeration[]>([]);
  const [sellers, setSellers] = useState<SellerResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [brands, setBrands] = useState<BrandResponse[]>([]);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
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
    } catch {
      showError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    if (isModerator) {
      loadData();
    }
  }, [isModerator, loadData]);

  // Handlers
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Offer handlers
  const handleApproveOffer = async (id: number) => {
    await adminService.approveOffer(id);
    setOffers(prev => prev.filter(o => o.id !== id));
    showSuccess('Оффер одобрен');
  };

  const handleRejectOffer = async (id: number, reason: string) => {
    await adminService.rejectOffer(id, reason);
    setOffers(prev => prev.filter(o => o.id !== id));
    showSuccess('Оффер отклонён');
  };

  // Seller handlers
  const handleApproveSeller = async (id: number) => {
    await adminService.approveSeller(id);
    setSellers(prev => prev.filter(s => s.id !== id));
    showSuccess('Продавец одобрен');
  };

  const handleRejectSeller = async (id: number, reason: string) => {
    await adminService.rejectSeller(id, reason);
    setSellers(prev => prev.filter(s => s.id !== id));
    showSuccess('Заявка отклонена');
  };

  const handleBlockSeller = async (id: number, reason: string) => {
    await adminService.blockSeller(id, reason);
    setSellers(prev => prev.filter(s => s.id !== id));
    showSuccess('Продавец заблокирован');
  };

  // Category handlers
  const handleToggleCategoryActive = async (id: number, isActive: boolean) => {
    const updated = isActive
      ? await adminService.deactivateCategory(id)
      : await adminService.activateCategory(id);
    setCategories(prev => prev.map(c => c.id === id ? updated : c));
    showSuccess(isActive ? 'Категория отключена' : 'Категория включена');
  };

  const handleDeleteCategory = async (id: number) => {
    await adminService.deleteCategory(id);
    setCategories(prev => prev.filter(c => c.id !== id));
    showSuccess('Категория удалена');
  };

  // Brand handlers
  const handleToggleBrandActive = async (id: number, isActive: boolean) => {
    const updated = isActive
      ? await adminService.deactivateBrand(id)
      : await adminService.activateBrand(id);
    setBrands(prev => prev.map(b => b.id === id ? updated : b));
    showSuccess(isActive ? 'Бренд деактивирован' : 'Бренд активирован');
  };

  const handleDeleteBrand = async (id: number) => {
    await adminService.deleteBrand(id);
    setBrands(prev => prev.filter(b => b.id !== id));
    showSuccess('Бренд удалён');
  };

  // Stats
  const pendingOffersCount = offers.filter(o => o.status === 'PENDING_REVIEW').length;
  const pendingSellersCount = sellers.filter(s => s.status === SellerStatus.PENDING).length;

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#2B4A39]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
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
        <div className="mb-6">
          <h1 className="text-[#2B4A39] text-2xl lg:text-3xl font-bold mb-2">
            Административная панель
          </h1>
          <p className="text-[#2D2E30]/70">
            Управление маркетплейсом растений
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="hidden lg:block w-64 shrink-0">
            <div className="bg-white rounded-xl shadow-md p-4 sticky top-6">
              <h2 className="text-[#2B4A39] font-semibold mb-4">Разделы</h2>
              <nav className="space-y-2">
                <NavButton
                  active={currentSection === 'offers'}
                  onClick={() => setCurrentSection('offers')}
                  icon={<ShoppingBag className="w-5 h-5" />}
                  label="Модерация офферов"
                  badge={pendingOffersCount}
                />
                <NavButton
                  active={currentSection === 'sellers'}
                  onClick={() => setCurrentSection('sellers')}
                  icon={<Users className="w-5 h-5" />}
                  label="Модерация продавцов"
                  badge={pendingSellersCount}
                />
                <NavButton
                  active={currentSection === 'categories'}
                  onClick={() => setCurrentSection('categories')}
                  icon={<FolderTree className="w-5 h-5" />}
                  label="Категории"
                />
                <NavButton
                  active={currentSection === 'brands'}
                  onClick={() => setCurrentSection('brands')}
                  icon={<BookOpen className="w-5 h-5" />}
                  label="Бренды"
                />
              </nav>

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

          {/* Mobile nav */}
          <MobileNav
            currentSection={currentSection}
            onSectionChange={setCurrentSection}
            pendingOffersCount={pendingOffersCount}
            pendingSellersCount={pendingSellersCount}
            onLogout={handleLogout}
          />

          {/* Content */}
          <div className="flex-1">
            {loading ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#2B4A39]" />
                <p className="mt-4 text-gray-600">Загрузка данных...</p>
              </div>
            ) : (
              <>
                {currentSection === 'offers' && (
                  <OfferModerationTab
                    offers={offers}
                    onApprove={handleApproveOffer}
                    onReject={handleRejectOffer}
                  />
                )}
                {currentSection === 'sellers' && (
                  <SellerModerationTab
                    sellers={sellers}
                    onApprove={handleApproveSeller}
                    onReject={handleRejectSeller}
                    onBlock={handleBlockSeller}
                  />
                )}
                {currentSection === 'categories' && (
                  <CategoriesTab
                    categories={categories}
                    onToggleActive={handleToggleCategoryActive}
                    onDelete={handleDeleteCategory}
                  />
                )}
                {currentSection === 'brands' && (
                  <BrandsTab
                    brands={brands}
                    onToggleActive={handleToggleBrandActive}
                    onDelete={handleDeleteBrand}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Nav button component
function NavButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-start gap-2 px-3 py-2.5 rounded-lg transition-colors ${
        active
          ? 'bg-[#BCCEA9] text-[#2B4A39]'
          : 'hover:bg-[#F8F9FA] text-[#2D2E30]'
      }`}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-[#2B4A39] text-white text-xs px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}

// Mobile navigation
function MobileNav({
  currentSection,
  onSectionChange,
  pendingOffersCount,
  pendingSellersCount,
  onLogout,
}: {
  currentSection: Section;
  onSectionChange: (section: Section) => void;
  pendingOffersCount: number;
  pendingSellersCount: number;
  onLogout: () => void;
}) {
  return (
    <div className="lg:hidden mb-4 bg-white rounded-xl shadow-md p-4 w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[#2B4A39] font-semibold">Разделы</h2>
        <Button
          onClick={onLogout}
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-1" />
          Выход
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <MobileNavButton
          active={currentSection === 'offers'}
          onClick={() => onSectionChange('offers')}
          icon={<ShoppingBag className="w-5 h-5" />}
          label="Офферы"
          badge={pendingOffersCount}
        />
        <MobileNavButton
          active={currentSection === 'sellers'}
          onClick={() => onSectionChange('sellers')}
          icon={<Users className="w-5 h-5" />}
          label="Продавцы"
          badge={pendingSellersCount}
        />
        <MobileNavButton
          active={currentSection === 'categories'}
          onClick={() => onSectionChange('categories')}
          icon={<FolderTree className="w-5 h-5" />}
          label="Категории"
        />
        <MobileNavButton
          active={currentSection === 'brands'}
          onClick={() => onSectionChange('brands')}
          icon={<BookOpen className="w-5 h-5" />}
          label="Бренды"
        />
      </div>
    </div>
  );
}

function MobileNavButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
        active
          ? 'bg-[#BCCEA9] text-[#2B4A39]'
          : 'hover:bg-[#F8F9FA] text-[#2D2E30]'
      }`}
    >
      {icon}
      <span className="text-xs">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-[#2B4A39] text-white text-xs px-1.5 rounded-full">{badge}</span>
      )}
    </button>
  );
}
