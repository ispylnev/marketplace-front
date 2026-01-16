import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import Header from '../components/Header';
import { sellerService } from '../api/sellerService';
import { SellerResponse, SellerStatusLabels, CompanyTypeLabels, CompanyType } from '../types/seller';
import { ErrorAlert } from '../components/ui/ErrorAlert';

/**
 * Страница модерации продавцов (для модераторов и админов)
 * 
 * Функционал:
 * - Просмотр списка продавцов, ожидающих одобрения
 * - Одобрение продавцов
 * - Блокировка продавцов с указанием причины
 */
export default function SellerModeration() {
  const [pendingSellers, setPendingSellers] = useState<SellerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [blockReason, setBlockReason] = useState<{ [key: number]: string }>({});
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    loadPendingSellers();
  }, []);

  const loadPendingSellers = async () => {
    setLoading(true);
    setError(null);
    try {
      const sellers = await sellerService.getPendingSellers();
      setPendingSellers(sellers);
    } catch (err: any) {
      console.error('Ошибка загрузки продавцов:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSeller = async (sellerId: number) => {
    setProcessingId(sellerId);
    setError(null);
    try {
      await sellerService.approveSeller(sellerId);
      // Удаляем продавца из списка ожидающих после одобрения
      setPendingSellers(prev => prev.filter(s => s.id !== sellerId));
    } catch (err: any) {
      console.error('Ошибка одобрения продавца:', err);
      setError(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleBlockSeller = async (sellerId: number) => {
    const reason = blockReason[sellerId]?.trim();
    if (!reason) {
      setError('Укажите причину блокировки');
      return;
    }

    setProcessingId(sellerId);
    setError(null);
    try {
      await sellerService.blockSeller(sellerId, reason);
      // Удаляем продавца из списка ожидающих после блокировки
      setPendingSellers(prev => prev.filter(s => s.id !== sellerId));
      // Очищаем поле причины
      setBlockReason(prev => {
        const newState = { ...prev };
        delete newState[sellerId];
        return newState;
      });
    } catch (err: any) {
      console.error('Ошибка блокировки продавца:', err);
      setError(err);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#2B4A39]" />
            <p className="mt-4 text-gray-600">Загрузка списка продавцов...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#2D2E30] mb-2">Модерация продавцов</h1>
          <p className="text-gray-600">
            Список продавцов, ожидающих одобрения ({pendingSellers.length})
          </p>
        </div>

        <ErrorAlert
          error={error}
          className="mb-6"
          onClose={() => setError(null)}
          closable={true}
        />

        {pendingSellers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-xl font-semibold text-[#2D2E30] mb-2">
              Нет продавцов, ожидающих одобрения
            </h2>
            <p className="text-gray-600">
              Все заявки обработаны
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingSellers.map((seller) => (
              <div
                key={seller.id}
                className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#BCCEA9]"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Информация о продавце */}
                  <div>
                    <h3 className="text-xl font-bold text-[#2D2E30] mb-4">
                      {seller.shopName}
                    </h3>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-semibold text-gray-700">Юридическое название:</span>
                        <p className="text-gray-600">{seller.legalName}</p>
                      </div>
                      
                      <div>
                        <span className="font-semibold text-gray-700">Тип:</span>
                        <p className="text-gray-600">
                          {CompanyTypeLabels[seller.companyType as CompanyType] || seller.companyType}
                        </p>
                      </div>
                      
                      <div>
                        <span className="font-semibold text-gray-700">ИНН:</span>
                        <p className="text-gray-600">{seller.inn}</p>
                      </div>
                      
                      {seller.ogrn && (
                        <div>
                          <span className="font-semibold text-gray-700">ОГРН:</span>
                          <p className="text-gray-600">{seller.ogrn}</p>
                        </div>
                      )}
                      
                      <div>
                        <span className="font-semibold text-gray-700">Email:</span>
                        <p className="text-gray-600">{seller.contactEmail}</p>
                      </div>
                      
                      {seller.contactPhone && (
                        <div>
                          <span className="font-semibold text-gray-700">Телефон:</span>
                          <p className="text-gray-600">{seller.contactPhone}</p>
                        </div>
                      )}
                      
                      {seller.legalAddress && (
                        <div>
                          <span className="font-semibold text-gray-700">Адрес:</span>
                          <p className="text-gray-600">{seller.legalAddress}</p>
                        </div>
                      )}
                      
                      {seller.description && (
                        <div>
                          <span className="font-semibold text-gray-700">Описание:</span>
                          <p className="text-gray-600">{seller.description}</p>
                        </div>
                      )}
                      
                      <div>
                        <span className="font-semibold text-gray-700">Дата регистрации:</span>
                        <p className="text-gray-600">
                          {new Date(seller.createdAt).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Статус:</p>
                        <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          {SellerStatusLabels[seller.status]}
                        </span>
                      </div>

                      {/* Поле для причины блокировки */}
                      <div className="mb-4">
                        <Label htmlFor={`block-reason-${seller.id}`} className="text-[#2D2E30] mb-2">
                          Причина блокировки (при блокировке)
                        </Label>
                        <Input
                          id={`block-reason-${seller.id}`}
                          value={blockReason[seller.id] || ''}
                          onChange={(e) => setBlockReason(prev => ({
                            ...prev,
                            [seller.id]: e.target.value
                          }))}
                          placeholder="Укажите причину блокировки"
                          className="mt-1"
                          disabled={processingId === seller.id}
                        />
                      </div>
                    </div>

                    {/* Кнопки действий */}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleApproveSeller(seller.id)}
                        disabled={processingId !== null}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        {processingId === seller.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Одобрить
                      </Button>
                      
                      <Button
                        onClick={() => handleBlockSeller(seller.id)}
                        disabled={processingId !== null}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      >
                        {processingId === seller.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        Заблокировать
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

