import type { Product, Brand, Category } from './product';
import type { Order, PaginationInfo, OrderFilters } from './order';
import type { User, UserRole, UserStatus } from './user';

// ── Outgoing message types (client → server) ──────────────────────

export interface AuthenticateMessage {
  type: 'authenticate';
  payload: { email: string; password: string } | { token: string };
}

export interface SubscribeMessage {
  type: 'subscribe';
  channel: string;
}

export interface GetProductsMessage { type: 'get_products' }
export interface CreateProductMessage { type: 'create_product'; data: Partial<Product> }
export interface UpdateProductMessage { type: 'update_product'; data: Partial<Product> & { id: string } }
export interface DeleteProductMessage { type: 'delete_product'; product_id: string }

export interface GetOrdersMessage { type: 'get_orders'; filters?: OrderFilters }
export interface UpdateOrderStatusMessage { type: 'update_order_status'; order_id: string; status: string }
export interface AssignDeliveryPartnerMessage { type: 'assign_delivery_partner'; order_id: string; partner_id: string }
export interface GetDeliveryRequestsMessage { type: 'get_delivery_requests_for_order'; order_id: string }

export interface GetUsersMessage { type: 'get_users'; filters?: Record<string, string> }
export interface UpdateUserRoleMessage { type: 'update_user_role'; user_id: string; role: UserRole }
export interface UpdateUserStatusMessage { type: 'update_user_status'; user_id: string; status: UserStatus }

export interface GetBrandsMessage { type: 'get_brands' }
export interface CreateBrandMessage { type: 'create_brand'; data: Partial<Brand> }
export interface UpdateBrandMessage { type: 'update_brand'; data: Partial<Brand> & { id: string } }
export interface DeleteBrandMessage { type: 'delete_brand'; brand_id: string }

export interface GetCategoriesMessage { type: 'get_categories' }
export interface CreateCategoryMessage { type: 'create_category'; data: Partial<Category> }
export interface UpdateCategoryMessage { type: 'update_category'; data: Partial<Category> & { id: string } }
export interface DeleteCategoryMessage { type: 'delete_category'; category_id: string }

export interface GetPricingConfigMessage { type: 'get_pricing_config' }
export interface UpdatePricingConfigMessage { type: 'update_pricing_config'; config: PricingConfig }

export interface GetAnalyticsMessage { type: 'get_analytics'; filters?: Record<string, unknown> }

export interface GetDiscountCouponsMessage { type: 'get_discount_coupons' }
export interface CreateCouponMessage { type: 'create_coupon'; data: Record<string, unknown> }
export interface UpdateCouponMessage { type: 'update_coupon'; data: Record<string, unknown> }
export interface DeleteCouponMessage { type: 'delete_coupon'; coupon_id: string }

export interface GetHelpTicketsMessage { type: 'get_help_tickets'; filters: Record<string, string> }
export interface GetTicketStatsMessage { type: 'get_ticket_stats'; filters: Record<string, unknown> }
export interface GetTicketDetailMessage { type: 'get_ticket_detail'; ticket_id: string }
export interface RespondToTicketMessage { type: 'respond_to_ticket'; ticket_id: string; message: string }
export interface UpdateTicketStatusMessage { type: 'update_ticket_status'; ticket_id: string; status: string }

export interface GetUserSuggestionsMessage { type: 'get_user_suggestions' }
export interface UpdateSuggestionStatusMessage { type: 'update_suggestion_status'; suggestion_id: string; status: string }

export interface GetPorterRequestsMessage { type: 'get_porter_requests' }
export interface GetPorterStatsMessage { type: 'get_porter_stats' }
export interface UpdatePorterRequestStatusMessage { type: 'update_porter_request_status'; request_id: string; status: string }

export interface GetPincodesMessage { type: 'get_pincodes' }
export interface GetNotificationsMessage { type: 'get_notifications' }
export interface SendNotificationMessage { type: 'send_notification'; data: Record<string, unknown> }
export interface BroadcastNotificationMessage { type: 'broadcast_notification'; data: Record<string, unknown> }
export interface DeleteNotificationMessage { type: 'delete_notification'; notification_id: string }

export type WsOutgoingMessage =
  | AuthenticateMessage
  | SubscribeMessage
  | GetProductsMessage | CreateProductMessage | UpdateProductMessage | DeleteProductMessage
  | GetOrdersMessage | UpdateOrderStatusMessage | AssignDeliveryPartnerMessage | GetDeliveryRequestsMessage
  | GetUsersMessage | UpdateUserRoleMessage | UpdateUserStatusMessage
  | GetBrandsMessage | CreateBrandMessage | UpdateBrandMessage | DeleteBrandMessage
  | GetCategoriesMessage | CreateCategoryMessage | UpdateCategoryMessage | DeleteCategoryMessage
  | GetPricingConfigMessage | UpdatePricingConfigMessage
  | GetAnalyticsMessage
  | GetDiscountCouponsMessage | CreateCouponMessage | UpdateCouponMessage | DeleteCouponMessage
  | GetHelpTicketsMessage | GetTicketStatsMessage | GetTicketDetailMessage | RespondToTicketMessage | UpdateTicketStatusMessage
  | GetUserSuggestionsMessage | UpdateSuggestionStatusMessage
  | GetPorterRequestsMessage | GetPorterStatsMessage | UpdatePorterRequestStatusMessage
  | GetPincodesMessage
  | GetNotificationsMessage | SendNotificationMessage | BroadcastNotificationMessage | DeleteNotificationMessage;

// ── Incoming message types (server → client) ──────────────────────

export interface WsAuthSuccessData {
  user: { token: string; email: string; name: string; role: string };
}

export interface WsProductsData {
  products: Product[];
  categories?: Category[];
  brands?: Brand[];
}

export interface WsOrdersData {
  orders: Order[];
  pagination?: PaginationInfo;
}

export interface WsUsersData {
  users: User[];
}

export interface WsBrandsData {
  brands: Brand[];
}

export interface WsCategoriesData {
  categories: Category[];
}

export interface WsErrorData {
  message: string;
}

export interface WsAnalyticsData {
  stats: DashboardStats;
  revenueData?: RevenueData[];
}

export interface WsDeliveryRequestsData {
  requests: Array<{ id: string; partner_name: string; status: string }>;
}

export interface WsAuthSuccessLoginData {
  user: { token: string; email: string; name: string; role: string };
}

export interface WsHelpTicketsData {
  tickets: Array<Record<string, unknown>>;
}

export interface WsTicketStatsData {
  stats: {
    total_tickets: number;
    today_tickets: number;
    status_breakdown: {
      open: number;
      in_progress: number;
      resolved: number;
      closed: number;
    };
  };
}

export interface WsTicketDetailData {
  ticket: Record<string, unknown> | null;
}

export interface WsTicketUpdatedData {
  ticket_id: string;
}

export interface WsSuggestionsData {
  suggestions: Array<Record<string, unknown>>;
}

export interface WsPorterRequestsData {
  requests: Array<Record<string, unknown>>;
}

export interface WsPorterStatsData {
  stats: {
    total_requests: number;
    today_requests: number;
    urgent_requests: number;
    total_revenue: number;
    status_breakdown: {
      pending: number;
      assigned: number;
      in_transit: number;
      delivered: number;
      cancelled: number;
    };
  };
}

export interface WsDiscountCouponsData {
  data: Array<Record<string, unknown>>;
}

export interface WsPincodesData {
  available_pincodes: Array<Record<string, unknown>>;
}

export interface WsPricingConfigData {
  data: {
    delivery_fee?: {
      type: string;
      base_fee: number;
      per_km_rate: number;
      min_fee: number;
      max_fee: number;
      free_delivery_threshold: number;
    };
    appFee?: {
      type: string;
      value: number;
    };
    porterFee?: number;
    printoutFee?: {
      doc: {
        A4_black: number;
        A4_color: number;
        A3_black: number;
        A3_color: number;
        legal_black: number;
        legal_color: number;
      };
      photo: {
        passport: number;
        other: number;
      };
    };
  };
}

export interface WsDeliveryRequestsForOrderData {
  delivery_requests: Array<{ id: string; name: string; email: string; phone?: string }>;
}

// ── Shared domain types ────────────────────────────────────────────

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeOrders: number;
  activeUsers: number;
  totalProducts: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
}

export interface PricingConfig {
  deliveryFee: {
    type: 'fixed' | 'distance_based' | 'order_value_based';
    baseFee: number;
    perKmRate?: number;
    minFee?: number;
    maxFee?: number;
    freeDeliveryThreshold?: number;
  };
  appFee: {
    type: 'fixed' | 'percentage' | 'tiered';
    value: number;
    minFee?: number;
    maxFee?: number;
  };
}
