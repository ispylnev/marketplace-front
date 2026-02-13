import { Star } from 'lucide-react';
import { ReviewStatsDto } from '../../types/review';

interface ReviewStatsProps {
  stats: ReviewStatsDto;
  onRatingFilter?: (rating: number | undefined) => void;
  activeFilter?: number;
}

function pluralize(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 19) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

const ReviewStats = ({ stats, onRatingFilter, activeFilter }: ReviewStatsProps) => {
  const ratingCounts = [
    { rating: 5, count: stats.rating5Count },
    { rating: 4, count: stats.rating4Count },
    { rating: 3, count: stats.rating3Count },
    { rating: 2, count: stats.rating2Count },
    { rating: 1, count: stats.rating1Count },
  ];

  const maxCount = Math.max(...ratingCounts.map((r) => r.count), 1);

  return (
    <div className="flex gap-6 items-start">
      {/* Average rating */}
      <div className="text-center flex-shrink-0">
        <div className="text-4xl font-bold text-gray-900">
          {stats.reviewCount > 0 ? stats.averageRating.toFixed(1) : '—'}
        </div>
        <div className="flex items-center justify-center gap-0.5 my-1">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < Math.round(stats.averageRating)
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-none text-gray-300'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500">
          {stats.reviewCount} {pluralize(stats.reviewCount, 'отзыв', 'отзыва', 'отзывов')}
        </p>
      </div>

      {/* Rating bars */}
      <div className="flex-1 space-y-1.5">
        {ratingCounts.map(({ rating, count }) => (
          <button
            key={rating}
            onClick={() => {
              if (!onRatingFilter) return;
              onRatingFilter(activeFilter === rating ? undefined : rating);
            }}
            className={`flex items-center gap-2 w-full group ${
              onRatingFilter ? 'cursor-pointer' : 'cursor-default'
            } ${activeFilter === rating ? 'opacity-100' : activeFilter ? 'opacity-40' : 'opacity-100'}`}
          >
            <span className="text-xs text-gray-500 w-3 text-right">{rating}</span>
            <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  onRatingFilter ? 'group-hover:bg-amber-500' : ''
                } bg-amber-400`}
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 w-6 text-right">{count}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReviewStats;
