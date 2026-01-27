import { useState } from 'react';
import { Check, X, Edit, Trash2, Search, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { CategoryResponse } from '../../api/adminService';

interface CategoriesTabProps {
  categories: CategoryResponse[];
  onToggleActive: (id: number, isActive: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function CategoriesTab({ categories, onToggleActive, onDelete }: CategoriesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  const filteredCategories = categories.filter(c => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
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
    if (!confirm('Вы уверены что хотите удалить эту категорию?')) return;

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
          Категории каталога
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2D2E30]/50" />
          <Input
            type="text"
            placeholder="Поиск категории..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredCategories.map(category => (
          <div key={category.id} className="border border-[#2D2E30]/10 rounded-lg p-4 hover:border-[#BCCEA9] transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-[#2D2E30]">
                    {category.name}
                  </h3>
                  <span className="text-xs text-[#2D2E30]/50">({category.slug})</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {category.isActive ? 'Активна' : 'Неактивна'}
                  </span>
                </div>
                {category.description && (
                  <p className="text-[#2D2E30]/70 text-sm mb-2">{category.description}</p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-[#2D2E30]/70">
                  {category.categoryType && (
                    <span>Тип: {category.categoryType}</span>
                  )}
                  {category.parentId && (
                    <span>• Родитель ID: {category.parentId}</span>
                  )}
                  <span>• Уровень: {category.level || 0}</span>
                  <span>• Порядок: {category.sortOrder || 0}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handleToggleActive(category.id, category.isActive)}
                  disabled={processingId === category.id}
                  size="sm"
                  className={category.isActive
                    ? 'bg-gray-600 hover:bg-gray-700 text-white text-xs h-7'
                    : 'bg-green-600 hover:bg-green-700 text-white text-xs h-7'
                  }
                >
                  {processingId === category.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    category.isActive ?
                      <X className="w-3 h-3 mr-1" /> :
                      <Check className="w-3 h-3 mr-1" />
                  )}
                  <span className="hidden sm:inline">
                    {category.isActive ? 'Отключить' : 'Включить'}
                  </span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[#2B4A39] h-7"
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  onClick={() => handleDelete(category.id)}
                  disabled={processingId === category.id}
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 h-7"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-[#2D2E30]/30 mx-auto mb-3" />
          <p className="text-[#2D2E30]/70">
            {categories.length === 0 ? 'Нет категорий' : 'Категории не найдены'}
          </p>
        </div>
      )}
    </div>
  );
}

export default CategoriesTab;
