import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { reportService, CreateReportRequest } from '../api/reportService';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ReportDialogProps {
  entityType: 'USER' | 'SELLER' | 'OFFER' | 'REVIEW';
  entityId: number;
  entityName: string;
  open: boolean;
  onClose: () => void;
}

const REPORT_TYPES = [
  { value: 'SPAM', label: 'Спам / Мошенничество', description: 'Подозрительная активность или попытки обмана' },
  { value: 'HARASSMENT', label: 'Оскорбления / Ненормативная лексика', description: 'Неприемлемое поведение в общении' },
  { value: 'COUNTERFEIT', label: 'Поддельные товары', description: 'Продажа контрафактной продукции' },
  { value: 'RULE_VIOLATION', label: 'Нарушение правил площадки', description: 'Другие нарушения условий использования' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Неприемлемый контент', description: 'Оскорбительные или запрещенные материалы' },
  { value: 'OTHER', label: 'Другое', description: 'Иная причина жалобы' },
];

export default function ReportDialog({ entityType, entityId, entityName, open, onClose }: ReportDialogProps) {
  const [reportType, setReportType] = useState<string>('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    console.log('handleSubmit called', { reportType, entityType, entityId });

    if (!reportType) {
      setError('Выберите тип жалобы');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const request: CreateReportRequest = {
        entityType,
        entityId,
        reportType: reportType as any,
        reason: reason.trim() || undefined,
      };

      console.log('Отправка жалобы:', request);
      const response = await reportService.createReport(request);
      console.log('Жалоба отправлена успешно:', response);

      setSuccess(true);

      // Закрываем диалог через 2 секунды после успеха
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      console.error('Ошибка отправки жалобы:', err);
      console.error('Детали ошибки:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });

      if (err.response?.status === 401) {
        setError('Необходимо войти в систему для отправки жалобы.');
      } else if (err.response?.status === 429) {
        setError('Превышен лимит жалоб. Попробуйте позже.');
      } else if (err.response?.status === 409) {
        setError('У вас уже есть активная жалоба этого типа на данную сущность.');
      } else {
        setError(err.response?.data?.message || 'Не удалось отправить жалобу. Попробуйте позже.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setReportType('');
    setReason('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  const getEntityTypeLabel = () => {
    switch (entityType) {
      case 'USER': return 'пользователя';
      case 'SELLER': return 'магазин';
      case 'OFFER': return 'товар';
      case 'REVIEW': return 'отзыв';
      default: return 'сущность';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Пожаловаться на {getEntityTypeLabel()}</DialogTitle>
          <DialogDescription>
            Вы собираетесь пожаловаться на <strong>{entityName}</strong>
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <p className="text-center text-lg font-semibold text-green-700">
              Жалоба успешно отправлена!
            </p>
            <p className="text-center text-sm text-gray-600 mt-2">
              Модераторы рассмотрят вашу жалобу в ближайшее время.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              {/* Тип жалобы */}
              <div className="space-y-3">
                <Label>Причина жалобы *</Label>
                <RadioGroup value={reportType} onValueChange={setReportType}>
                  {REPORT_TYPES.map((type) => (
                    <div key={type.value} className="flex items-start space-x-3 space-y-0">
                      <RadioGroupItem value={type.value} id={type.value} />
                      <div className="flex-1">
                        <Label htmlFor={type.value} className="font-medium cursor-pointer">
                          {type.label}
                        </Label>
                        <p className="text-xs text-gray-500">{type.description}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Дополнительное описание */}
              <div className="space-y-2">
                <Label htmlFor="reason">Дополнительное описание (необязательно)</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Опишите подробнее причину жалобы..."
                  rows={4}
                  maxLength={1000}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 text-right">
                  {reason.length}/1000
                </p>
              </div>

              {/* Ошибка */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={submitting}
              >
                Отмена
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !reportType}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {submitting ? 'Отправка...' : 'Отправить жалобу'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
