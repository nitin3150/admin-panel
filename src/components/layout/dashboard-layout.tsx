import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { useEffect } from "react";
import { wsService } from "@/services/websocket";
import { useConnectionStore } from "@/store/connectionStore";
import { useStatsStore } from "@/store/statsStore";
import { useProductStore } from "@/store/productStore";
import { useOrderStore } from "@/store/orderStore";
import { useUserStore } from "@/store/userStore";
import { useCategoryStore } from "@/store/categoryStore";
import { usePricingStore } from "@/store/pricingStore";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import type { WsAnalyticsData, WsProductsData, WsOrdersData, WsUsersData, WsCategoriesData, WsErrorData, PricingConfig } from "@/types/websocket";
import type { Product } from "@/types/product";

export function DashboardLayout() {
  const { toast } = useToast();
  const { setConnected, setWebSocket } = useConnectionStore();
  const { setStats, setRevenueData } = useStatsStore();
  const { setProducts } = useProductStore();
  const { setOrders, setRecentOrders } = useOrderStore();
  const { setUsers } = useUserStore();
  const { setCategories } = useCategoryStore();
  const { setPricingConfig } = usePricingStore();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    wsService.connect()
      .then(() => {
        setConnected(true);
        setWebSocket(wsService.websocket);

        const token = sessionStorage.getItem('admin_token');
        if (token) {
          wsService.authenticateWithToken(token);
        }
      })
      .catch(() => {
        toast({
          title: "Connection Failed",
          description: "Could not connect to server",
          variant: "destructive",
        });
      });

    wsService.onConnection((connected) => {
      setConnected(connected);
      setWebSocket(connected ? wsService.websocket : null);

      if (connected && wsService.isAuth()) {
        toast({
          title: "Connected",
          description: "Successfully connected to server",
        });
        wsService.subscribe('dashboard');
        wsService.subscribe('products');
        wsService.subscribe('orders');
        wsService.subscribe('users');
      } else if (!connected) {
        toast({
          title: "Disconnected",
          description: "Connection to server lost",
          variant: "destructive",
        });
      }
    });

    const cleanups = [
      wsService.onMessage<WsAnalyticsData>('analytics_data', (data) => {
        setStats(data.stats);
        setRevenueData(data.revenueData || []);
      }),

      wsService.onMessage<WsProductsData>('products_initial', (data) => {
        setProducts((data.products || []) as Product[]);
      }),

      wsService.onMessage<WsProductsData>('product_created', (data) => {
        setProducts((data.products || []) as Product[]);
      }),

      wsService.onMessage<WsProductsData>('product_updated', (data) => {
        setProducts((data.products || []) as Product[]);
      }),

      wsService.onMessage<WsProductsData>('product_deleted', (data) => {
        setProducts((data.products || []) as Product[]);
      }),

      wsService.onMessage<WsOrdersData>('orders_data', (data) => {
        setOrders(data.orders || []);
        setRecentOrders((data.orders || []).slice(0, 5));
      }),

      wsService.onMessage<WsOrdersData & { orderId?: string; status?: string }>('order_status_changed', (data) => {
        setOrders(data.orders || []);
        toast({
          title: "Order Updated",
          description: `Order ${data.orderId} status changed to ${data.status}`,
        });
      }),

      wsService.onMessage<WsUsersData>('users_data', (data) => {
        setUsers(data.users || []);
      }),

      wsService.onMessage<WsCategoriesData>('categories_data', (data) => {
        setCategories(data.categories || []);
      }),

      wsService.onMessage<{ config: PricingConfig }>('pricing_config', (data) => {
        setPricingConfig(data.config);
      }),

      wsService.onMessage<WsErrorData>('error', (data) => {
        toast({
          title: "Error",
          description: data.message || "An error occurred",
          variant: "destructive",
        });
      }),

      wsService.onMessage('auth_success', () => {
        if (user) {
          wsService.send({ type: 'get_analytics' });
          wsService.send({ type: 'get_products' });
          wsService.send({ type: 'get_orders' });
          wsService.send({ type: 'get_users' });
          wsService.send({ type: 'get_pricing_config' });
          wsService.send({ type: 'get_categories' });
        }
      }),
    ];

    return () => {
      cleanups.forEach(cleanup => cleanup());
      wsService.disconnect();
      setWebSocket(null);
    };
  }, [isAuthenticated, user, toast, setConnected, setWebSocket, setStats, setRevenueData, setRecentOrders, setProducts, setOrders, setUsers, setPricingConfig, setCategories]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
