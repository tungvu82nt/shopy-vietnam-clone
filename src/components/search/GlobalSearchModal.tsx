import React, { useEffect, useRef, useState } from 'react';
import { Search, X, Clock, TrendingUp, Command, ArrowRight, Star, MapPin, Zap, Package } from 'lucide-react';
import { useSearch } from '../../contexts/SearchContext';
import { globalSearchService, SearchResult } from '../../services/globalSearchService';
import { searchAnalytics } from '../../services/searchAnalytics';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn, formatPrice } from '../../lib/utils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const { state, setQuery, performSearch, selectSuggestion, clearSearchHistory } = useSearch();
  const [instantResults, setInstantResults] = useState<SearchResult[]>([]);
  const [isLoadingInstant, setIsLoadingInstant] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setShowSuggestions(true);
      searchAnalytics.startSearchTimer();
    } else {
      setInstantResults([]);
      setSelectedIndex(-1);
      setShowSuggestions(false);
    }
  }, [isOpen]);

  // Handle instant search
  useEffect(() => {
    if (state.query.length >= 2) {
      setIsLoadingInstant(true);
      setShowSuggestions(true);
      
      const searchTimeout = setTimeout(async () => {
        try {
          const results = await globalSearchService.instantSearch(state.query);
          setInstantResults(results);
          
          // Track autocomplete
          searchAnalytics.trackAutocomplete(state.query);
        } catch (error) {
          console.error('Instant search error:', error);
          setInstantResults([]);
        } finally {
          setIsLoadingInstant(false);
        }
      }, 300);
      
      return () => clearTimeout(searchTimeout);
    } else {
      setInstantResults([]);
      setIsLoadingInstant(false);
      setShowSuggestions(state.query.length === 0);
    }
  }, [state.query]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      const totalItems = state.suggestions.length + instantResults.length + state.searchHistory.length + state.trendingSearches.length;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
          
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % totalItems);
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1);
          break;
          
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0) {
            handleItemSelect(selectedIndex);
          } else if (state.query.trim()) {
            handleSearch(e);
          }
          break;
          
        case 'Tab':
          if (selectedIndex >= 0) {
            e.preventDefault();
            handleItemSelect(selectedIndex);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, selectedIndex, state.suggestions, instantResults, state.searchHistory, state.trendingSearches, state.query]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (state.query.trim()) {
      const timeSpent = searchAnalytics.endSearchTimer();
      searchAnalytics.trackSearchWithResults(
        state.query,
        instantResults.length,
        {},
        'global'
      );
      performSearch(state.query);
    }
  };

  // Handle item selection by index
  const handleItemSelect = (index: number) => {
    let currentIndex = 0;
    
    // Check suggestions first
    if (index < state.suggestions.length) {
      const suggestion = state.suggestions[index];
      setQuery(suggestion.text);
      performSearch(suggestion.text);
      searchAnalytics.trackSearchClick(state.query, suggestion.text, index, 'global');
      return;
    }
    currentIndex += state.suggestions.length;
    
    // Check instant results
    if (index < currentIndex + instantResults.length) {
      const resultIndex = index - currentIndex;
      const result = instantResults[resultIndex];
      window.location.href = result.url;
      searchAnalytics.trackSearchClick(state.query, result.id, index, 'global');
      onClose();
      return;
    }
    currentIndex += instantResults.length;
    
    // Check search history
    if (index < currentIndex + state.searchHistory.length) {
      const historyIndex = index - currentIndex;
      const historyItem = state.searchHistory[historyIndex];
      setQuery(historyItem);
      performSearch(historyItem);
      return;
    }
    currentIndex += state.searchHistory.length;
    
    // Check trending searches
    if (index < currentIndex + state.trendingSearches.length) {
      const trendingIndex = index - currentIndex;
      const trendingItem = state.trendingSearches[trendingIndex];
      setQuery(trendingItem);
      performSearch(trendingItem);
      return;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: any) => {
    setQuery(suggestion.text);
    performSearch(suggestion.text);
    searchAnalytics.trackSearchClick(state.query, suggestion.text, 0, 'global');
  };

  // Handle instant result click
  const handleInstantResultClick = (result: SearchResult, index: number) => {
    searchAnalytics.trackSearchClick(state.query, result.id, index, 'global');
    window.location.href = result.url;
    onClose();
  };

  // Handle history click
  const handleHistoryClick = (item: string) => {
    setQuery(item);
    performSearch(item);
  };

  // Handle trending click
  const handleTrendingClick = (item: string) => {
    setQuery(item);
    performSearch(item);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="flex items-start justify-center pt-16 px-4">
        <div
          ref={modalRef}
          className="w-full max-w-2xl bg-background rounded-lg shadow-2xl border"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Tìm kiếm</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearch} className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Tìm kiếm sản phẩm, thương hiệu, danh mục..."
                value={state.query}
                onChange={handleInputChange}
                className="pl-10 pr-20 h-12 text-base"
              />
              {state.query && (
                <button
                  onClick={() => {
                    setQuery('');
                    setInstantResults([]);
                    setSelectedIndex(-1);
                  }}
                  className="absolute right-12 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
                <Command className="h-3 w-3" />
                <span>K</span>
              </div>
            </div>
          </form>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto" ref={resultsRef}>
            {/* Loading */}
            {state.isLoading && (
              <div className="p-4 text-center text-muted-foreground">
                Đang tìm kiếm...
              </div>
            )}

            {/* Instant Results */}
            {instantResults.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1 flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Kết quả tức thì
                </div>
                {instantResults.slice(0, 3).map((result, index) => {
                  const globalIndex = state.suggestions.length + index;
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleInstantResultClick(result, index)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors",
                        selectedIndex === globalIndex
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted"
                      )}
                    >
                      <div className="w-8 h-8 bg-muted rounded flex items-center justify-center flex-shrink-0">
                        {result.image ? (
                          <img
                            src={result.image}
                            alt={result.title}
                            className="w-6 h-6 object-cover rounded"
                          />
                        ) : (
                          <Star className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{result.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{result.category}</div>
                        {result.price && (
                          <div className="text-xs font-medium text-primary">
                            {formatPrice(result.price)}
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {result.type === 'product' ? 'Sản phẩm' : 
                         result.type === 'category' ? 'Danh mục' : 'Thương hiệu'}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Loading skeleton for instant results */}
            {isLoadingInstant && state.query.length >= 2 && (
              <div className="p-2">
                <div className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1 flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Kết quả tức thì
                </div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2">
                    <Skeleton className="w-8 h-8 rounded" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {state.suggestions.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1">
                  Gợi ý tìm kiếm
                </div>
                {state.suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${index}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors",
                      selectedIndex === index
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted"
                    )}
                  >
                    <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{suggestion.text}</div>
                      {suggestion.count && (
                        <div className="text-xs text-muted-foreground">
                          {suggestion.count} sản phẩm
                        </div>
                      )}
                      {suggestion.price && (
                        <div className="text-xs text-muted-foreground">
                          {suggestion.price.toLocaleString('vi-VN')} ₫
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {suggestion.type === 'product' && 'Sản phẩm'}
                      {suggestion.type === 'category' && 'Danh mục'}
                      {suggestion.type === 'brand' && 'Thương hiệu'}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Search History */}
            {state.query.length === 0 && state.searchHistory.length > 0 && (
              <div className="p-2">
                <div className="flex items-center justify-between px-2 py-1 mb-1">
                  <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Tìm kiếm gần đây
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearchHistory}
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Xóa tất cả
                  </Button>
                </div>
                {state.searchHistory.slice(0, 5).map((item, index) => {
                  const globalIndex = state.suggestions.length + instantResults.length + index;
                  return (
                    <button
                      key={`history-${index}`}
                      onClick={() => handleHistoryClick(item)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors",
                        selectedIndex === globalIndex
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted"
                      )}
                    >
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="flex-1 truncate">{item}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Trending Searches */}
            {state.query.length === 0 && state.trendingSearches.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Tìm kiếm phổ biến
                </div>
                {state.trendingSearches.slice(0, 5).map((item, index) => {
                  const globalIndex = state.suggestions.length + instantResults.length + state.searchHistory.length + index;
                  return (
                    <button
                      key={`trending-${index}`}
                      onClick={() => handleTrendingClick(item)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors",
                        selectedIndex === globalIndex
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted"
                      )}
                    >
                      <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="flex-1 truncate">{item}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* No results */}
            {state.suggestions.length === 0 && 
             instantResults.length === 0 && 
             state.query.length >= 2 && 
             !state.isLoading && 
             !isLoadingInstant && (
              <div className="p-4 text-center text-muted-foreground">
                Không tìm thấy kết quả cho "{state.query}"
              </div>
            )}

            {/* Empty state */}
            {state.query.length === 0 && 
             state.searchHistory.length === 0 && 
             state.trendingSearches.length === 0 && 
             !state.isLoading && (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Bắt đầu tìm kiếm sản phẩm</p>
                <p className="text-sm mt-1">Sử dụng Cmd+K để mở nhanh</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GlobalSearchModal;