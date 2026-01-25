import { Search, X, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchService } from '../api/searchService';

interface SearchBarProps {
  /** Плейсхолдер для инпута */
  placeholder?: string;
  /** Автофокус при монтировании */
  autoFocus?: boolean;
  /** Кастомный класс для контейнера */
  className?: string;
  /** Компактный вариант для header */
  compact?: boolean;
  /** Вариант для тёмного фона (header) */
  variant?: 'light' | 'dark';
}

const SearchBar = ({
  placeholder = 'Поиск растений, семян, удобрений...',
  autoFocus = false,
  className = '',
  compact = false,
  variant = 'light',
}: SearchBarProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Инициализируем из URL параметра q
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Загрузка подсказок с дебаунсом
  const loadSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchService.suggest(searchQuery, 8);
      setSuggestions(results);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Дебаунс для автокомплита
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length >= 2) {
      debounceRef.current = setTimeout(() => {
        loadSuggestions(query);
      }, 300);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, loadSuggestions]);

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Выполнить поиск
  const performSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (trimmed) {
      navigate(`/catalog?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/catalog');
    }
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  // Обработка нажатий клавиш
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        // Выбрана подсказка
        setQuery(suggestions[selectedIndex]);
        performSearch(suggestions[selectedIndex]);
      } else {
        // Поиск по введённому тексту
        performSearch(query);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  // Выбор подсказки
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    performSearch(suggestion);
  };

  // Очистка поиска
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Стили для разных вариантов
  const inputStyles = compact
    ? variant === 'dark'
      ? 'w-full px-4 py-2 pl-10 pr-10 border border-white/30 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent'
      : 'w-full px-4 py-2 pl-10 pr-10 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
    : 'w-full pl-14 pr-14 py-5 border-2 border-gray-200 bg-white rounded-2xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all text-lg text-gray-900 shadow-xl placeholder:text-gray-400';

  const iconSize = compact ? 'w-5 h-5' : 'w-6 h-6';
  const iconLeft = compact ? 'left-3' : 'left-5';
  const iconRight = compact ? 'right-3' : 'right-4';
  const iconColor = variant === 'dark' && compact ? 'text-white/60' : 'text-gray-400';

  return (
    <div ref={containerRef} className={`relative w-full ${compact ? '' : 'max-w-3xl'} ${className}`}>
      <div className="relative">
        <Search className={`absolute ${iconLeft} top-1/2 transform -translate-y-1/2 ${iconColor} ${iconSize}`} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={inputStyles}
        />

        {/* Loading / Clear button */}
        <div className={`absolute ${iconRight} top-1/2 transform -translate-y-1/2`}>
          {isLoading ? (
            <Loader2 className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} ${iconColor} animate-spin`} />
          ) : query ? (
            <button
              onClick={handleClear}
              className={`${iconColor} hover:opacity-80 p-1`}
              type="button"
            >
              <X className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
            </button>
          ) : null}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          <ul className="py-2">
            {suggestions.map((suggestion, index) => (
              <li key={suggestion}>
                <button
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full px-5 py-3 text-left flex items-center gap-3 transition-colors ${
                    index === selectedIndex
                      ? 'bg-primary-50 text-primary-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{suggestion}</span>
                </button>
              </li>
            ))}
          </ul>

          {/* Подсказка про Enter */}
          <div className="px-5 py-2 bg-gray-50 border-t text-xs text-gray-500 flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600 font-mono">Enter</kbd>
            <span>для поиска</span>
            <span className="mx-1">•</span>
            <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-600 font-mono">↑↓</kbd>
            <span>для навигации</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
