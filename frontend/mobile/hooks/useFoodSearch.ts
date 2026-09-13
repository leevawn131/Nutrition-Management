import { useState, useEffect, useCallback } from 'react';
import { foodService } from '@/services/food.service';
import { FoodItem } from '@/types/food.types';

export interface UseFoodSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  foods: FoodItem[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
  refresh: () => void;
}

export function useFoodSearch(initialCategory: string = ''): UseFoodSearchReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchFoods = useCallback(async (queryStr: string, categoryStr: string, pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await foodService.searchFoods(queryStr, categoryStr, pageNum, 20);
      setFoods(response.data || []);
      setPage(response.pagination.page);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Không thể tìm kiếm món ăn');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFoods(searchQuery, selectedCategory, 1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, fetchFoods]);

  const refresh = () => {
    fetchFoods(searchQuery, selectedCategory, page);
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    foods,
    loading,
    error,
    page,
    totalPages,
    total,
    refresh,
  };
}
