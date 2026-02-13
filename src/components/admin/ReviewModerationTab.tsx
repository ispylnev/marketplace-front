import { useState } from 'react';
import { Check, X, Star, MessageSquare, AlertCircle, Loader2, ImageIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { ReviewDto } from '../../types/review';
import { useToast } from '../../hooks';

interface ReviewModerationTabProps {
  reviews: ReviewDto[];
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number, reason: string) => Promise<void>;
}

export function ReviewModerationTab({ reviews, onApprove, onReject }: ReviewModerationTabProps) {
  const { error: showError } = useToast();
  const [rejectReason, setRejectReason] = useState<Record<number, string>>({});
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const handleApprove = async (id: number) => {
    setProcessingId(id);
    try {
      await onApprove(id);
    } catch {
      // handled in parent
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number) => {
    const reason = rejectReason[id]?.trim();
    if (!reason) {
      showError('Укажите причину отклонения');
      return;
    }
    setProcessingId(id);
    try {
      await onReject(id, reason);
      setRejectingId(null);
      setRejectReason(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch {
      // handled in parent
    } finally {
      setProcessingId(null);
    }
  };

  const pendingReviews = reviews.filter(r => r.status === 'PENDING_MODERATION');

  if (pendingReviews.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <MessageSquare className="w-12 h-12 mx-auto text-[#BCCEA9] mb-4" />
        <h3 className="text-lg font-semibold text-[#2B4A39] mb-2">Нет отзывов на модерации</h3>
        <p className="text-[#2D2E30]/70">Все отзывы обработаны</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-4 lg:p-6">
      <div className="mb-6">
        <h2 className="text-[#2B4A39] font-semibold text-xl">Модерация отзывов</h2>
        <p className="text-sm text-[#2D2E30]/70 mt-1">
          {pendingReviews.length} {pendingReviews.length === 1 ? 'отзыв' : pendingReviews.length < 5 ? 'отзыва' : 'отзывов'} на модерации
        </p>
      </div>

      <div className="space-y-4">
        {pendingReviews.map(review => (
          <div key={review.id} className="border border-[#2D2E30]/10 rounded-lg p-4 hover:border-[#BCCEA9] transition-colors">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-[#2D2E30]">
                    {review.buyerDisplayName || `Покупатель #${review.buyerId}`}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    На модерации
                  </span>
                </div>
                <p className="text-xs text-[#2D2E30]/70">
                  Оффер #{review.offerId} &bull; Заказ #{review.orderId} &bull; {new Date(review.createdAt).toLocaleString('ru-RU')}
                </p>
              </div>
              {/* Rating */}
              <div className="flex items-center gap-1 shrink-0">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-none text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="bg-[#F8F9FA] rounded-lg p-3 mb-3">
              <p className="text-sm text-[#2D2E30] whitespace-pre-wrap">{review.comment}</p>
            </div>

            {/* Images */}
            {review.images && review.images.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-1 text-xs text-[#2D2E30]/70 mb-2">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Фото ({review.images.length})</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {review.images.map(img => (
                    <a
                      key={img.id}
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative group"
                    >
                      <img
                        src={img.url}
                        alt=""
                        className="w-20 h-20 object-cover rounded-lg border border-[#2D2E30]/10"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {rejectingId === review.id ? (
              <div className="space-y-3">
                <textarea
                  value={rejectReason[review.id] || ''}
                  onChange={(e) => setRejectReason(prev => ({ ...prev, [review.id]: e.target.value }))}
                  placeholder="Причина отклонения..."
                  className="w-full border border-[#2D2E30]/20 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2B4A39]"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleReject(review.id)}
                    disabled={!rejectReason[review.id]?.trim() || processingId === review.id}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                  >
                    {processingId === review.id && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                    Отклонить
                  </Button>
                  <Button
                    onClick={() => { setRejectingId(null); }}
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
                  onClick={() => handleApprove(review.id)}
                  disabled={processingId !== null}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                >
                  {processingId === review.id ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Check className="w-3 h-3 mr-1" />
                  )}
                  Одобрить
                </Button>
                <Button
                  onClick={() => setRejectingId(review.id)}
                  disabled={processingId !== null}
                  size="sm"
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-50 text-xs h-8"
                >
                  <X className="w-3 h-3 mr-1" />
                  Отклонить
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReviewModerationTab;
