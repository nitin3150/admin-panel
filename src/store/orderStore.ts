import { create } from 'zustand';
import type { Order } from '@/types/order';

interface OrderState {
  orders: Order[];
  recentOrders: Order[];
  setOrders: (orders: Order[]) => void;
  setRecentOrders: (orders: Order[]) => void;
  updateOrderStatus: (orderId: string, status: string, deliveryPartner?: string) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  recentOrders: [],
  setOrders: (orders) => set({ orders }),
  setRecentOrders: (recentOrders) => set({ recentOrders }),
  updateOrderStatus: (orderId, status, deliveryPartner) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, status: status as Order['status'], delivery_partner_name: deliveryPartner } : o
      ),
    })),
}));
