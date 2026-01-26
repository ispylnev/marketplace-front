import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, DollarSign, Barcode, Box, Loader2, AlertCircle, Save
} from "lucide-react";
import Header from "../components/Header";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { offerService } from '../api/offerService';
import { OfferResponse, UpdateOfferRequest, OfferCondition } from '../types/offer';

const conditionLabels: Record<OfferCondition, string> = {
  'NEW': 'Новый',
  'WITH_DEFECTS': 'С дефектами'
};

const EditOffer = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const offerId = id ? parseInt(id, 10) : null;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offer, setOffer] = useState<OfferResponse | null>(null);

  // Форма редактирования
  const [formData, setFormData] = useState({
    price: '',
    condition: 'NEW' as OfferCondition,
    barcode: '',
    handlingTimeDays: '',
    warrantyMonths: '',
    weightGrams: '',
    lengthMm: '',
    widthMm: '',
    heightMm: ''
  });

  useEffect(() => {
    if (offerId) {
      loadOffer();
    }
  }, [offerId]);

  const loadOffer = async () => {
    if (!offerId) return;

    try {
      setLoading(true);
      const data = await offerService.getOffer(offerId);
      setOffer(data);

      // Заполняем форму данными оффера
      setFormData({
        price: data.price.toString(),
        condition: data.condition,
        barcode: data.barcode || '',
        handlingTimeDays: data.handlingTimeDays?.toString() || '',
        warrantyMonths: data.warrantyMonths?.toString() || '',
        weightGrams: data.shipping?.weightGrams?.toString() || '',
        lengthMm: data.shipping?.lengthMm?.toString() || '',
        widthMm: data.shipping?.widthMm?.toString() || '',
        heightMm: data.shipping?.heightMm?.toString() || ''
      });
    } catch (err: any) {
      console.error('Ошибка загрузки оффера:', err);
      setError(err.response?.data?.message || 'Не удалось загрузить оффер');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerId) return;

    setSubmitting(true);
    setError(null);

    try {
      const request: UpdateOfferRequest = {
        price: parseFloat(formData.price),
        condition: formData.condition,
        barcode: formData.barcode || undefined,
        handlingTimeDays: formData.handlingTimeDays ? parseInt(formData.handlingTimeDays) : undefined,
        warrantyMonths: formData.warrantyMonths ? parseInt(formData.warrantyMonths) : undefined,
        shipping: {
          weightGrams: formData.weightGrams ? parseInt(formData.weightGrams) : undefined,
          lengthMm: formData.lengthMm ? parseInt(formData.lengthMm) : undefined,
          widthMm: formData.widthMm ? parseInt(formData.widthMm) : undefined,
          heightMm: formData.heightMm ? parseInt(formData.heightMm) : undefined
        }
      };

      await offerService.updateOffer(offerId, request);
      navigate('/seller/admin');
    } catch (err: any) {
      console.error('Ошибка обновления оффера:', err);
      setError(err.response?.data?.message || 'Не удалось обновить оффер');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#2B4A39]" />
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <Header />
        <div className="mx-auto px-4 py-8 max-w-2xl text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-[#2B4A39] mb-2">Оффер не найден</h1>
          <p className="text-[#2D2E30]/70 mb-4">{error || 'Не удалось найти указанный оффер'}</p>
          <Button onClick={() => navigate('/seller/admin')} className="bg-[#BCCEA9] text-[#2B4A39]">
            Вернуться в панель
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />

      <div className="mx-auto px-4 py-6 md:px-6 lg:px-12 max-w-3xl">
        {/* Заголовок */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/seller/admin')}
            className="mb-4 text-[#2D2E30]/70 hover:text-[#2B4A39]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>

          <h1 className="text-2xl md:text-3xl font-semibold text-[#2B4A39]">
            Редактирование оффера
          </h1>
          <p className="text-[#2D2E30]/70 mt-1">
            {offer.title || `Оффер #${offer.id}`}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Цена */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#2B4A39] mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Цена
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-[#2D2E30]">Цена (₽) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-[#2D2E30]">Состояние</Label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value as OfferCondition })}
                  className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#BCCEA9]"
                >
                  {Object.entries(conditionLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Дополнительные параметры */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#2B4A39] mb-4 flex items-center gap-2">
              <Barcode className="w-5 h-5" />
              Дополнительно
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-[#2D2E30]">Штрихкод</Label>
                <Input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="mt-1"
                  placeholder="EAN-13 или другой"
                />
              </div>

              <div>
                <Label className="text-[#2D2E30]">Время обработки (дней)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.handlingTimeDays}
                  onChange={(e) => setFormData({ ...formData, handlingTimeDays: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-[#2D2E30]">Гарантия (месяцев)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.warrantyMonths}
                  onChange={(e) => setFormData({ ...formData, warrantyMonths: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Габариты */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#2B4A39] mb-4 flex items-center gap-2">
              <Box className="w-5 h-5" />
              Габариты для доставки
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-[#2D2E30]">Вес (г)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.weightGrams}
                  onChange={(e) => setFormData({ ...formData, weightGrams: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-[#2D2E30]">Длина (мм)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.lengthMm}
                  onChange={(e) => setFormData({ ...formData, lengthMm: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-[#2D2E30]">Ширина (мм)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.widthMm}
                  onChange={(e) => setFormData({ ...formData, widthMm: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-[#2D2E30]">Высота (мм)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.heightMm}
                  onChange={(e) => setFormData({ ...formData, heightMm: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/seller/admin')}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={submitting || !formData.price}
              className="flex-1 bg-[#2B4A39] hover:bg-[#234135] text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Сохранить изменения
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOffer;
