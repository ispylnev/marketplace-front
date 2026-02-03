import { useState } from 'react';
import { Check, X, Eye, Search, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { SellerResponse, SellerStatus, SellerStatusLabels, CompanyTypeLabels, CompanyType } from '../../types/seller';
import { useToast } from '../../hooks';

interface SellerModerationTabProps {
  sellers: SellerResponse[];
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number, reason: string) => Promise<void>;
  onBlock: (id: number, reason: string) => Promise<void>;
}

export function SellerModerationTab({ sellers, onApprove, onReject, onBlock }: SellerModerationTabProps) {
  const { error: showError } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [rejectReason, setRejectReason] = useState<Record<number, string>>({});
  const [blockReason, setBlockReason] = useState<Record<number, string>>({});
  const [processingId, setProcessingId] = useState<number | null>(null);

  const filteredSellers = sellers.filter(s => {
    if (filterStatus !== 'all') {
      if (filterStatus === 'active' && s.status !== SellerStatus.APPROVED) return false;
      if (filterStatus === 'pending' && s.status !== SellerStatus.PENDING) return false;
      if (filterStatus === 'blocked' && s.status !== SellerStatus.BLOCKED) return false;
    }
    if (searchQuery && !s.shopName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleApprove = async (id: number) => {
    setProcessingId(id);
    try {
      await onApprove(id);
    } catch {
      // Ошибка обрабатывается в родительском компоненте
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
      setRejectReason(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    } catch {
      // Ошибка обрабатывается в родительском компоненте
    } finally {
      setProcessingId(null);
    }
  };

  const handleBlock = async (id: number) => {
    const reason = blockReason[id]?.trim();
    if (!reason) {
      showError('Укажите причину блокировки');
      return;
    }

    setProcessingId(id);
    try {
      await onBlock(id, reason);
      setBlockReason(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    } catch {
      // Ошибка обрабатывается в родительском компоненте
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 lg:p-6">
      <div className="flex flex-col gap-4 mb-6">
        <h2 className="text-[#2B4A39] font-semibold text-xl">
          Модерация продавцов
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2D2E30]/50" />
            <Input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-[#2D2E30]/20 rounded-lg focus:outline-none focus:border-[#BCCEA9]"
          >
            <option value="all">Все</option>
            <option value="pending">Модерация</option>
            <option value="active">Активные</option>
            <option value="blocked">Заблокированные</option>
          </select>
        </div>
      </div>

      {filteredSellers.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-[#2D2E30]/30 mx-auto mb-3" />
          <p className="text-[#2D2E30]/70">
            {sellers.length === 0 ? 'Нет продавцов на модерации' : 'Продавцы не найдены'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSellers.map(seller => (
            <div key={seller.id} className="border border-[#2D2E30]/10 rounded-lg p-4 hover:border-[#BCCEA9] transition-colors">
              <div className="mb-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <h3 className="text-[#2D2E30] font-semibold flex-1">
                    {seller.shopName}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold self-start ${
                    seller.status === SellerStatus.PENDING ? 'bg-yellow-100 text-yellow-800' :
                    seller.status === SellerStatus.APPROVED ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {SellerStatusLabels[seller.status]}
                  </span>
                </div>

                <p className="text-[#2D2E30]/70 text-sm mb-3">
                  {seller.description || 'Описание не указано'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#2D2E30]/70">
                  <span>Email: {seller.contactEmail}</span>
                  {seller.contactPhone && <span>Тел: {seller.contactPhone}</span>}
                  <span>Тип: {CompanyTypeLabels[seller.companyType as CompanyType] || seller.companyType}</span>
                  <span>ИНН: {seller.inn}</span>
                  <span className="sm:col-span-2">Создан: {new Date(seller.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>

              {seller.status === SellerStatus.PENDING && (
                <div className="mb-3 space-y-2">
                  <div>
                    <Label className="text-[#2D2E30] text-xs mb-1">
                      Причина отклонения
                    </Label>
                    <Input
                      value={rejectReason[seller.id] || ''}
                      onChange={(e) => setRejectReason(prev => ({
                        ...prev,
                        [seller.id]: e.target.value
                      }))}
                      placeholder="Например: Нужны дополнительные документы..."
                      className="text-sm"
                      disabled={processingId === seller.id}
                    />
                  </div>
                  <div>
                    <Label className="text-[#2D2E30] text-xs mb-1">
                      Причина блокировки
                    </Label>
                    <Input
                      value={blockReason[seller.id] || ''}
                      onChange={(e) => setBlockReason(prev => ({
                        ...prev,
                        [seller.id]: e.target.value
                      }))}
                      placeholder="Например: Нарушение правил..."
                      className="text-sm"
                      disabled={processingId === seller.id}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {seller.status === SellerStatus.PENDING && (
                  <>
                    <Button
                      onClick={() => handleApprove(seller.id)}
                      disabled={processingId !== null}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                    >
                      {processingId === seller.id ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        <Check className="w-3 h-3 mr-1" />
                      )}
                      <span className="hidden sm:inline">Одобрить</span>
                    </Button>
                    <Button
                      onClick={() => handleReject(seller.id)}
                      disabled={processingId !== null}
                      size="sm"
                      variant="outline"
                      className="border-yellow-600 text-yellow-600 hover:bg-yellow-50 text-xs h-8"
                    >
                      <X className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Отклонить</span>
                    </Button>
                    <Button
                      onClick={() => handleBlock(seller.id)}
                      disabled={processingId !== null}
                      size="sm"
                      variant="outline"
                      className="border-red-600 text-red-600 hover:bg-red-50 text-xs h-8"
                    >
                      <X className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Заблокировать</span>
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[#2B4A39] text-xs h-8"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Подробнее</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SellerModerationTab;
