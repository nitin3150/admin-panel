import { create } from 'zustand';
import type { DashboardStats, RevenueData } from '@/types/websocket';

interface StatsState {
  stats: DashboardStats;
  revenueData: RevenueData[];
  setStats: (stats: DashboardStats) => void;
  setRevenueData: (data: RevenueData[]) => void;
}

const defaultStats: DashboardStats = {
  totalRevenue: 0,
  totalOrders: 0,
  activeOrders: 0,
  activeUsers: 0,
  totalProducts: 0,
};

export const useStatsStore = create<StatsState>((set) => ({
  stats: defaultStats,
  revenueData: [],
  setStats: (stats) => set({ stats: stats || defaultStats }),
  setRevenueData: (revenueData) => set({ revenueData }),
}));
