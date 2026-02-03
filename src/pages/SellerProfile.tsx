import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, MessageCircle, ShoppingCart, Package, Heart, Flag, MapPin, Clock, Truck } from "lucide-react";
import { ProfileMenuItem } from "../components/ProfileMenuItem";
import Header from "../components/Header";
import { Separator } from "../components/ui/separator";
import { Button } from "../components/ui/button";
import { sellerService } from '../api/sellerService';
import { SellerResponse } from '../types/seller';
import { extractId } from '../utils/slugUtils';
import profileAvatar from '../assets/c5c335b900c25c01ebdade434d4ee2ee9ce87b4b.png';
import avatarBackground from '../assets/4068108bae8ada353e34675c0c754fb530d30e98.png';

const SellerProfile = () => {
  const { slugWithId } = useParams<{ slugWithId: string }>();
  const sellerId = extractId(slugWithId);
  const [seller, setSeller] = useState<SellerResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSellerProfile();
  }, [sellerId]);

  const loadSellerProfile = async () => {
    if (!sellerId) {
      setLoading(false);
      return;
    }

    try {
      // Загружаем данные продавца по ID через API сервис
      const sellerData = await sellerService.getSeller(sellerId);
      setSeller(sellerData);
    } catch (error) {
      console.error('Ошибка загрузки профиля продавца:', error);
      // ВРЕМЕННО: моковые данные для верстки
      setSeller({
        id: sellerId || 1,
        userId: 1,
        shopName: 'Питомник Ситцевый Сад',
        legalName: 'ООО "Ситцевый Сад"',
        companyType: 'LLC',
        inn: '1234567890',
        contactEmail: 'info@sitcevysad.ru',
        contactPhone: '+7 (495) 123-45-67',
        description: 'Специализируемся на выращивании редких сортов ирисов и многолетников. Все растения выращены с любовью в экологически чистых условиях.',
        logoUrl: profileAvatar,
        status: 'APPROVED' as any,
        rating: 4.8,
        reviewCount: 24,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        canCreateOffers: true,
        avatarInitials: 'ПС',
        avatarBackgroundColor: '#BCCEA9',
        hasCustomLogo: true
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!seller) {
    return null;
  }

  const sellerProfile = {
    name: seller.shopName,
    avatar: seller.logoUrl || profileAvatar,
    rating: seller.rating || 4.8,
    reviewsCount: seller.reviewCount || 24,
    description: seller.description || "Специализируемся на выращивании редких сортов ирисов и многолетников. Все растения выращены с любовью в экологически чистых условиях.",
    city: "Москва",
    minOrderAmount: 1500,
    workingHours: "Пн-Сб: 9:00 - 18:00",
    ordersCompleted: 156,
    ordersCancelled: 3,
    ordersActive: 8,
    deliveryServices: ["СДЭК", "Почта России", "Boxberry"],
    shippingDays: "1-2 дня",
    selfPickup: true
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="min-h-screen bg-white py-2 md:py-5">
        <div className="max-w-6xl mx-auto flex gap-5 px-2 md:px-5 items-start justify-center">
          {/* Профиль */}
          <div className="w-full lg:max-w-4xl bg-white shadow-lg rounded-2xl overflow-hidden lg:pb-0 flex-shrink-0">
            {/* Шапка профиля */}
            <div 
              className="px-3 py-3 bg-cover bg-center"
              style={{ backgroundImage: `url(${avatarBackground})` }}
            >
              <div className="flex items-start gap-3">
                {/* Фото */}
                <div className="relative flex-shrink-0">
                  <img 
                    src={sellerProfile.avatar} 
                    alt={sellerProfile.name}
                    className="w-20 h-20 md:w-36 md:h-36 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                </div>
                
                {/* Никнейм, статус и рейтинг */}
                <div className="flex flex-col justify-center flex-1 pt-1">
                  <h1 className="text-white text-lg md:text-2xl font-bold leading-tight">{sellerProfile.name}</h1>
                  
                  {/* Статус */}
                  {sellerProfile.description && (
                    <div className="mt-2 mb-2 md:mt-3 md:mb-4 bg-white/20 backdrop-blur-sm rounded-lg px-2 md:px-3 py-1.5 md:py-2 border border-white/30">
                      <p className="text-white text-xs md:text-sm leading-tight">
                        {sellerProfile.description}
                      </p>
                    </div>
                  )}
                  
                  {/* Рейтинг */}
                  <div className="flex items-center gap-1 md:gap-2 mb-2 md:mb-4">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          fill={i < Math.floor(sellerProfile.rating) ? "#eab308" : "rgba(255,255,255,0.4)"}
                          className={`w-4 h-4 md:w-7 md:h-7 ${
                            i < Math.floor(sellerProfile.rating)
                              ? "text-yellow-500"
                              : "text-white opacity-40"
                          }`}
                          style={
                            i < Math.floor(sellerProfile.rating)
                              ? { filter: "drop-shadow(0 2px 4px rgba(234,179,8,0.6)) drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }
                              : undefined
                          }
                        />
                      ))}
                    </div>
                    <span className="text-white text-sm md:text-lg font-bold">{sellerProfile.rating}</span>
                    <span className="text-[#BCCEA9] text-xs md:text-base">• {sellerProfile.reviewsCount} отзывов</span>
                  </div>

                  {/* Кнопки действий */}
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-[#BCCEA9] hover:bg-[#a8ba95] text-[#2B4A39] h-8 md:h-9 text-xs md:text-sm px-2 md:px-4" size="sm">
                      <MessageCircle className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                      <span className="hidden sm:inline">Написать сообщение</span>
                      <span className="sm:hidden">Сообщение</span>
                    </Button>
                    <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/30 h-8 md:h-9 w-8 md:w-9 p-0" size="sm">
                      <Heart className="w-3 h-3 md:w-4 md:h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Блок информации о магазине */}
            <div className="p-3 md:p-6 bg-[#F8F9FA] rounded-lg m-3 md:m-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {/* Локация */}
                <div className="flex items-start gap-2 md:gap-3">
                  <MapPin className="w-4 h-4 md:w-5 md:h-5 text-[#2B4A39] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[#2D2E30] font-semibold text-sm md:text-base">Локация</p>
                    <p className="text-[#2D2E30]/70 text-sm md:text-base">{sellerProfile.city}</p>
                  </div>
                </div>

                {/* Мин сумма заказа */}
                <div className="flex items-start gap-2 md:gap-3">
                  <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-[#2B4A39] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[#2D2E30] font-semibold text-sm md:text-base">Минимальный заказ</p>
                    <p className="text-[#2D2E30]/70 text-sm md:text-base">{sellerProfile.minOrderAmount} ₽</p>
                  </div>
                </div>

                {/* Часы работы */}
                <div className="flex items-start gap-2 md:gap-3">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-[#2B4A39] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[#2D2E30] font-semibold text-sm md:text-base">Часы работы</p>
                    <p className="text-[#2D2E30]/70 text-sm md:text-base">{sellerProfile.workingHours}</p>
                  </div>
                </div>

                {/* Статистика заказов */}
                <div className="flex items-start gap-2 md:gap-3">
                  <Package className="w-4 h-4 md:w-5 md:h-5 text-[#2B4A39] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[#2D2E30] font-semibold text-sm md:text-base">Заказы</p>
                    <p className="text-[#2D2E30]/70 text-xs md:text-base">
                      Выполнено: {sellerProfile.ordersCompleted} • Активных: {sellerProfile.ordersActive} • Отменено: {sellerProfile.ordersCancelled}
                    </p>
                  </div>
                </div>

                {/* Доставка */}
                <div className="flex items-start gap-2 md:gap-3">
                  <Truck className="w-4 h-4 md:w-5 md:h-5 text-[#2B4A39] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[#2D2E30] font-semibold text-sm md:text-base">Доставка</p>
                    <p className="text-[#2D2E30]/70 text-xs md:text-base">{sellerProfile.deliveryServices.join(", ")}</p>
                    <p className="text-[#2D2E30]/70 text-xs md:text-sm">Отправка: {sellerProfile.shippingDays}</p>
                  </div>
                </div>

                {/* Самовывоз */}
                {sellerProfile.selfPickup && (
                  <div className="flex items-start gap-2 md:gap-3">
                    <MapPin className="w-4 h-4 md:w-5 md:h-5 text-[#2B4A39] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[#2D2E30] font-semibold text-sm md:text-base">Самовывоз</p>
                      <p className="text-[#2D2E30]/70 text-sm md:text-base">Доступен</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Пожаловаться на профиль */}
            <div className="py-2 pb-0">
              <ProfileMenuItem 
                icon={Flag} 
                label="Пожаловаться на профиль" 
                variant="danger"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;

