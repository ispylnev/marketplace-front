import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Users, FolderTree, BookOpen, LogOut, Loader2, Lock, FileEdit, MessageSquare, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { adminService, OfferForModeration, CategoryResponse, BrandResponse } from '../api/adminService';
import { moderationService, EditRequestResponse } from '../api/moderationService';
import { reviewService } from '../api/reviewService';
import { reportService, ReportResponse } from '../api/reportService';
import { SellerResponse, SellerStatus } from '../types/seller';
import { ReviewDto } from '../types/review';
import { OfferModerationTab, SellerModerationTab, ReviewModerationTab, ReportsModerationTab, CategoriesTab, BrandsTab } from '../components/admin';

type Section = 'offers' | 'sellers' | 'reviews' | 'reports' | 'categories' | 'brands' | 'editChanges';

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
  const [editRequests, setEditRequests] = useState<EditRequestResponse[]>([]);
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [reports, setReports] = useState<ReportResponse[]>([]);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        adminService.getPendingOffers(),
        adminService.getPendingSellers(),
        adminService.getCategories(),
        adminService.getAllBrands(),
        moderationService.getPendingRequests(),
        reviewService.getPendingReviews(),
        reportService.getPendingReports(),
      ]);

      const [offersResult, sellersResult, categoriesResult, brandsResult, editRequestsResult, reviewsResult, reportsResult] = results;

      setOffers(offersResult.status === 'fulfilled' ? offersResult.value : []);
      setSellers(sellersResult.status === 'fulfilled' ? sellersResult.value : []);
      setCategories(categoriesResult.status === 'fulfilled' ? categoriesResult.value : []);
      setBrands(brandsResult.status === 'fulfilled' ? brandsResult.value : []);
      setEditRequests(editRequestsResult.status === 'fulfilled' ? editRequestsResult.value : []);
      setReviews(reviewsResult.status === 'fulfilled' ? reviewsResult.value : []);
      setReports(reportsResult.status === 'fulfilled' ? reportsResult.value : []);

      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        showError(`Не удалось загрузить ${failed.length} из ${results.length} разделов`);
      }
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
    try {
      await adminService.approveOffer(id);
      setOffers(prev => prev.map(o => o.id === id ? { ...o, status: 'APPROVED' } : o));
      showSuccess('Оффер одобрен');
    } catch (e: any) {
      showError(e?.response?.data?.message || 'Ошибка одобрения оффера');
      throw e;
    }
  };

  const handleRejectOffer = async (id: number, reason: string) => {
    try {
      await adminService.rejectOffer(id, reason);
      setOffers(prev => prev.map(o => o.id === id ? { ...o, status: 'REJECTED', rejectionReason: reason } : o));
      showSuccess('Оффер отклонён');
    } catch (e: any) {
      showError(e?.response?.data?.message || 'Ошибка отклонения оффера');
      throw e;
    }
  };

  // Seller handlers
  const handleApproveSeller = async (id: number) => {
    try {
      await adminService.approveSeller(id);
      setSellers(prev => prev.filter(s => s.id !== id));
      showSuccess('Продавец одобрен');
    } catch (e: any) {
      showError(e?.response?.data?.message || 'Ошибка одобрения продавца');
      throw e;
    }
  };

  const handleRejectSeller = async (id: number, reason: string) => {
    try {
      await adminService.rejectSeller(id, reason);
      setSellers(prev => prev.filter(s => s.id !== id));
      showSuccess('Заявка отклонена');
    } catch (e: any) {
      showError(e?.response?.data?.message || 'Ошибка отклонения заявки');
      throw e;
    }
  };

  const handleBlockSeller = async (id: number, reason: string) => {
    try {
      await adminService.blockSeller(id, reason);
      setSellers(prev => prev.filter(s => s.id !== id));
      showSuccess('Продавец заблокирован');
    } catch (e: any) {
      showError(e?.response?.data?.message || 'Ошибка блокировки продавца');
      throw e;
    }
  };

  // Category handlers
  const handleToggleCategoryActive = async (id: number, isActive: boolean) => {
    try {
      const updated = isActive
        ? await adminService.deactivateCategory(id)
        : await adminService.activateCategory(id);
      setCategories(prev => prev.map(c => c.id === id ? updated : c));
      showSuccess(isActive ? 'Категория отключена' : 'Категория включена');
    } catch (e: any) {
      showError(e?.response?.data?.message || 'Ошибка изменения категории');
      throw e;
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await adminService.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      showSuccess('Категория удалена');
    } catch (e: any) {
      showError(e?.response?.data?.message || 'Ошибка удаления категории');
      throw e;
    }
  };

  // Brand handlers
  const handleToggleBrandActive = async (id: number, isActive: boolean) => {
    try {
      const updated = isActive
        ? await adminService.deactivateBrand(id)
        : await adminService.activateBrand(id);
      setBrands(prev => prev.map(b => b.id === id ? updated : b));
      showSuccess(isActive ? 'Бренд деактивирован' : 'Бренд активирован');
    } catch (e: any) {
      showError(e?.response?.data?.message || 'Ошибка изменения бренда');
      throw e;
    }
  };

  const handleDeleteBrand = async (id: number) => {
    try {
      await adminService.deleteBrand(id);
      setBrands(prev => prev.filter(b => b.id !== id));
      showSuccess('Бренд удалён');
    } catch (e: any) {
      showError(e?.response?.data?.message || 'Ошибка удаления бренда');
      throw e;
    }
  };

  // Edit request handlers
  const handleApproveEditRequest = async (id: number) => {
    try {
      await moderationService.approveRequest(id);
      setEditRequests(prev => prev.filter(r => r.id !== id));
      showSuccess('Изменения одобрены');
    } catch (e: any) {
      showError(e?.response?.data?.message || 'Ошибка одобрения изменений');
      throw e;
    }
  };

  const handleRejectEditRequest = async (id: number, reason: string) => {
    try {
      await moderationService.rejectRequest(id, reason);
      setEditRequests(prev => prev.filter(r => r.id !== id));
      showSuccess('Изменения отклонены');
    } catch (e: any) {
      showError(e?.response?.data?.message || 'Ошибка отклонения изменений');
      throw e;
    }
  };

  // Review handlers
  const handleApproveReview = async (id: number) => {
    try {
      await reviewService.approveReview(id);
      setReviews(prev => prev.filter(r => r.id !== id));
      showSuccess('Отзыв одобрен');
    } catch (e: any) {
      showError(e?.response?.data?.message || 'Ошибка одобрения отзыва');
      throw e;
    }
  };

  const handleRejectReview = async (id: number, reason: string) => {
    try {
      await reviewService.rejectReview(id, reason);
      setReviews(prev => prev.filter(r => r.id !== id));
      showSuccess('Отзыв отклонён');
    } catch (e: any) {
      showError(e?.response?.data?.message || 'Ошибка отклонения отзыва');
      throw e;
    }
  };

  // Report handlers
  const handleApproveReport = async (id: number, comment?: string) => {
    try {
      await reportService.approveReport(id, comment);
      setReports(prev => prev.filter(r => r.id !== id));
      showSuccess('Жалоба одобрена');
    } catch (e: any) {
      showError(e?.response?.data?.message || 'Ошибка одобрения жалобы');
      throw e;
    }
  };

  const handleRejectReport = async (id: number, comment?: string) => {
    try {
      await reportService.rejectReport(id, comment);
      setReports(prev => prev.filter(r => r.id !== id));
      showSuccess('Жалоба отклонена');
    } catch (e: any) {
      showError(e?.response?.data?.message || 'Ошибка отклонения жалобы');
      throw e;
    }
  };

  // Stats
  const pendingOffersCount = offers.filter(o => o.status === 'PENDING_REVIEW').length;
  const pendingSellersCount = sellers.filter(s => s.status === SellerStatus.PENDING).length;
  const pendingReviewsCount = reviews.filter(r => r.status === 'PENDING_MODERATION').length;
  const pendingReportsCount = reports.length;
  const pendingEditRequestsCount = editRequests.length;

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#2B4A39]" />
      </div>
    );
  }

  // Нет прав доступа - показываем страницу с предложением войти
  if (!isModerator) {
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
                onClick={() => {
                  logout();
                  navigate('/login?redirect=/admin');
                }}
                className="w-full bg-[#2B4A39] hover:bg-[#234135] text-white py-3"
              >
                Войти под другим аккаунтом
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
              <p>Если у вас есть права доступа, войдите в систему с аккаунтом администратора.</p>
            </div>
          </div>
        </div>
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
                  active={currentSection === 'reviews'}
                  onClick={() => setCurrentSection('reviews')}
                  icon={<MessageSquare className="w-5 h-5" />}
                  label="Модерация отзывов"
                  badge={pendingReviewsCount}
                />
                <NavButton
                  active={currentSection === 'reports'}
                  onClick={() => setCurrentSection('reports')}
                  icon={<AlertTriangle className="w-5 h-5" />}
                  label="Жалобы"
                  badge={pendingReportsCount}
                />
                <NavButton
                  active={currentSection === 'categories'}
                  onClick={() => setCurrentSection('categories')}
                  icon={<FolderTree className="w-5 h-5" />}
                  label="Категории"
                />
                <NavButton
                  active={currentSection === 'editChanges'}
                  onClick={() => setCurrentSection('editChanges')}
                  icon={<FileEdit className="w-5 h-5" />}
                  label="Изменения"
                  badge={pendingEditRequestsCount}
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
            pendingReviewsCount={pendingReviewsCount}
            pendingReportsCount={pendingReportsCount}
            pendingEditRequestsCount={pendingEditRequestsCount}
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
                {currentSection === 'reviews' && (
                  <ReviewModerationTab
                    reviews={reviews}
                    onApprove={handleApproveReview}
                    onReject={handleRejectReview}
                  />
                )}
                {currentSection === 'reports' && (
                  <ReportsModerationTab
                    reports={reports}
                    onApprove={handleApproveReport}
                    onReject={handleRejectReport}
                  />
                )}
                {currentSection === 'categories' && (
                  <CategoriesTab
                    categories={categories}
                    onToggleActive={handleToggleCategoryActive}
                    onDelete={handleDeleteCategory}
                  />
                )}
                {currentSection === 'editChanges' && (
                  <EditChangesTab
                    requests={editRequests}
                    onApprove={handleApproveEditRequest}
                    onReject={handleRejectEditRequest}
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
  pendingReviewsCount,
  pendingReportsCount,
  pendingEditRequestsCount,
  onLogout,
}: {
  currentSection: Section;
  onSectionChange: (section: Section) => void;
  pendingOffersCount: number;
  pendingSellersCount: number;
  pendingReviewsCount: number;
  pendingReportsCount: number;
  pendingEditRequestsCount: number;
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
          active={currentSection === 'reviews'}
          onClick={() => onSectionChange('reviews')}
          icon={<MessageSquare className="w-5 h-5" />}
          label="Отзывы"
          badge={pendingReviewsCount}
        />
        <MobileNavButton
          active={currentSection === 'reports'}
          onClick={() => onSectionChange('reports')}
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Жалобы"
          badge={pendingReportsCount}
        />
        <MobileNavButton
          active={currentSection === 'editChanges'}
          onClick={() => onSectionChange('editChanges')}
          icon={<FileEdit className="w-5 h-5" />}
          label="Изменения"
          badge={pendingEditRequestsCount}
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

// Edit Changes Tab component
function EditChangesTab({
  requests,
  onApprove,
  onReject,
}: {
  requests: EditRequestResponse[];
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number, reason: string) => Promise<void>;
}) {
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fieldNameLabels: Record<string, string> = {
    title: 'Название',
    description: 'Описание',
    categoryId: 'Категория',
    taxonomyId: 'Таксономия',
    brandId: 'Бренд',
    price: 'Цена',
    condition: 'Состояние',
    barcode: 'Штрихкод',
    handlingTimeDays: 'Срок обработки',
    warrantyMonths: 'Гарантия',
    shipping: 'Доставка',
    images: 'Изображения',
    shopName: 'Название магазина',
    logoUrl: 'Логотип',
    contactEmail: 'Email',
    contactPhone: 'Телефон',
  };

  const handleApprove = async (id: number) => {
    setProcessingId(id);
    try {
      await onApprove(id);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!rejectReason.trim()) return;
    setProcessingId(id);
    try {
      await onReject(id, rejectReason.trim());
      setRejectingId(null);
      setRejectReason('');
    } finally {
      setProcessingId(null);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <FileEdit className="w-12 h-12 mx-auto text-[#BCCEA9] mb-4" />
        <h3 className="text-lg font-semibold text-[#2B4A39] mb-2">Нет заявок на модерацию</h3>
        <p className="text-[#2D2E30]/70">Все изменения обработаны</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="text-lg font-semibold text-[#2B4A39] mb-1">Модерация изменений</h3>
        <p className="text-sm text-[#2D2E30]/70">Заявки на редактирование одобренных офферов и магазинов</p>
      </div>

      {requests.map((req) => (
        <div key={req.id} className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  req.entityType === 'OFFER' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                }`}>
                  {req.entityType === 'OFFER' ? 'Оффер' : 'Магазин'} #{req.entityId}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  req.status === 'PENDING_MANUAL' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {req.status === 'PENDING_MANUAL' ? 'Ручная проверка' : 'Авто-проверка'}
                </span>
              </div>
              <p className="text-sm text-[#2D2E30]/70">
                Продавец: {req.sellerShopName || `#${req.sellerId}`} | {new Date(req.createdAt).toLocaleString('ru-RU')}
              </p>
            </div>
          </div>

          {/* Auto-moderation result */}
          {req.autoResult && !req.autoResult.passed && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-red-700 mb-1">Авто-модерация выявила нарушения:</p>
              <ul className="text-sm text-red-600 list-disc pl-4">
                {req.autoResult.violations.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Changes diff */}
          <div className="space-y-3 mb-4">
            {req.changes.map((change, idx) => (
              <div key={idx} className="border border-[#2D2E30]/10 rounded-lg p-3">
                <p className="text-sm font-medium text-[#2B4A39] mb-2">
                  {fieldNameLabels[change.fieldName] || change.fieldName}
                </p>
                {change.fieldName === 'images' && Array.isArray(change.newValue) ? (
                  <div>
                    <p className="text-xs text-green-600 mb-2">Новые изображения на модерации:</p>
                    <div className="flex flex-wrap gap-3">
                      {(change.newValue as Array<{ id: number; url: string; thumbnails?: Record<string, { url?: string }> }>).map((img) => {
                        const thumbUrl = img.thumbnails?.['md']?.url || img.thumbnails?.['sm']?.url || img.url;
                        return (
                          <div key={img.id} className="relative group">
                            <img
                              src={thumbUrl}
                              alt={`Image #${img.id}`}
                              className="w-28 h-28 object-cover rounded-lg border border-[#2D2E30]/10"
                            />
                            <a
                              href={img.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center"
                            >
                              <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-2 py-1 rounded">
                                Открыть
                              </span>
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-red-50 rounded p-2">
                      <p className="text-xs text-red-500 mb-1">Было:</p>
                      <p className="text-sm text-[#2D2E30] break-words">
                        {change.oldValue != null ? String(change.oldValue) : '—'}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded p-2">
                      <p className="text-xs text-green-600 mb-1">Стало:</p>
                      <p className="text-sm text-[#2D2E30] break-words">
                        {change.newValue != null ? String(change.newValue) : '—'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          {rejectingId === req.id ? (
            <div className="space-y-3">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Причина отклонения..."
                className="w-full border border-[#2D2E30]/20 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2B4A39]"
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleReject(req.id)}
                  disabled={!rejectReason.trim() || processingId === req.id}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Отклонить
                </Button>
                <Button
                  onClick={() => { setRejectingId(null); setRejectReason(''); }}
                  variant="outline"
                  size="sm"
                >
                  Отмена
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => handleApprove(req.id)}
                disabled={processingId === req.id}
                className="bg-[#2B4A39] hover:bg-[#234135] text-white"
                size="sm"
              >
                {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Одобрить
              </Button>
              <Button
                onClick={() => setRejectingId(req.id)}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
                size="sm"
              >
                Отклонить
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
