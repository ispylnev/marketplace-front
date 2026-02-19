import { useState } from 'react';
import { Check, X, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { ReportResponse } from '../../api/reportService';
import { useToast } from '../../hooks';

const REPORT_TYPE_LABELS: Record<string, string> = {
  SPAM: 'Спам',
  HARASSMENT: 'Домогательства',
  COUNTERFEIT: 'Контрафакт',
  RULE_VIOLATION: 'Нарушение правил',
  INAPPROPRIATE_CONTENT: 'Неприемлемый контент',
  OTHER: 'Другое',
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  USER: 'Пользователь',
  SELLER: 'Продавец',
  OFFER: 'Оффер',
  REVIEW: 'Отзыв',
};

interface ReportsModerationTabProps {
  reports: ReportResponse[];
  onApprove: (id: number, comment?: string) => Promise<void>;
  onReject: (id: number, comment?: string) => Promise<void>;
}

export function ReportsModerationTab({ reports, onApprove, onReject }: ReportsModerationTabProps) {
  const { error: showError } = useToast();
  const [commentMap, setCommentMap] = useState<Record<number, string>>({});
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const handleApprove = async (id: number) => {
    setProcessingId(id);
    try {
      await onApprove(id, commentMap[id]?.trim() || undefined);
    } catch {
      // handled in parent
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number) => {
    const comment = commentMap[id]?.trim();
    if (!comment) {
      showError('Укажите комментарий для отклонения');
      return;
    }
    setProcessingId(id);
    try {
      await onReject(id, comment);
      setRejectingId(null);
      setCommentMap(prev => {
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

  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto text-[#BCCEA9] mb-4" />
        <h3 className="text-lg font-semibold text-[#2B4A39] mb-2">Нет жалоб на модерации</h3>
        <p className="text-[#2D2E30]/70">Все жалобы обработаны</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-4 lg:p-6">
      <div className="mb-6">
        <h2 className="text-[#2B4A39] font-semibold text-xl">Модерация жалоб</h2>
        <p className="text-sm text-[#2D2E30]/70 mt-1">
          {reports.length} {reports.length === 1 ? 'жалоба' : reports.length < 5 ? 'жалобы' : 'жалоб'} на модерации
        </p>
      </div>

      <div className="space-y-4">
        {reports.map(report => (
          <div key={report.id} className="border border-[#2D2E30]/10 rounded-lg p-4 hover:border-[#BCCEA9] transition-colors">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                    {REPORT_TYPE_LABELS[report.reportType] || report.reportType}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                    {ENTITY_TYPE_LABELS[report.entityType] || report.entityType} #{report.entityId}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    На модерации
                  </span>
                </div>
                <p className="text-xs text-[#2D2E30]/70">
                  Автор жалобы: #{report.reporterUserId} &bull; {new Date(report.createdAt).toLocaleString('ru-RU')}
                </p>
              </div>
            </div>

            {/* Reason */}
            {report.reason && (
              <div className="bg-[#F8F9FA] rounded-lg p-3 mb-3">
                <p className="text-xs text-[#2D2E30]/50 mb-1">Причина жалобы:</p>
                <p className="text-sm text-[#2D2E30] whitespace-pre-wrap">{report.reason}</p>
              </div>
            )}

            {/* Actions */}
            {rejectingId === report.id ? (
              <div className="space-y-3">
                <textarea
                  value={commentMap[report.id] || ''}
                  onChange={(e) => setCommentMap(prev => ({ ...prev, [report.id]: e.target.value }))}
                  placeholder="Комментарий модератора..."
                  className="w-full border border-[#2D2E30]/20 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2B4A39]"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleReject(report.id)}
                    disabled={!commentMap[report.id]?.trim() || processingId === report.id}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                  >
                    {processingId === report.id && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
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
                  onClick={() => handleApprove(report.id)}
                  disabled={processingId !== null}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                >
                  {processingId === report.id ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Check className="w-3 h-3 mr-1" />
                  )}
                  Одобрить
                </Button>
                <Button
                  onClick={() => setRejectingId(report.id)}
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

export default ReportsModerationTab;
