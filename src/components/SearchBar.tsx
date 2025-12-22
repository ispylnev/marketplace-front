import { Search, X } from 'lucide-react';
import { useState } from 'react';

const SearchBar = () => {
  const [query, setQuery] = useState('');

  return (
    <div className="relative w-full max-w-3xl">
      <div className="relative">
        <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск растений, семян, удобрений..."
          className="w-full pl-14 pr-14 py-5 border-2 border-white/20 bg-white/95 backdrop-blur-sm rounded-2xl focus:border-white focus:bg-white focus:outline-none transition-all text-lg shadow-xl placeholder:text-gray-500"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
