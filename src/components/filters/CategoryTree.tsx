import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { CategoryPublic } from '../../api/catalogService';
import { cn } from '../ui/utils';

interface CategoryTreeProps {
  categories: CategoryPublic[];
  selectedCategoryId?: number | null;
  onCategorySelect?: (category: CategoryPublic | null) => void;
  loading?: boolean;
}

interface TreeNode extends CategoryPublic {
  children: TreeNode[];
}

/**
 * Раскрывающееся дерево категорий с поддержкой вложенности.
 *
 * Особенности:
 * - Автоматическое раскрытие ветки с выбранной категорией
 * - Иконки +/- для категорий с подкатегориями
 * - Подсветка выбранной категории
 * - Ленивое раскрытие для производительности
 */
export default function CategoryTree({
  categories,
  selectedCategoryId,
  onCategorySelect,
  loading = false,
}: CategoryTreeProps) {
  // Состояние раскрытых узлов (id категорий)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // Строим дерево из плоского списка категорий
  const tree = useMemo(() => {
    const nodeMap = new Map<number, TreeNode>();
    const roots: TreeNode[] = [];

    // Создаём узлы
    categories.forEach((cat) => {
      nodeMap.set(cat.id, { ...cat, children: [] });
    });

    // Связываем родителей и детей
    categories.forEach((cat) => {
      const node = nodeMap.get(cat.id)!;
      if (cat.parentId && nodeMap.has(cat.parentId)) {
        nodeMap.get(cat.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Сортируем по имени
    const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
      return nodes
        .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
        .map((node) => ({
          ...node,
          children: sortNodes(node.children),
        }));
    };

    return sortNodes(roots);
  }, [categories]);

  // Находим путь к выбранной категории для автораскрытия
  useMemo(() => {
    if (!selectedCategoryId) return;

    const findPath = (nodes: TreeNode[], targetId: number, path: number[] = []): number[] | null => {
      for (const node of nodes) {
        if (node.id === targetId) {
          return path;
        }
        if (node.children.length > 0) {
          const result = findPath(node.children, targetId, [...path, node.id]);
          if (result) return result;
        }
      }
      return null;
    };

    const path = findPath(tree, selectedCategoryId);
    if (path) {
      setExpandedIds((prev) => new Set([...prev, ...path]));
    }
  }, [selectedCategoryId, tree]);

  const toggleExpand = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCategoryClick = (category: CategoryPublic | null) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  const renderNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedCategoryId === node.id;
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200',
            'hover:bg-gray-100',
            isSelected && 'bg-primary-100 text-primary-700 font-medium hover:bg-primary-100'
          )}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
        >
          {/* Кнопка раскрытия */}
          {hasChildren ? (
            <button
              onClick={(e) => toggleExpand(node.id, e)}
              className={cn(
                'p-0.5 rounded hover:bg-gray-200 transition-colors',
                isSelected && 'hover:bg-primary-200'
              )}
              aria-label={isExpanded ? 'Свернуть' : 'Развернуть'}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <span className="w-5" /> // Placeholder для выравнивания
          )}

          {/* Иконка папки */}
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="w-4 h-4 text-primary-500 flex-shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )
          ) : (
            <span className="w-4 h-4 flex-shrink-0" />
          )}

          {/* Ссылка на категорию */}
          <Link
            to={`/catalog?category=${node.slug}`}
            onClick={() => handleCategoryClick(node)}
            className="flex-1 truncate text-sm"
            title={node.name}
          >
            {node.name}
          </Link>

          {/* Счётчик подкатегорий */}
          {hasChildren && (
            <span className="text-xs text-gray-400 ml-auto">
              {node.children.length}
            </span>
          )}
        </div>

        {/* Дочерние узлы */}
        {hasChildren && isExpanded && (
          <div className="animate-in slide-in-from-top-1 duration-200">
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Пункт "Все категории" */}
      <Link
        to="/catalog"
        onClick={() => handleCategoryClick(null)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
          'hover:bg-gray-100',
          !selectedCategoryId && 'bg-primary-100 text-primary-700 font-medium'
        )}
      >
        <span className="w-5" />
        <span className="text-sm">Все категории</span>
      </Link>

      {/* Дерево категорий */}
      {tree.map((node) => renderNode(node))}
    </div>
  );
}
