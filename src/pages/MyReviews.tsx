import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, MessageSquare, Clock, Check, X as XIcon } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import StarRating from '../components/reviews/StarRating';
import ReviewImageGallery from '../components/reviews/ReviewImageGallery';
import { reviewService } from '../api/reviewService';
import { ReviewDto } from '../types/review';

const statusLabels: Record<string, string> = {
  PENDING_MODERATION: 'На модерации',
  APPROVED: 'Опубликован',
  REJECTED: 'Отклонён',
};

const statusIcons: Record<string, React.ReactNode> = {
  PENDING_MODERATION: <Clock className="w-3.5 h-3.5" />,
  APPROVED: <Check className="w-3.5 h-3.5" />,
  REJECTED: <XIcon className="w-3.5 h-3.5" />,
};

const statusColors: Record<string, string> = {
  PENDING_MODERATION: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const MyReviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [galleryImages, setGalleryImages] = useState<ReviewDto['images'] | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    reviewService
      .getMyReviews()
      .then(setReviews)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Мои отзывы</h1>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="w-14 h-14 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-lg mb-1">У вас пока нет отзывов</p>
              <p className="text-gray-400 text-sm">
                Вы сможете оставить отзыв после получения заказа
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-xl border border-gray-200 p-5"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <StarRating rating={review.rating} size="sm" />
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                            statusColors[review.status]
                          }`}
                        >
                          {statusIcons[review.status]}
                          {statusLabels[review.status]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
                    </div>
                  </div>

                  {/* Comment */}
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    {review.comment}
                  </p>

                  {/* Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {review.images.map((img, idx) => (
                        <button
                          key={img.id}
                          onClick={() => {
                            setGalleryImages(review.images);
                            setGalleryIndex(idx);
                          }}
                          className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:border-primary-400 transition-colors"
                        >
                          <img
                            src={img.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Rejection reason */}
                  {review.status === 'REJECTED' && review.rejectionReason && (
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-3 text-sm text-red-700">
                      <strong>Причина отклонения:</strong> {review.rejectionReason}
                    </div>
                  )}

                  {/* Seller response */}
                  {review.sellerResponse && review.sellerResponse.status === 'APPROVED' && (
                    <div className="ml-4 bg-gray-50 rounded-lg p-3 border-l-2 border-primary-300">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-medium text-primary-700">
                          {review.sellerResponse.sellerShopName || 'Продавец'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(review.sellerResponse.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{review.sellerResponse.comment}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Image gallery modal */}
      {galleryImages && (
        <ReviewImageGallery
          images={galleryImages}
          initialIndex={galleryIndex}
          onClose={() => setGalleryImages(null)}
        />
      )}
    </div>
  );
};

export default MyReviews;
