import { useState } from 'react';
import { User, Store, MessageSquare, Flag } from 'lucide-react';
import StarRating from './StarRating';
import ReviewImageGallery from './ReviewImageGallery';
import ReportDialog from '../ReportDialog';
import { ReviewDto } from '../../types/review';

interface ReviewCardProps {
  review: ReviewDto;
  showSellerResponse?: boolean;
  onReply?: (reviewId: number) => void;
  isSellerView?: boolean;
}

const ReviewCard = ({
  review,
  showSellerResponse = true,
  onReply,
  isSellerView = false,
}: ReviewCardProps) => {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="border-b border-gray-100 pb-5 mb-5 last:border-0 last:pb-0 last:mb-0">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {review.buyerDisplayName || 'Покупатель'}
            </p>
            <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StarRating rating={review.rating} size="sm" />
          <button
            onClick={() => setReportDialogOpen(true)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Пожаловаться"
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Comment */}
      <p className="text-sm text-gray-700 leading-relaxed mb-3">{review.comment}</p>

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {review.images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => { setGalleryIndex(idx); setGalleryOpen(true); }}
              className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:border-primary-400 transition-colors"
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Seller reply button */}
      {isSellerView && !review.sellerResponse && onReply && (
        <button
          onClick={() => onReply(review.id)}
          className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 transition-colors mt-1"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Ответить на отзыв
        </button>
      )}

      {/* Seller response */}
      {showSellerResponse && review.sellerResponse && review.sellerResponse.status === 'APPROVED' && (
        <div className="mt-3 ml-6 bg-gray-50 rounded-lg p-3 border-l-2 border-primary-300">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Store className="w-3.5 h-3.5 text-primary-600" />
            <span className="text-xs font-medium text-primary-700">
              {review.sellerResponse.sellerShopName || 'Продавец'}
            </span>
            <span className="text-xs text-gray-400">
              {formatDate(review.sellerResponse.createdAt)}
            </span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {review.sellerResponse.comment}
          </p>
        </div>
      )}

      {/* Image gallery modal */}
      {galleryOpen && review.images && review.images.length > 0 && (
        <ReviewImageGallery
          images={review.images}
          initialIndex={galleryIndex}
          onClose={() => setGalleryOpen(false)}
        />
      )}

      {/* Report Dialog */}
      <ReportDialog
        entityType="REVIEW"
        entityId={review.id}
        entityName={`Отзыв от ${review.buyerDisplayName || 'Покупатель'}`}
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
      />
    </div>
  );
};

export default ReviewCard;
