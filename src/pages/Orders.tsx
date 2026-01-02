import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { OrderDrawer } from "@/components/orders/OrderDrawer";
import { AssignPartnerModal } from "@/components/orders/AssignPartnerModal";
import { wsService } from "@/services/websocket";
import { useToast } from "@/hooks/use-toast";
import { exportOrders } from "@/utils/csvExport";
import { Order, PaginationInfo } from "@/types/order";
import { 
  Search, 
  Download, 
  Loader2, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface DeliveryPartner {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export default function Orders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDrawer, setShowOrderDrawer] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [deliveryRequests, setDeliveryRequests] = useState<DeliveryPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    has_next: false,
    has_prev: false,
  });

  const statusOptions = [
    { value: "all", label: "All Orders" },
    { value: "preparing", label: "Preparing" },
    { value: "assigning", label: "Assigning" },
    { value: "assigned", label: "Assigned" },
    { value: "out_for_delivery", label: "Out for Delivery" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const loadOrders = useCallback((page = 1) => {
    setIsLoading(true);
    const filters: any = { page, limit: pageSize };
    if (searchQuery.trim()) filters.search = searchQuery.trim();
    if (statusFilter !== 'all') filters.status = statusFilter;
    wsService.send({ type: 'get_orders', filters });
  }, [pageSize, searchQuery, statusFilter]);

  useEffect(() => {
    const handleOrdersData = (data: any) => {
      setOrders(data.orders || []);
      if (data.pagination) {
        setPagination({
          current_page: data.pagination.current_page || 1,
          total_pages: data.pagination.total_pages || 1,
          total_items: data.pagination.total_orders || data.pagination.total_items || 0,
          has_next: data.pagination.has_next || false,
          has_prev: data.pagination.has_prev || false,
        });
      }
      setIsLoading(false);
    };

    const handleDeliveryRequestsData = (data: any) => {
      setDeliveryRequests(data.delivery_requests || []);
    };

    const handleOrderUpdated = () => {
      setIsUpdating(false);
      loadOrders(pagination.current_page);
      toast({ title: "Order Updated" });
    };

    const handleOrderAssigned = () => {
      setIsUpdating(false);
      setShowAssignModal(false);
      loadOrders(pagination.current_page);
      toast({ title: "Order Assigned" });
    };

    const handleError = (data: any) => {
      setIsLoading(false);
      setIsUpdating(false);
      if (!data.message?.includes('Unknown message type')) {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    };

    wsService.onMessage("orders_data", handleOrdersData);
    wsService.onMessage("delivery_requests_data", handleDeliveryRequestsData);
    wsService.onMessage("order_updated", handleOrderUpdated);
    wsService.onMessage("order_assigned", handleOrderAssigned);
    wsService.onMessage("error", handleError);

    loadOrders();

    return () => {
      wsService.onMessage("orders_data", () => {});
      wsService.onMessage("delivery_requests_data", () => {});
      wsService.onMessage("order_updated", () => {});
      wsService.onMessage("order_assigned", () => {});
      wsService.onMessage("error", () => {});
    };
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => loadOrders(1), 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    loadOrders(1);
  }, [statusFilter, pageSize]);

  const handleDownloadCSV = () => {
    if (orders.length === 0) {
      toast({ title: "No Data", variant: "destructive" });
      return;
    }
    
    setIsDownloading(true);
    try {
      exportOrders(orders);
      toast({ title: "Downloaded", description: `${orders.length} orders` });
    } catch (error) {
      toast({ title: "Download Failed", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setIsUpdating(true);
    wsService.send({ type: 'update_order_status', data: { order_id: orderId, status: newStatus } });
  };

  const handleAssignPartner = (order: Order) => {
    setSelectedOrder(order);
    setDeliveryRequests([]);
    wsService.send({ type: 'get_delivery_requests_for_order', data: { order_id: order.id } });
    setShowAssignModal(true);
  };

  const handleAssign = (partnerId: string) => {
    setIsUpdating(true);
    wsService.send({
      type: 'assign_delivery_partner',
      data: { order_id: selectedOrder?.id, delivery_partner_id: partnerId }
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Manage customer orders</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Management</CardTitle>
          <CardDescription>{pagination.total_items} total orders</CardDescription>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(parseInt(v))}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={handleDownloadCSV} disabled={isDownloading}>
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </Button>

              <Button variant="outline" size="sm" onClick={() => loadOrders(pagination.current_page)}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <OrdersTable
            orders={orders}
            isLoading={isLoading}
            isUpdating={isUpdating}
            onViewOrder={(order) => {
              setSelectedOrder(order);
              setShowOrderDrawer(true);
            }}
            onViewDetails={(order) => {
              setSelectedOrder(order);
              setShowOrderDrawer(true);
            }}
            onStatusChange={handleStatusChange}
            onAssignPartner={handleAssignPartner}
          />

          {pagination.total_items > 0 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Page {pagination.current_page} of {pagination.total_pages} ({pagination.total_items} total)
              </p>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => loadOrders(1)} disabled={!pagination.has_prev}>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => loadOrders(pagination.current_page - 1)} disabled={!pagination.has_prev}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => loadOrders(pagination.current_page + 1)} disabled={!pagination.has_next}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => loadOrders(pagination.total_pages)} disabled={!pagination.has_next}>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <OrderDrawer
        open={showOrderDrawer}
        onOpenChange={setShowOrderDrawer}
        orderId={selectedOrder?.id ?? null}
      />

      <AssignPartnerModal
        open={showAssignModal}
        onOpenChange={setShowAssignModal}
        order={selectedOrder}
        deliveryRequests={deliveryRequests}
        isUpdating={isUpdating}
        onAssign={handleAssign}
      />
    </div>
  );
}