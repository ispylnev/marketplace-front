import { useState } from 'react';
import { Check, X, Eye, Search, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { OfferForModeration } from '../../api/adminService';
import { useToast } from '../../hooks';

interface OfferModerationTabProps {
  offers: OfferForModeration[];
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number, reason: string) => Promise<void>;
}

export function OfferModerationTab({ offers, onApprove, onReject }: OfferModerationTabProps) {
  const { error: showError } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [rejectReason, setRejectReason] = useState<Record<number, string>>({});
  const [processingId, setProcessingId] = useState<number | null>(null);

  const filteredOffers = offers.filter(o => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    if (searchQuery && o.sku && !o.sku.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleApprove = async (id: number) => {
    setProcessingId(id);
    try {
      await onApprove(id);
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
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 lg:p-6">
      <div className="flex flex-col gap-4 mb-6">
        <h2 className="text-[#2B4A39] font-semibold text-xl">
          Модерация офферов
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2D2E30]/50" />
            <Input
              type="text"
              placeholder="Поиск по SKU..."
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
            <option value="PENDING_REVIEW">Модерация</option>
            <option value="APPROVED">Одобрено</option>
            <option value="REJECTED">Отклонено</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredOffers.map(offer => (
          <div key={offer.id} className="border border-[#2D2E30]/10 rounded-lg p-4 hover:border-[#BCCEA9] transition-colors">
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="text-[#2D2E30] font-semibold text-base mb-1">
                    Оффер #{offer.id}
                    {offer.sku && <span className="text-sm text-[#2D2E30]/70 ml-2">SKU: {offer.sku}</span>}
                  </h3>
                  <p className="text-sm text-[#2D2E30]/70">
                    Продукт ID: {offer.productId} • Продавец ID: {offer.sellerId}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold shrink-0 ${
                  offer.status === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                  offer.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  offer.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {offer.status === 'PENDING_REVIEW' ? 'Модерация' :
                   offer.status === 'APPROVED' ? 'Одобрено' :
                   offer.status === 'REJECTED' ? 'Отклонено' :
                   offer.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-[#2D2E30]/70">Цена:</span>
                  <p className="text-[#2B4A39] font-bold">{offer.price} {offer.currency}</p>
                </div>
                <div>
                  <span className="text-[#2D2E30]/70">Состояние:</span>
                  <p className="text-[#2D2E30]">{offer.condition || 'NEW'}</p>
                </div>
                <div>
                  <span className="text-[#2D2E30]/70">Инвентарь:</span>
                  <p className="text-[#2D2E30] text-xs truncate">{offer.inventorySkuId}</p>
                </div>
              </div>

              {offer.status === 'PENDING_REVIEW' && (
                <div className="mb-2">
                  <Label className="text-[#2D2E30] text-xs mb-1">
                    Причина отклонения (при отклонении)
                  </Label>
                  <Input
                    value={rejectReason[offer.id] || ''}
                    onChange={(e) => setRejectReason(prev => ({
                      ...prev,
                      [offer.id]: e.target.value
                    }))}
                    placeholder="Укажите причину..."
                    className="text-sm"
                    disabled={processingId === offer.id}
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {offer.status === 'PENDING_REVIEW' && (
                  <>
                    <Button
                      onClick={() => handleApprove(offer.id)}
                      disabled={processingId !== null}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                    >
                      {processingId === offer.id ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        <Check className="w-3 h-3 mr-1" />
                      )}
                      <span className="hidden sm:inline">Одобрить</span>
                    </Button>
                    <Button
                      onClick={() => handleReject(offer.id)}
                      disabled={processingId !== null}
                      size="sm"
                      variant="outline"
                      className="border-red-600 text-red-600 hover:bg-red-50 text-xs h-8"
                    >
                      <X className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Отклонить</span>
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[#2B4A39] text-xs h-8"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Детали</span>
                </Button>
              </div>

              {offer.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                  <p className="text-xs text-red-800">
                    <strong>Причина отклонения:</strong> {offer.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredOffers.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-[#2D2E30]/30 mx-auto mb-3" />
          <p className="text-[#2D2E30]/70">
            {offers.length === 0 ? 'Нет офферов на модерации' : 'Офферы не найдены'}
          </p>
        </div>
      )}
    </div>
  );
}

export default OfferModerationTab;
