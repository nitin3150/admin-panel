import { useState, useCallback, useMemo, useEffect } from 'react';

interface UseFiltersOptions<T> {
  initialFilters?: Partial<T>;
  onFilterChange?: (filters: T) => void;
}

export const useFilters = <T extends Record<string, any>>(
  options: UseFiltersOptions<T> = {}
) => {
  const { initialFilters = {} as T, onFilterChange } = options;
  const [filters, setFilters] = useState<T>(initialFilters as T);

  const updateFilter = useCallback((key: keyof T, value: T[keyof T]) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      onFilterChange?.(newFilters);
      return newFilters;
    });
  }, [onFilterChange]);

  const updateFilters = useCallback((updates: Partial<T>) => {
    setFilters(prev => {
      const newFilters = { ...prev, ...updates };
      onFilterChange?.(newFilters);
      return newFilters;
    });
  }, [onFilterChange]);

  const clearFilters = useCallback(() => {
    const clearedFilters = initialFilters as T;
    setFilters(clearedFilters);
    onFilterChange?.(clearedFilters);
  }, [initialFilters, onFilterChange]);

  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (value === 'all' || value === '' || value === null || value === undefined) {
        return false;
      }
      return value !== (initialFilters as Record<string, unknown>)[key];
    }).length;
  }, [filters, initialFilters]);

  return {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    activeFiltersCount,
  };
};

export const useSearch = (
  onSearch: (query: string) => void,
  delay: number = 500
) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      onSearch(searchQuery);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, delay, onSearch]);

  return {
    searchQuery,
    debouncedQuery,
    setSearchQuery,
  };
};