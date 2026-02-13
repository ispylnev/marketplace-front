import { useState, useEffect, useCallback } from 'react';
import { Loader2, MessageSquare } from 'lucide-react';
import ReviewCard from './ReviewCard';
import ReviewStats from './ReviewStats';
import ReviewForm from './ReviewForm';
import { reviewService } from '../../api/reviewService';
import { ReviewDto, ReviewStatsDto } from '../../types/review';
import { useAuth } from '../../contexts/AuthContext';

interface ReviewListProps {
  offerId: number;
}

const PAGE_SIZE = 10;

const ReviewList = ({ offerId }: ReviewListProps) => {
  const { isAuthenticated } = useAuth();

  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [stats, setStats] = useState<ReviewStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<number | undefined>();

  const [canReview, setCanReview] = useState(false);
  const [eligibleOrderId, setEligibleOrderId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [canReviewChecked, setCanReviewChecked] = useState(false);

  // Load stats and first page
  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      try {
        const [statsData, reviewsData] = await Promise.all([
          reviewService.getOfferRatingStats(offerId),
          reviewService.getOfferReviews(offerId, 0, PAGE_SIZE),
        ]);
        setStats(statsData);
        setReviews(reviewsData);
        setHasMore(reviewsData.length === PAGE_SIZE);
        setPage(0);
      } catch {
        // Ignore - empty state will show
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, [offerId]);

  // Check if user can review
  useEffect(() => {
    if (!isAuthenticated) {
      setCanReviewChecked(true);
      return;
    }
    reviewService.canReview(offerId)
      .then((result) => {
        setCanReview(result.canReview);
        if (result.orderId) {
          setEligibleOrderId(result.orderId);
        }
      })
      .catch((err) => {
        console.error('canReview error:', err?.response?.status, err?.response?.data || err.message);
        setCanReview(false);
      })
      .finally(() => setCanReviewChecked(true));
  }, [offerId, isAuthenticated]);

  // Load reviews with filter
  const loadReviews = useCallback(async (pageNum: number, rating?: number, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const data = await reviewService.getOfferReviews(offerId, pageNum, PAGE_SIZE, rating);
      if (append) {
        setReviews((prev) => [...prev, ...data]);
      } else {
        setReviews(data);
      }
      setHasMore(data.length === PAGE_SIZE);
      setPage(pageNum);
    } catch {
      // Ignore
    } finally {
      if (append) setLoadingMore(false); else setLoading(false);
    }
  }, [offerId]);

  const handleRatingFilter = (rating: number | undefined) => {
    setRatingFilter(rating);
    loadReviews(0, rating);
  };

  const handleLoadMore = () => {
    loadReviews(page + 1, ratingFilter, true);
  };

  const handleReviewSuccess = () => {
    setShowForm(false);
    setReviewSubmitted(true);
    setCanReview(false);
    // Refresh stats
    reviewService.getOfferRatingStats(offerId).then(setStats).catch(() => {});
  };

  if (loading && !stats) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      {stats && stats.reviewCount > 0 && (
        <div className="mb-6">
          <ReviewStats stats={stats} onRatingFilter={handleRatingFilter} activeFilter={ratingFilter} />
        </div>
      )}

      {/* Active filter indicator */}
      {ratingFilter && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-500">
            Фильтр: {ratingFilter} {ratingFilter === 1 ? 'звезда' : ratingFilter < 5 ? 'звезды' : 'звёзд'}
          </span>
          <button
            onClick={() => handleRatingFilter(undefined)}
            className="text-xs text-primary-600 hover:text-primary-700"
          >
            Сбросить
          </button>
        </div>
      )}

      {/* Submit review section */}
      {canReview && !showForm && !reviewSubmitted && (
        <div className="mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Оставить отзыв
          </button>
        </div>
      )}

      {/* Info when can't review */}
      {isAuthenticated && canReviewChecked && !canReview && !reviewSubmitted && (
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
          Чтобы оставить отзыв, необходимо приобрести этот товар и дождаться завершения заказа.
        </div>
      )}

      {reviewSubmitted && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
          Ваш отзыв отправлен на модерацию. Он будет опубликован после проверки.
        </div>
      )}

      {showForm && eligibleOrderId && (
        <div className="mb-6">
          <ReviewForm
            offerId={offerId}
            orderId={eligibleOrderId}
            onSuccess={handleReviewSuccess}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      ) : reviews.length > 0 ? (
        <>
          <div>
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                {loadingMore ? 'Загрузка...' : 'Показать ещё'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">
            {ratingFilter ? 'Нет отзывов с таким рейтингом' : 'Пока нет отзывов'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ReviewList;
