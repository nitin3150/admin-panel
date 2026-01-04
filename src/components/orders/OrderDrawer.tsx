import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Package,
  Printer,
  Truck,
  MapPin,
  FileText,
  User,
  Loader2,
} from "lucide-react";
import wsService from "@/services/websocket";
import { Order, OrderItem } from "@/types/order";

interface OrderDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string | null;
}

export const OrderDrawer = ({
  open,
  onOpenChange,
  orderId,
}: OrderDrawerProps) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !orderId) return;

    setLoading(true);
    setOrder(null);
    
    const handleOrderDetails = (data: any) => {
      setOrder(data.order);
      setLoading(false);
    };
    // console.log(order)
    wsService.onMessage("order_details", handleOrderDetails);

    wsService.send({
      type: "get_order_details",
      data: { order_id: orderId },
    });

    return () => {
      wsService.onMessage("order_details", () => {});
    };
  }, [open, orderId]);

  const formatCurrency = (v?: number) =>
    `₹${Number(v ?? 0).toFixed(2)}`;

  const formatDateTime = (date?: string) =>
    date ? new Date(date).toLocaleString() : "-";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:w-[650px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Order #{orderId}</SheetTitle>
          <SheetDescription>
            {order?.order_type?.toUpperCase()} ORDER
          </SheetDescription>
        </SheetHeader>

        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {!loading && order && (
          <div className="mt-6 space-y-6">

            {/* Status */}
            {order.status_history?.length > 0 && (
              <Card>
                {order.payment_method}
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Status History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {order.status_history.map((h: any, i: number) => (
                    <div key={i} className="flex justify-between items-center">
                      <StatusBadge status={h.status} />
                      <span className="text-sm text-muted-foreground">
                        {formatDateTime(h.changed_at)}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Items */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Order Items</CardTitle>
                <CardDescription>
                  {order.items.length} item(s)
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {order.items.map((item: OrderItem, idx: number) => {
                  if (item.type === "product") {
                    return (
                      <div key={idx} className="flex justify-between border p-3 rounded-lg">
                        <div className="flex gap-2 items-center">
                          <Package className="h-4 w-4" />
                          <div>
                            <p className="font-medium">
                              {item.product_name || item.product}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Qty: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold">
                          {formatCurrency(item.price! * item.quantity!)}
                        </p>
                      </div>
                    );
                  }

                  if (item.type === "printout") {
                    const s = item.service_data;
                    return (
                      <div key={idx} className="border p-3 rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <Printer className="h-4 w-4" />
                          <p className="font-medium">Printout</p>
                          <Badge>{s.paper_size}</Badge>
                        </div>
                        <p className="text-sm">
                          Copies: {s.copies} | Color: {s.color ? "Yes" : "No"}
                        </p>
                        <p className="font-semibold">
                          {formatCurrency(s.price)}
                        </p>
                        {s.file_urls?.map((url: string, i: number) => (
                          <a key={i} href={url} target="_blank" className="text-sm text-primary flex gap-2">
                            <FileText className="h-4 w-4" /> File {i + 1}
                          </a>
                        ))}
                      </div>
                    );
                  }

                  if (item.type === "porter") {
                    const s = item.service_data;
                    return (
                      <div key={idx} className="border p-3 rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          <p className="font-medium">Porter</p>
                        </div>
                        <p className="text-sm">
                          <MapPin className="inline h-3 w-3 mr-1" />
                          {s.pickup_address.street}, {s.pickup_address.city},{s.pickup_address.state}
                        </p>
                        <p className="text-sm">
                          <MapPin className="inline h-3 w-3 mr-1" />
                          {s.delivery_address.street}, {s.delivery_address.city}, {s.delivery_address.state}
                        </p>
                        <p className="font-semibold">
                          {formatCurrency(s.estimated_cost)}
                        </p>
                      </div>
                    );
                  }

                  return null;
                })}

                <Separator />

                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Customer */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Customer</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2 items-center">
                <User className="h-4 w-4" />
                <span>{order.customer.name}</span>
              </CardContent>
              <CardContent className="flex gap-2 items-center">
                <span>{order.customer.email}</span>
              </CardContent>
              <CardContent className="flex gap-2 items-center">
                <span>{order.customer.phone}</span>
              </CardContent>
            </Card>

            {/* Delivery */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Delivery Address</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {order.delivery_address.street}, {order.delivery_address.city},{" "}
                {order.delivery_address.state} - {order.delivery_address.pincode}
                <br />
                Phone: {order.delivery_address.phone}
              </CardContent>
            </Card>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
