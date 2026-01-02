import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, User, Package, ExternalLink, CheckCircle, Loader2, Truck, Printer, Layers } from "lucide-react";
import { format, parseISO } from "date-fns";
import { OrderTypeBadge } from "@/components/ui/orderTypeBadge";

interface OrdersTableProps {
  orders: any[];
  isLoading: boolean;
  isUpdating: boolean;
  onViewOrder: (order: any) => void;
  onViewDetails: (order: any) => void;
  onStatusChange: (orderId: string, status: string) => void;
  onAssignPartner: (order: any) => void;
}

export const OrdersTable = ({
  orders,
  isLoading,
  isUpdating,
  onViewOrder,
  onViewDetails,
  onStatusChange,
  onAssignPartner,
}: OrdersTableProps) => {
  
  const OrderIcon = ({ type }: { type: string }) => {
    if (type === "product") return <Package className="h-4 w-4" />;
    if (type === "printout") return <Printer className="h-4 w-4" />;
    if (type === "porter") return <Truck className="h-4 w-4" />;
    return <Layers className="h-4 w-4" />;
  };

  const getStatusActions = (order: any) => {
    if (!order?.status) return null;
    
    switch (order.status) {
      case 'preparing':
        return (
          <Button
            size="sm"
            onClick={() => onStatusChange(order.id, 'assigning')}
            disabled={isUpdating}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Mark Ready
          </Button>
        );
      
      case 'assigning':
        // ✅ NEW: Show "Assign Partner" button when status is assigning
        return (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onAssignPartner(order)}
            disabled={isUpdating}
          >
            <User className="h-4 w-4 mr-1" />
            Assign Partner
          </Button>
        );
      
      case 'assigned':
        // ✅ NEW: Show "Start Delivery" button when partner is assigned
        return (
          <Button
            size="sm"
            onClick={() => onStatusChange(order.id, 'out_for_delivery')}
            disabled={isUpdating}
          >
            <Truck className="h-4 w-4 mr-1" />
            Start Delivery
          </Button>
        );
      
      case 'accepted':
        // Keep this for backward compatibility
        return (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onAssignPartner(order)}
            disabled={isUpdating}
          >
            <User className="h-4 w-4 mr-1" />
            Assign Partner
          </Button>
        );
      
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No orders found</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order ID</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Order Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Delivery Partner</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order._id || order.id}>
            <TableCell className="font-medium">
              <Button 
                variant="link" 
                className="p-0 h-auto text-blue-600 hover:text-blue-800"
                onClick={() => onViewDetails(order)}
              >
                #{order.id || 'N/A'}
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </TableCell>
            <TableCell>{order.user_name || 'Unknown'}</TableCell>
            <TableCell>₹{order.total || '0.00'}</TableCell>
            <TableCell className="flex items-center gap-2">
              <OrderIcon type={order.order_type} />
              <OrderTypeBadge type={order.order_type} />
            </TableCell>
            <TableCell><StatusBadge status={order.status || 'pending'} /></TableCell>
            <TableCell>
              {order.delivery_partner_name ? (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{order.delivery_partner_name}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">Not assigned</span>
              )}
            </TableCell>
            <TableCell>
              {order.created_at ? format(parseISO(order.created_at), "MMM dd, yyyy") : 'N/A'}
            </TableCell>
            <TableCell>
              {order.created_at ? format(parseISO(order.created_at), "HH:mm:ss") : 'N/A'}
            </TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={() => onViewOrder(order)} disabled={isUpdating}>
                  <Eye className="h-4 w-4" />
                </Button>
                {getStatusActions(order)}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};