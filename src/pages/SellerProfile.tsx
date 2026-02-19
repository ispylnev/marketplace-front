import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, MessageCircle, Heart, Flag, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { ProfileMenuItem } from "../components/ProfileMenuItem";
import Header from "../components/Header";
import { Separator } from "../components/ui/separator";
import { Button } from "../components/ui/button";
import { sellerService } from '../api/sellerService';
import { searchService, OfferSearchResponse } from '../api/searchService';
import { reviewService } from '../api/reviewService';
import { SellerResponse } from '../types/seller';
import { Product } from '../types';
import { ReviewDto } from '../types/review';
import { extractId, makeFullSlug } from '../utils/slugUtils';
import ProductCard from '../components/ProductCard';
import ReviewCard from '../components/reviews/ReviewCard';
import ReportDialog from '../components/ReportDialog';
import profileAvatar from '../assets/c5c335b900c25c01ebdade434d4ee2ee9ce87b4b.png';
import avatarBackground from '../assets/4068108bae8ada353e34675c0c754fb530d30e98.png';

const OFFERS_PAGE_SIZE = 12;
const REVIEWS_PAGE_SIZE = 10;

const formatPrice = (price?: number): string => {
  if (price === undefined || price === null) return '0';
  return price.toLocaleString('ru-RU');
};

const SellerProfile = () => {
  const { slugWithId } = useParams<{ slugWithId: string }>();
  const sellerId = extractId(slugWithId);
  const [seller, setSeller] = useState<SellerResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Offers state
  const [offers, setOffers] = useState<Product[]>([]);
  const [offersPage, setOffersPage] = useState(0);
  const [offersTotalPages, setOffersTotalPages] = useState(0);
  const [offersTotal, setOffersTotal] = useState(0);
  const [loadingOffers, setLoadingOffers] = useState(true);

  // Reviews state
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [reviewsPage, setReviewsPage] = useState(0);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Report dialog state
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  useEffect(() => {
    loadSellerProfile();
  }, [sellerId]);

  useEffect(() => {
    if (sellerId) {
      loadOffers();
    }
  }, [sellerId, offersPage]);

  const loadSellerProfile = async () => {
    if (!sellerId) {
      setLoading(false);
      setLoadingOffers(false);
      setLoadingReviews(false);
      return;
    }

    try {
      const [sellerResult, reviewsResult] = await Promise.allSettled([
        sellerService.getSeller(sellerId),
        reviewService.getSellerReviewsPublic(sellerId, 0, REVIEWS_PAGE_SIZE),
      ]);

      if (sellerResult.status === 'fulfilled') {
        setSeller(sellerResult.value);
      } else {
        console.error('Ошибка загрузки профиля продавца:', sellerResult.reason);
        setSeller(null);
      }

      if (reviewsResult.status === 'fulfilled') {
        const data = reviewsResult.value;
        setReviews(data);
        setHasMoreReviews(data.length === REVIEWS_PAGE_SIZE);
        setReviewsPage(0);
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля продавца:', error);
      setSeller(null);
    } finally {
      setLoading(false);
      setLoadingReviews(false);
    }
  };

  const loadOffers = async () => {
    if (!sellerId) return;
    setLoadingOffers(true);
    try {
      const response: OfferSearchResponse = await searchService.searchOffers({
        sellerId,
        page: offersPage,
        size: OFFERS_PAGE_SIZE,
      });

      const converted: Product[] = response.hits.map(hit => ({
        id: String(hit.offerId),
        name: hit.title,
        fullSlug: makeFullSlug(hit.title, hit.offerId),
        price: hit.price ? formatPrice(hit.price) : 'Цена не указана',
        image: hit.mainImageUrl || hit.mainImageThumbnailUrl || 'https://via.placeholder.com/300',
        rating: hit.averageRating || 0,
        reviews: hit.reviewCount || 0,
        category: hit.categoryName,
        description: hit.description,
        seller: hit.sellerName ? {
          name: hit.sellerName,
          rating: hit.sellerRating || 0,
        } : undefined,
      }));

      setOffers(converted);
      setOffersTotalPages(response.totalPages);
      setOffersTotal(response.totalHits);
    } catch (error) {
      console.error('Ошибка загрузки офферов продавца:', error);
      setOffers([]);
    } finally {
      setLoadingOffers(false);
    }
  };

  const loadMoreReviews = async () => {
    if (!sellerId) return;
    const nextPage = reviewsPage + 1;
    setLoadingReviews(true);
    try {
      const data = await reviewService.getSellerReviewsPublic(sellerId, nextPage, REVIEWS_PAGE_SIZE);
      setReviews(prev => [...prev, ...data]);
      setReviewsPage(nextPage);
      setHasMoreReviews(data.length === REVIEWS_PAGE_SIZE);
    } catch (error) {
      console.error('Ошибка загрузки отзывов:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const renderOffersPagination = () => {
    if (offersTotalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (offersTotalPages <= maxVisible) {
      for (let i = 0; i < offersTotalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      if (offersPage > 2) pages.push('...');
      const start = Math.max(1, offersPage - 1);
      const end = Math.min(offersTotalPages - 2, offersPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (offersPage < offersTotalPages - 3) pages.push('...');
      pages.push(offersTotalPages - 1);
    }

    return (
      <div className="mt-6 flex justify-center">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setOffersPage(p => p - 1)}
            disabled={offersPage === 0}
            className={`px-3 py-2 flex items-center gap-1 rounded-xl text-sm font-medium transition-all ${
              offersPage > 0
                ? 'bg-white border border-gray-200 hover:border-primary-300'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-4 h-4" /> Назад
          </button>

          {pages.map((page, idx) =>
            typeof page === 'number' ? (
              <button
                key={idx}
                onClick={() => setOffersPage(page)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  page === offersPage
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg'
                    : 'bg-white border border-gray-200 hover:border-primary-300'
                }`}
              >
                {page + 1}
              </button>
            ) : (
              <span key={idx} className="px-2 text-gray-400">...</span>
            )
          )}

          <button
            onClick={() => setOffersPage(p => p + 1)}
            disabled={offersPage >= offersTotalPages - 1}
            className={`px-3 py-2 flex items-center gap-1 rounded-xl text-sm font-medium transition-all ${
              offersPage < offersTotalPages - 1
                ? 'bg-white border border-gray-200 hover:border-primary-300'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Вперёд <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Продавец не найден</p>
            <a href="/catalog" className="text-primary-600 hover:underline">&larr; Вернуться в каталог</a>
          </div>
        </div>
      </div>
    );
  }

  const sellerProfile = {
    name: seller.shopName,
    avatar: seller.logoUrl || profileAvatar,
    rating: seller.rating || 0,
    reviewsCount: seller.reviewCount || 0,
    description: seller.description || '',
  };

  return (
    <div className="min-h-screen">
      <Header />

      <div className="min-h-screen bg-white py-2 md:py-5">
        <div className="max-w-6xl mx-auto flex flex-col gap-5 px-2 md:px-5 items-center">
          {/* Профиль */}
          <div className="w-full lg:max-w-4xl bg-white shadow-lg rounded-2xl overflow-hidden lg:pb-0 flex-shrink-0">
            {/* Шапка профиля */}
            <div
              className="px-3 py-3 bg-cover bg-center"
              style={{ backgroundImage: `url(${avatarBackground})` }}
            >
              <div className="flex items-start gap-3">
                {/* Фото */}
                <div className="relative flex-shrink-0">
                  <img
                    src={sellerProfile.avatar}
                    alt={sellerProfile.name}
                    className="w-20 h-20 md:w-36 md:h-36 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                </div>

                {/* Никнейм, статус и рейтинг */}
                <div className="flex flex-col justify-center flex-1 pt-1">
                  <h1 className="text-white text-lg md:text-2xl font-bold leading-tight">{sellerProfile.name}</h1>

                  {/* Статус */}
                  {sellerProfile.description && (
                    <div className="mt-2 mb-2 md:mt-3 md:mb-4 bg-white/20 backdrop-blur-sm rounded-lg px-2 md:px-3 py-1.5 md:py-2 border border-white/30">
                      <p className="text-white text-xs md:text-sm leading-tight">
                        {sellerProfile.description}
                      </p>
                    </div>
                  )}

                  {/* Рейтинг */}
                  <div className="flex items-center gap-1 md:gap-2 mb-2 md:mb-4">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          fill={i < Math.floor(sellerProfile.rating) ? "#eab308" : "rgba(255,255,255,0.4)"}
                          className={`w-4 h-4 md:w-7 md:h-7 ${
                            i < Math.floor(sellerProfile.rating)
                              ? "text-yellow-500"
                              : "text-white opacity-40"
                          }`}
                          style={
                            i < Math.floor(sellerProfile.rating)
                              ? { filter: "drop-shadow(0 2px 4px rgba(234,179,8,0.6)) drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }
                              : undefined
                          }
                        />
                      ))}
                    </div>
                    <span className="text-white text-sm md:text-lg font-bold">{sellerProfile.rating}</span>
                    <button
                      onClick={() => document.getElementById('seller-reviews')?.scrollIntoView({ behavior: 'smooth' })}
                      className="text-[#BCCEA9] text-xs md:text-base hover:text-white transition-colors cursor-pointer"
                    >
                      &bull; {sellerProfile.reviewsCount} отзывов
                    </button>
                  </div>

                  {/* Кнопки действий */}
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-[#BCCEA9] hover:bg-[#a8ba95] text-[#2B4A39] h-8 md:h-9 text-xs md:text-sm px-2 md:px-4" size="sm">
                      <MessageCircle className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                      <span className="hidden sm:inline">Написать сообщение</span>
                      <span className="sm:hidden">Сообщение</span>
                    </Button>
                    <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/30 h-8 md:h-9 w-8 md:w-9 p-0" size="sm">
                      <Heart className="w-3 h-3 md:w-4 md:h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Контактная информация */}
            {(seller.contactEmail || seller.contactPhone) && (
              <>
                <div className="p-3 md:p-6 bg-[#F8F9FA] rounded-lg m-3 md:m-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {seller.contactEmail && (
                      <div>
                        <p className="text-[#2D2E30] font-semibold text-sm md:text-base">Email</p>
                        <p className="text-[#2D2E30]/70 text-sm md:text-base">{seller.contactEmail}</p>
                      </div>
                    )}
                    {seller.contactPhone && (
                      <div>
                        <p className="text-[#2D2E30] font-semibold text-sm md:text-base">Телефон</p>
                        <p className="text-[#2D2E30]/70 text-sm md:text-base">{seller.contactPhone}</p>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Пожаловаться на профиль */}
            <div className="py-2 pb-0">
              <ProfileMenuItem
                icon={Flag}
                label="Пожаловаться на профиль"
                variant="danger"
                onClick={() => setReportDialogOpen(true)}
              />
            </div>
          </div>

          {/* Офферы продавца */}
          <div className="w-full lg:max-w-4xl">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
              Товары продавца
              {!loadingOffers && offersTotal > 0 && (
                <span className="text-sm font-normal text-gray-500 ml-2">({offersTotal})</span>
              )}
            </h2>

            {loadingOffers && offers.length === 0 ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : offers.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl">
                <p className="text-gray-500">У продавца пока нет товаров</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {offers.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {renderOffersPagination()}
              </>
            )}
          </div>

          {/* Отзывы */}
          <div id="seller-reviews" className="w-full lg:max-w-4xl">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
              Отзывы
              {reviews.length > 0 && (
                <span className="text-sm font-normal text-gray-500 ml-2">({sellerProfile.reviewsCount})</span>
              )}
            </h2>

            {loadingReviews && reviews.length === 0 ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl">
                <p className="text-gray-500">Пока нет отзывов</p>
              </div>
            ) : (
              <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-4 md:p-6">
                {reviews.map(review => (
                  <ReviewCard key={review.id} review={review} />
                ))}

                {hasMoreReviews && (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={loadMoreReviews}
                      disabled={loadingReviews}
                      className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-primary-300 hover:text-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loadingReviews ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Загрузка...
                        </>
                      ) : (
                        'Показать ещё'
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Dialog */}
      <ReportDialog
        entityType="SELLER"
        entityId={seller.id}
        entityName={seller.shopName}
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
      />
    </div>
  );
};

export default SellerProfile;
