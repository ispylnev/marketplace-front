import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, DollarSign, Barcode, Box, Loader2, AlertCircle, Save,
  FileText, Info, Leaf, Sun, Droplets, Thermometer, Tag,
  Trash2, Star, Image as ImageIcon, Clock
} from "lucide-react";
import Header from "../components/Header";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { ImageUploader, UploadedImage } from "../components/ImageUploader";
import { DynamicField } from '../components/DynamicField';
import { offerService } from '../api/offerService';
import { catalogService } from '../api/catalogService';
import {
  OfferResponse, UpdateOfferRequest, OfferCondition,
  OfferImageResponse, CategoryAttribute, OfferAttributeRequest
} from '../types/offer';
import {
  lightingOptions, wateringOptions,
  humidityOptions, difficultyOptions, toxicityOptions
} from '../constants/plantOptions';

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

  // Изображения
  const [existingImages, setExistingImages] = useState<OfferImageResponse[]>([]);
  const [newImages, setNewImages] = useState<UploadedImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);

  // Атрибуты категории (динамические поля)
  const [categoryAttributes, setCategoryAttributes] = useState<CategoryAttribute[]>([]);
  const [attributeValues, setAttributeValues] = useState<Record<string, string | number | boolean | null>>({});
  const [attributesLoading, setAttributesLoading] = useState(false);
  const [categoryIsPlant, setCategoryIsPlant] = useState(false);

  // Форма редактирования
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    condition: 'NEW' as OfferCondition,
    barcode: '',
    handlingTimeDays: '',
    warrantyMonths: '',
    weightGrams: '',
    lengthMm: '',
    widthMm: '',
    heightMm: '',
    // Параметры ухода за растениями
    lightRequirement: '',
    wateringFrequency: '',
    humidityLevel: '',
    temperatureMin: '',
    temperatureMax: '',
    careDifficulty: '',
    toxicity: ''
  });

  // Проверяем есть ли поля на модерации
  const pendingFields = offer?.pendingChanges || {};
  const hasPendingChanges = Object.keys(pendingFields).length > 0;
  const isFieldPending = (fieldName: string) => !!pendingFields[fieldName];

  // Определяем является ли категория растительной
  const isPlantCategory = offer?.taxonomyId ? true : categoryIsPlant;

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
        title: data.title || '',
        description: data.description || '',
        price: data.price.toString(),
        condition: data.condition,
        barcode: data.barcode || '',
        handlingTimeDays: data.handlingTimeDays?.toString() || '',
        warrantyMonths: data.warrantyMonths?.toString() || '',
        weightGrams: data.shipping?.weightGrams?.toString() || '',
        lengthMm: data.shipping?.lengthMm?.toString() || '',
        widthMm: data.shipping?.widthMm?.toString() || '',
        heightMm: data.shipping?.heightMm?.toString() || '',
        // Care attributes из ответа
        lightRequirement: data.lightRequirement || '',
        wateringFrequency: data.wateringFrequency || '',
        humidityLevel: data.humidityLevel || '',
        temperatureMin: data.temperatureMin?.toString() || '',
        temperatureMax: data.temperatureMax?.toString() || '',
        careDifficulty: data.careDifficulty || '',
        toxicity: data.toxicity || ''
      });

      // Загружаем изображения
      loadImages(offerId);

      // Загружаем категорию и её атрибуты
      if (data.categoryId) {
        try {
          const cat = await catalogService.getCategoryById(data.categoryId);
          setCategoryIsPlant(cat.isPlant === true);
        } catch (e) {
          console.error('Ошибка загрузки категории:', e);
        }
        loadCategoryAttributes(data.categoryId, data.attributes);
      }
    } catch (err: any) {
      console.error('Ошибка загрузки оффера:', err);
      setError(err.response?.data?.message || 'Не удалось загрузить оффер');
    } finally {
      setLoading(false);
    }
  };

  const loadImages = async (offerId: number) => {
    try {
      setImagesLoading(true);
      // Используем /all endpoint чтобы seller видел pending-изображения
      const images = await offerService.getOfferImagesAll(offerId);
      setExistingImages(images);
    } catch (err) {
      console.error('Ошибка загрузки изображений:', err);
    } finally {
      setImagesLoading(false);
    }
  };

  // Проверяем наличие pending-изображений
  const hasPendingImages = existingImages.some(img => img.moderationStatus === 'PENDING_MODERATION');

  const loadCategoryAttributes = async (
    categoryId: number,
    offerAttributes?: { attributeCode: string; valueString?: string; valueNumber?: number; valueBoolean?: boolean }[]
  ) => {
    setAttributesLoading(true);
    try {
      const attrs = await catalogService.getCategoryAttributes(categoryId);
      setCategoryAttributes(attrs);

      // Предзаполняем значения из существующих атрибутов оффера
      if (offerAttributes && offerAttributes.length > 0) {
        const values: Record<string, string | number | boolean | null> = {};
        for (const attr of offerAttributes) {
          if (attr.valueString != null) values[attr.attributeCode] = attr.valueString;
          else if (attr.valueNumber != null) values[attr.attributeCode] = attr.valueNumber;
          else if (attr.valueBoolean != null) values[attr.attributeCode] = attr.valueBoolean;
        }
        setAttributeValues(values);
      }
    } catch (err) {
      console.error('Ошибка загрузки атрибутов категории:', err);
      setCategoryAttributes([]);
    } finally {
      setAttributesLoading(false);
    }
  };

  const handleAttributeChange = (code: string, value: string | number | boolean | null) => {
    setAttributeValues(prev => ({ ...prev, [code]: value }));
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!offerId) return;
    try {
      await offerService.deleteOfferImage(offerId, imageId);
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
    } catch (err: any) {
      console.error('Ошибка удаления изображения:', err);
      setError(err.response?.data?.message || 'Не удалось удалить изображение');
    }
  };

  const handleSetMainImage = async (imageId: number) => {
    if (!offerId) return;
    try {
      await offerService.setOfferImageAsMain(offerId, imageId);
      setExistingImages(prev =>
        prev.map(img => ({
          ...img,
          imageType: img.id === imageId ? 'MAIN' as const : 'GALLERY' as const
        }))
      );
    } catch (err: any) {
      console.error('Ошибка установки главного изображения:', err);
      setError(err.response?.data?.message || 'Не удалось установить главное изображение');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerId) return;

    setSubmitting(true);
    setError(null);

    try {
      // Собираем care attributes
      const hasCareData = formData.lightRequirement || formData.wateringFrequency ||
        formData.humidityLevel || formData.careDifficulty ||
        formData.temperatureMin || formData.temperatureMax || formData.toxicity;

      const careAttributes = hasCareData ? {
        lightRequirement: formData.lightRequirement || undefined,
        wateringFrequency: formData.wateringFrequency || undefined,
        humidityLevel: formData.humidityLevel || undefined,
        temperatureMin: formData.temperatureMin ? parseInt(formData.temperatureMin) : undefined,
        temperatureMax: formData.temperatureMax ? parseInt(formData.temperatureMax) : undefined,
        careDifficulty: formData.careDifficulty || undefined,
        toxicity: formData.toxicity || undefined
      } : undefined;

      // Собираем динамические атрибуты
      const attributes: OfferAttributeRequest[] = [];
      for (const attr of categoryAttributes) {
        const value = attributeValues[attr.attributeCode];
        if (value != null && value !== '') {
          const attrReq: OfferAttributeRequest = { attributeCode: attr.attributeCode };
          if (typeof value === 'string') attrReq.valueString = value;
          else if (typeof value === 'number') attrReq.valueNumber = value;
          else if (typeof value === 'boolean') attrReq.valueBoolean = value;
          attributes.push(attrReq);
        }
      }

      // Shipping: undefined если все поля пустые
      const hasShippingData = formData.weightGrams || formData.lengthMm || formData.widthMm || formData.heightMm;
      const shipping = hasShippingData ? {
        weightGrams: formData.weightGrams ? parseInt(formData.weightGrams) : undefined,
        lengthMm: formData.lengthMm ? parseInt(formData.lengthMm) : undefined,
        widthMm: formData.widthMm ? parseInt(formData.widthMm) : undefined,
        heightMm: formData.heightMm ? parseInt(formData.heightMm) : undefined
      } : undefined;

      // Condition: undefined если не менялось
      const conditionChanged = offer && formData.condition !== offer.condition;

      const request: UpdateOfferRequest = {
        // Не отправляем поля, которые на модерации, чтобы избежать FieldAlreadyPendingException
        title: isFieldPending('title') ? undefined : (formData.title.trim() || undefined),
        description: isFieldPending('description') ? undefined : (formData.description.trim() || undefined),
        price: parseFloat(formData.price),
        condition: conditionChanged ? formData.condition : undefined,
        barcode: formData.barcode || undefined,
        handlingTimeDays: formData.handlingTimeDays ? parseInt(formData.handlingTimeDays) : undefined,
        warrantyMonths: formData.warrantyMonths ? parseInt(formData.warrantyMonths) : undefined,
        shipping,
        careAttributes,
        attributes: attributes.length > 0 ? attributes : undefined
      };

      await offerService.updateOffer(offerId, request);

      // Привязываем новые изображения (если есть)
      const uploadedNewImages = newImages.filter(img => img.id && !img.uploading && !img.error);
      if (uploadedNewImages.length > 0) {
        const tempIds = uploadedNewImages.map(img => img.id);
        await offerService.uploadOfferImages(offerId, tempIds);
      }

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

        {hasPendingChanges && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 text-sm font-medium">
                Некоторые изменения ожидают модерации
              </p>
              <p className="text-amber-700 text-xs mt-1">
                Поля на модерации: {Object.keys(pendingFields).map(f => {
                  const labels: Record<string, string> = {
                    title: 'Название', description: 'Описание',
                    categoryId: 'Категория', taxonomyId: 'Таксономия', brandId: 'Бренд'
                  };
                  return labels[f] || f;
                }).join(', ')}.
                Эти поля нельзя изменить до завершения проверки.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Категория и таксономия (информационный блок) */}
          {(offer.categoryName || offer.taxonomyCommonName || offer.taxonomyScientificName) && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#2B4A39] mb-4 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Привязка к каталогу
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {offer.categoryName && (
                  <div>
                    <Label className="text-[#2D2E30]/70 text-sm">
                      Категория
                      {isFieldPending('categoryId') && (
                        <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          На модерации
                        </span>
                      )}
                    </Label>
                    <p className="mt-1 text-[#2D2E30] font-medium">{offer.categoryName}</p>
                  </div>
                )}

                {(offer.taxonomyCommonName || offer.taxonomyScientificName) && (
                  <div>
                    <Label className="text-[#2D2E30]/70 text-sm">
                      Таксономия
                      {isFieldPending('taxonomyId') && (
                        <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          На модерации
                        </span>
                      )}
                    </Label>
                    <p className="mt-1 text-[#2D2E30] font-medium">
                      {offer.taxonomyCommonName || offer.taxonomyScientificName}
                    </p>
                    {offer.taxonomyCommonName && offer.taxonomyScientificName && (
                      <p className="text-sm text-[#2D2E30]/60 italic">{offer.taxonomyScientificName}</p>
                    )}
                  </div>
                )}
              </div>

              <p className="text-xs text-[#2D2E30]/50 mt-3">
                Для изменения категории или таксономии обратитесь к модератору.
              </p>
            </div>
          )}

          {/* Изображения */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#2B4A39] mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Фотографии
              {(hasPendingImages || isFieldPending('images')) && (
                <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  На модерации
                </span>
              )}
            </h2>

            {/* Существующие изображения */}
            {imagesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-[#2B4A39] animate-spin" />
                <span className="ml-2 text-[#2D2E30]/60">Загрузка изображений...</span>
              </div>
            ) : existingImages.length > 0 ? (
              <div className="mb-4">
                <p className="text-sm text-[#2D2E30]/60 mb-3">
                  Текущие фотографии ({existingImages.length})
                </p>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {existingImages.map((img) => {
                    const isPending = img.moderationStatus === 'PENDING_MODERATION';
                    return (
                      <div key={img.id} className={`relative group aspect-square rounded-lg overflow-hidden border ${isPending ? 'border-amber-400 border-2' : 'border-[#2D2E30]/10'}`}>
                        <img
                          src={img.thumbnails?.md?.url || img.url}
                          alt={img.originalFilename}
                          className={`w-full h-full object-cover ${isPending ? 'opacity-75' : ''}`}
                        />
                        {img.imageType === 'MAIN' && !isPending && (
                          <div className="absolute top-1 left-1 bg-[#2B4A39] text-white text-xs px-1.5 py-0.5 rounded">
                            Главное
                          </div>
                        )}
                        {isPending && (
                          <div className="absolute top-1 left-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            На модерации
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          {img.imageType !== 'MAIN' && !isPending && (
                            <button
                              type="button"
                              onClick={() => handleSetMainImage(img.id)}
                              className="p-1.5 bg-white rounded-full hover:bg-amber-50 transition-colors"
                              title="Сделать главным"
                            >
                              <Star className="w-4 h-4 text-amber-500" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(img.id)}
                            className="p-1.5 bg-white rounded-full hover:bg-red-50 transition-colors"
                            title={isPending ? 'Отменить загрузку' : 'Удалить'}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#2D2E30]/50 mb-4">Нет загруженных фотографий</p>
            )}

            {/* Загрузка новых изображений */}
            <div>
              {hasPendingImages ? (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>Загрузка новых фотографий заблокирована, пока предыдущие на модерации. Вы можете отменить загрузку, удалив фото на модерации.</span>
                </div>
              ) : (
                <>
                  <p className="text-sm text-[#2D2E30]/60 mb-2">Добавить новые фотографии</p>
                  <ImageUploader
                    images={newImages}
                    onChange={setNewImages}
                    maxImages={10 - existingImages.length}
                  />
                </>
              )}
            </div>
          </div>

          {/* Название и описание */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#2B4A39] mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Название и описание
            </h2>

            <div className="space-y-4">
              <div>
                <Label className="text-[#2D2E30]">
                  Название товара
                  {offer.pendingChanges?.title && (
                    <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      На модерации
                    </span>
                  )}
                </Label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`mt-1 ${isFieldPending('title') ? 'bg-amber-50/50 opacity-60' : ''}`}
                  placeholder="Название, которое увидят покупатели"
                  maxLength={200}
                  disabled={isFieldPending('title')}
                />
                <p className="text-xs text-[#2D2E30]/50 mt-1">
                  Укажите важные характеристики: размер, сорт, особенности.
                </p>
              </div>

              <div>
                <Label className="text-[#2D2E30]">
                  Описание
                  {offer.pendingChanges?.description && (
                    <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      На модерации
                    </span>
                  )}
                </Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`mt-1 ${isFieldPending('description') ? 'bg-amber-50/50 opacity-60' : ''}`}
                  placeholder="Опишите товар подробнее: особенности, состояние, условия содержания..."
                  rows={4}
                  maxLength={2000}
                  disabled={isFieldPending('description')}
                />
              </div>
            </div>
          </div>

          {/* Параметры ухода за растениями */}
          {isPlantCategory && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#2B4A39] mb-4 flex items-center gap-2">
                <Leaf className="w-5 h-5" />
                Параметры ухода
              </h2>

              <p className="text-[#2D2E30]/60 text-sm mb-4">
                Укажите условия содержания растения. Это поможет покупателям сделать выбор.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Освещение */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    Освещение
                  </Label>
                  <select
                    value={formData.lightRequirement}
                    onChange={(e) => setFormData({ ...formData, lightRequirement: e.target.value })}
                    className="w-full border border-[#2D2E30]/20 rounded-lg px-3 py-2 focus:outline-none focus:border-[#2B4A39]"
                  >
                    <option value="">Не указано</option>
                    {lightingOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Полив */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    Полив
                  </Label>
                  <select
                    value={formData.wateringFrequency}
                    onChange={(e) => setFormData({ ...formData, wateringFrequency: e.target.value })}
                    className="w-full border border-[#2D2E30]/20 rounded-lg px-3 py-2 focus:outline-none focus:border-[#2B4A39]"
                  >
                    <option value="">Не указано</option>
                    {wateringOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Влажность */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Droplets className="w-4 h-4 text-cyan-500" />
                    Влажность воздуха
                  </Label>
                  <select
                    value={formData.humidityLevel}
                    onChange={(e) => setFormData({ ...formData, humidityLevel: e.target.value })}
                    className="w-full border border-[#2D2E30]/20 rounded-lg px-3 py-2 focus:outline-none focus:border-[#2B4A39]"
                  >
                    <option value="">Не указано</option>
                    {humidityOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Сложность */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Thermometer className="w-4 h-4 text-green-500" />
                    Сложность ухода
                  </Label>
                  <select
                    value={formData.careDifficulty}
                    onChange={(e) => setFormData({ ...formData, careDifficulty: e.target.value })}
                    className="w-full border border-[#2D2E30]/20 rounded-lg px-3 py-2 focus:outline-none focus:border-[#2B4A39]"
                  >
                    <option value="">Не указано</option>
                    {difficultyOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Температура */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Thermometer className="w-4 h-4 text-red-400" />
                    Мин. температура (&deg;C)
                  </Label>
                  <Input
                    type="number"
                    placeholder="напр. 15"
                    value={formData.temperatureMin}
                    onChange={(e) => setFormData({ ...formData, temperatureMin: e.target.value })}
                    min="-10"
                    max="50"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Thermometer className="w-4 h-4 text-orange-400" />
                    Макс. температура (&deg;C)
                  </Label>
                  <Input
                    type="number"
                    placeholder="напр. 30"
                    value={formData.temperatureMax}
                    onChange={(e) => setFormData({ ...formData, temperatureMax: e.target.value })}
                    min="-10"
                    max="50"
                  />
                </div>
              </div>

              {/* Токсичность */}
              <div className="mt-4">
                <Label className="text-[#2D2E30]">Токсичность</Label>
                <select
                  value={formData.toxicity}
                  onChange={(e) => setFormData({ ...formData, toxicity: e.target.value })}
                  className="mt-1 w-full rounded-md border border-[#2D2E30]/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4A39]"
                >
                  <option value="">Не указано</option>
                  {toxicityOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Динамические атрибуты категории (care-атрибуты фильтруются для растений) */}
          {(() => {
            const visibleAttributes = categoryAttributes.filter(a => a.isVisible !== false);
            const filteredAttributes = isPlantCategory
              ? visibleAttributes.filter(a => a.attributeGroup !== 'care')
              : visibleAttributes;
            return filteredAttributes.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#2B4A39] mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Характеристики товара
              </h2>

              <p className="text-[#2D2E30]/60 text-sm mb-4">
                Заполните характеристики товара. Поля со звёздочкой (*) обязательны.
              </p>

              {attributesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-[#2B4A39] animate-spin" />
                  <span className="ml-2 text-[#2D2E30]/60">Загрузка характеристик...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAttributes.map(attr => (
                    <DynamicField
                      key={attr.attributeCode}
                      attribute={attr}
                      value={attributeValues[attr.attributeCode]}
                      onChange={(value) => handleAttributeChange(attr.attributeCode, value)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
          })()}

          {/* Цена */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#2B4A39] mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Цена и состояние
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
