import { useState } from 'react';
import { Loader2, X, ImagePlus } from 'lucide-react';
import StarRating from './StarRating';
import { uploadService } from '../../api/uploadService';
import { reviewService } from '../../api/reviewService';
import { ReviewDto, CreateReviewRequest } from '../../types/review';

interface ReviewFormProps {
  offerId: number;
  orderId: number;
  onSuccess: (review: ReviewDto) => void;
  onCancel: () => void;
}

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface UploadedImage {
  tempId: string;
  url: string;
  file: File;
}

const ReviewForm = ({ offerId, orderId, onSuccess, onCancel }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = MAX_IMAGES - images.length;
    const toUpload = files.slice(0, remaining);

    for (const file of toUpload) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Допустимые форматы: JPEG, PNG, WebP');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError('Максимальный размер файла — 5 МБ');
        return;
      }
    }

    setUploading(true);
    setError(null);

    try {
      const uploaded: UploadedImage[] = [];
      for (const file of toUpload) {
        const result = await uploadService.uploadTemp(file, 'REVIEW');
        uploaded.push({ tempId: result.tempId, url: result.url, file });
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch {
      setError('Ошибка загрузки изображения');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const removeImage = (tempId: string) => {
    setImages((prev) => prev.filter((img) => img.tempId !== tempId));
    uploadService.deleteTempUpload(tempId, 'REVIEW').catch(() => {});
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Выберите рейтинг');
      return;
    }
    if (comment.trim().length < 5) {
      setError('Минимальная длина отзыва — 10 символов');
      return;
    }
    if (comment.trim().length > 500) {
      setError('Максимальная длина отзыва — 500 символов');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const request: CreateReviewRequest = {
        offerId,
        orderId,
        rating,
        comment: comment.trim(),
        imageIds: images.length > 0 ? images.map((img) => img.tempId) : undefined,
      };

      const review = await reviewService.submitReview(request);
      onSuccess(review);
    } catch (err: any) {
      const data = err?.response?.data;
      let msg: string;
      if (data?.errors && typeof data.errors === 'object') {
        msg = Object.values(data.errors).join('. ');
      } else {
        msg = data?.message || data?.error || 'Не удалось отправить отзыв';
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Оставить отзыв</h3>

      {/* Rating */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Ваша оценка</p>
        <StarRating rating={rating} size="lg" interactive onChange={setRating} />
      </div>

      {/* Comment */}
      <div className="mb-4">
        <label className="text-sm text-gray-600 block mb-2">
          Ваш отзыв
          <span className="text-gray-400 ml-1">({comment.length}/5000)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Расскажите о своём опыте использования товара..."
          rows={4}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent resize-none"
        />
      </div>

      {/* Images */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Фотографии <span className="text-gray-400">({images.length}/{MAX_IMAGES})</span>
        </p>
        <div className="flex gap-2 flex-wrap">
          {images.map((img) => (
            <div key={img.tempId} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(img.tempId)}
                className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 hover:bg-black/70 transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
              {uploading ? (
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              ) : (
                <ImagePlus className="w-5 h-5 text-gray-400" />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </label>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={submitting || rating === 0}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? 'Отправка...' : 'Отправить отзыв'}
        </button>
        <button
          onClick={onCancel}
          disabled={submitting}
          className="px-5 py-2.5 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
        >
          Отмена
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Отзыв будет опубликован после прохождения модерации
      </p>
    </div>
  );
};

export default ReviewForm;
