import { useState } from 'react';
import { Check, X, Edit, Trash2, Search, AlertCircle, Loader2, BookOpen } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { BrandResponse } from '../../api/adminService';

interface BrandsTabProps {
  brands: BrandResponse[];
  onToggleActive: (id: number, isActive: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function BrandsTab({ brands, onToggleActive, onDelete }: BrandsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  const filteredBrands = brands.filter(b => {
    if (searchQuery && !b.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleToggleActive = async (id: number, isActive: boolean) => {
    setProcessingId(id);
    try {
      await onToggleActive(id, isActive);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены что хотите удалить этот бренд?')) return;

    setProcessingId(id);
    try {
      await onDelete(id);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 lg:p-6">
      <div className="flex flex-col gap-4 mb-6">
        <h2 className="text-[#2B4A39] font-semibold text-xl">
          Управление брендами
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2D2E30]/50" />
          <Input
            type="text"
            placeholder="Поиск бренда..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredBrands.map(brand => (
          <div key={brand.id} className="border border-[#2D2E30]/10 rounded-lg p-4 hover:border-[#BCCEA9] transition-colors">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-24 h-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                {brand.logoUrl ? (
                  <img
                    src={brand.logoUrl}
                    alt={brand.name}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <BookOpen className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <h3 className="text-[#2D2E30] font-semibold text-base">
                      {brand.name}
                    </h3>
                    {brand.country && (
                      <p className="text-[#2D2E30]/50 text-sm">{brand.country}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold shrink-0 ${
                    brand.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {brand.isActive ? 'Активен' : 'Неактивен'}
                  </span>
                </div>

                {brand.description && (
                  <p className="text-[#2D2E30]/70 text-sm mb-2 line-clamp-2">
                    {brand.description}
                  </p>
                )}

                <p className="text-[#2D2E30]/70 text-xs mb-3">
                  Slug: {brand.slug} • Создан: {new Date(brand.createdAt).toLocaleDateString('ru-RU')}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => handleToggleActive(brand.id, brand.isActive)}
                    disabled={processingId === brand.id}
                    size="sm"
                    className={brand.isActive
                      ? 'bg-gray-600 hover:bg-gray-700 text-white text-xs h-8'
                      : 'bg-green-600 hover:bg-green-700 text-white text-xs h-8'
                    }
                  >
                    {processingId === brand.id ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      brand.isActive ?
                        <X className="w-3 h-3 mr-1" /> :
                        <Check className="w-3 h-3 mr-1" />
                    )}
                    <span className="hidden sm:inline">
                      {brand.isActive ? 'Деактивировать' : 'Активировать'}
                    </span>
                  </Button>
                  <Button
                    onClick={() => handleDelete(brand.id)}
                    disabled={processingId === brand.id}
                    size="sm"
                    variant="outline"
                    className="border-red-600 text-red-600 hover:bg-red-50 text-xs h-8"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Удалить</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[#2B4A39] text-xs h-8"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Редактировать</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBrands.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-[#2D2E30]/30 mx-auto mb-3" />
          <p className="text-[#2D2E30]/70">
            {brands.length === 0 ? 'Нет брендов' : 'Бренды не найдены'}
          </p>
        </div>
      )}
    </div>
  );
}

export default BrandsTab;
