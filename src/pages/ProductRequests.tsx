import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { wsService } from "@/services/websocket";
import { WsErrorData } from "@/types/websocket";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Bike, 
  MapPin, 
  Package, 
  User,
  Phone,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Navigation,
  Ruler
} from "lucide-react";
import { format } from "date-fns";

interface PorterRequest {
  _id: string;
  id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  pickup_address: {
    address: string;
    city: string;
    pincode: string;
  };
  delivery_address: {
    address: string;
    city: string;
    pincode: string;
  };
  phone: string;
  description: string;
  estimated_distance: number | null;
  package_size: string;
  urgent: boolean;
  status: string;
  assigned_partner_name: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface PorterStats {
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
}

export default function PorterRequests() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<PorterRequest[]>([]);
  const [stats, setStats] = useState<PorterStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [packageFilter, setPackageFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<PorterRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "assigned", label: "Assigned" },
    { value: "in_transit", label: "In Transit" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const packageOptions = [
    { value: "all", label: "All Sizes" },
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" },
  ];

  const statusColors = {
    pending: "default",
    assigned: "default",
    in_transit: "default",
    delivered: "secondary",
    cancelled: "destructive"
  } as const;

  useEffect(() => {
    wsService.send({
      type: 'get_porter_requests',
      filters: {}
    });

    wsService.send({
      type: 'get_porter_stats',
      filters: {}
    });

    const handleRequestsData = (data: { requests: PorterRequest[] }) => {
      setRequests(data.requests || []);
      setIsLoading(false);
    };

    const handleStatsData = (data: { stats: PorterStats }) => {
      setStats(data.stats);
    };

    const handleRequestUpdated = (_data: Record<string, unknown>) => {
      wsService.send({ type: 'get_porter_requests', filters: {} });
      wsService.send({ type: 'get_porter_stats', filters: {} });
      setIsUpdating(false);
      setShowDetailsModal(false);
      toast({
        title: "Request Updated",
        description: "Porter request has been updated successfully",
      });
    };

    const handleError = (data: WsErrorData) => {
      setIsLoading(false);
      setIsUpdating(false);

      if (!data.message?.includes('Unknown message type')) {
        toast({
          title: "Error",
          description: data.message || "An error occurred",
          variant: "destructive",
        });
      }
    };

    const cleanups = [
      wsService.onMessage("porter_requests_data", handleRequestsData),
      wsService.onMessage("porter_stats_data", handleStatsData),
      wsService.onMessage("porter_request_updated", handleRequestUpdated),
      wsService.onMessage("error", handleError),
    ];

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [toast]);

  const filteredRequests = requests.filter(request => {
    const searchTerm = searchQuery.toLowerCase();
    const matchesSearch = (request.user_name || '').toLowerCase().includes(searchTerm) ||
                         (request.description || '').toLowerCase().includes(searchTerm) ||
                         (request.phone || '').toLowerCase().includes(searchTerm);
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesPackage = packageFilter === "all" || request.package_size === packageFilter;
    return matchesSearch && matchesStatus && matchesPackage;
  });

  const handleStatusUpdate = (requestId: string) => {
    if (!selectedStatus) {
      toast({
        title: "Error",
        description: "Please select a status",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);

    wsService.send({
      type: 'update_porter_request_status',
      data: {
        request_id: requestId,
        status: selectedStatus,
        estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
        admin_notes: adminNotes.trim() || null,
      }
    });

    toast({
      title: "Updating Request",
      description: `Updating porter request status to ${selectedStatus}...`,
    });
  };

  const openDetailsModal = (request: PorterRequest) => {
    setSelectedRequest(request);
    setSelectedStatus(request.status || "");
    setEstimatedCost(request.estimated_cost?.toString() || "");
    setAdminNotes(request.admin_notes || "");
    setShowDetailsModal(true);
  };

  const getPackageSizeIcon = (size: string) => {
    switch (size) {
      case 'small':
        return '📦';
      case 'medium':
        return '📦📦';
      case 'large':
        return '📦📦📦';
      default:
        return '📦';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bike className="h-8 w-8" />
          Porter Requests
        </h1>
        <p className="text-muted-foreground">Manage delivery porter service requests</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Bike className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_requests}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.status_breakdown.pending}
              </div>
              <p className="text-xs text-muted-foreground">Needs assignment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Transit</CardTitle>
              <Navigation className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.status_breakdown.in_transit}
              </div>
              <p className="text-xs text-muted-foreground">On the way</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.status_breakdown.delivered}
              </div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                ₹{stats.total_revenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">From deliveries</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Porter Requests</CardTitle>
          <CardDescription>
            {isLoading ? "Loading..." : `${filteredRequests.length} requests found`}
          </CardDescription>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
                disabled={isLoading}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter} disabled={isLoading}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={packageFilter} onValueChange={setPackageFilter} disabled={isLoading}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {packageOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading porter requests...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length > 0 ? filteredRequests.map((request) => (
                  <TableRow key={request._id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{request.user_name}</div>
                          <div className="text-xs text-muted-foreground">{request.phone}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs space-y-1">
                        <div className="flex items-start gap-1 text-xs">
                          <MapPin className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground truncate">
                            {request.pickup_address.city}
                          </span>
                        </div>
                        <div className="flex items-start gap-1 text-xs">
                          <MapPin className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground truncate">
                            {request.delivery_address.city}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{getPackageSizeIcon(request.package_size)}</span>
                        <span className="text-sm capitalize">{request.package_size}</span>
                        {request.urgent && (
                          <Badge variant="destructive" className="text-xs">
                            Urgent
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.estimated_distance ? (
                        <div className="flex items-center gap-1">
                          <Ruler className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{request.estimated_distance} km</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={request.status} />
                    </TableCell>
                    <TableCell>
                      {request.assigned_partner_name ? (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span className="text-sm">{request.assigned_partner_name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {request.created_at ? format(new Date(request.created_at), "MMM dd") : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDetailsModal(request)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Bike className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No porter requests found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Request Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Porter Request Details</DialogTitle>
            <DialogDescription>
              Review and manage delivery request
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="space-y-6">
                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Name</p>
                        <p className="text-sm text-muted-foreground">{selectedRequest.user_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{selectedRequest.user_email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Contact Phone</p>
                        <p className="text-sm text-muted-foreground font-mono">{selectedRequest.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Request Date</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedRequest.created_at ? format(new Date(selectedRequest.created_at), "MMM dd, yyyy HH:mm") : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Route */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-green-600" />
                        Pickup Location
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-sm font-medium">Address</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {selectedRequest.pickup_address.address}
                        </p>
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <p className="text-sm font-medium">City</p>
                          <p className="text-sm text-muted-foreground">{selectedRequest.pickup_address.city}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Pincode</p>
                          <p className="text-sm text-muted-foreground font-mono">{selectedRequest.pickup_address.pincode}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-red-600" />
                        Delivery Location
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-sm font-medium">Address</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {selectedRequest.delivery_address.address}
                        </p>
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <p className="text-sm font-medium">City</p>
                          <p className="text-sm text-muted-foreground">{selectedRequest.delivery_address.city}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Pincode</p>
                          <p className="text-sm text-muted-foreground font-mono">{selectedRequest.delivery_address.pincode}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Package Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Package Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Description</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedRequest.description}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium">Package Size</p>
                        <Badge variant="outline">
                          {getPackageSizeIcon(selectedRequest.package_size)} {selectedRequest.package_size}
                        </Badge>
                      </div>
                      {selectedRequest.estimated_distance && (
                        <div>
                          <p className="text-sm font-medium">Estimated Distance</p>
                          <p className="text-sm text-muted-foreground">{selectedRequest.estimated_distance} km</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">Priority</p>
                        {selectedRequest.urgent ? (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Urgent
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Normal</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Current Status & Partner */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Current Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-2">Status</p>
                        <StatusBadge status={selectedRequest.status} />
                      </div>
                      {selectedRequest.assigned_partner_name && (
                        <div>
                          <p className="text-sm font-medium mb-2">Assigned Partner</p>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="text-sm">{selectedRequest.assigned_partner_name}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Cost Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedRequest.estimated_cost && (
                        <div>
                          <p className="text-sm font-medium">Estimated Cost</p>
                          <p className="text-lg font-bold text-blue-600">₹{selectedRequest.estimated_cost}</p>
                        </div>
                      )}
                      {selectedRequest.actual_cost && (
                        <div>
                          <p className="text-sm font-medium">Actual Cost</p>
                          <p className="text-lg font-bold text-green-600">₹{selectedRequest.actual_cost}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Admin Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Update Request</CardTitle>
                    <CardDescription>Change status and add notes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-status">New Status</Label>
                        <Select 
                          value={selectedStatus}
                          onValueChange={setSelectedStatus}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.slice(1).map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="estimated-cost">Estimated Cost (₹)</Label>
                        <Input
                          id="estimated-cost"
                          type="number"
                          step="0.01"
                          placeholder="100.00"
                          value={estimatedCost}
                          onChange={(e) => setEstimatedCost(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin-notes">Admin Notes</Label>
                      <Textarea
                        id="admin-notes"
                        placeholder="Add notes about this request..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        className="flex-1"
                        onClick={() => handleStatusUpdate(selectedRequest._id || selectedRequest.id)}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Update Request
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="flex-1"
                        onClick={() => {
                          setSelectedStatus('cancelled');
                          setTimeout(() => handleStatusUpdate(selectedRequest._id || selectedRequest.id), 100);
                        }}
                        disabled={isUpdating}
                      >
                        Cancel Request
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Admin Notes History */}
                {selectedRequest.admin_notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Admin Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">{selectedRequest.admin_notes}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}