import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { wsService } from "@/services/websocket";
import { WsErrorData } from "@/types/websocket";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Warehouse as WarehouseIcon,
  Edit,
  Trash2,
  Loader2,
  MapPin,
  Copy,
} from "lucide-react";

interface WarehouseData {
  id?: string;
  name: string;
  address: string;
  city: string;
  state: string;
  latitude: string;
  longitude: string;
  status: boolean;
  created_at?: string;
}

export default function WarehousesPage() {
  const { toast } = useToast();
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [editingWarehouse, setEditingWarehouse] =
    useState<WarehouseData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<WarehouseData>({
    name: "",
    address: "",
    city: "",
    state: "",
    latitude: "",
    longitude: "",
    status: true,
  });

  useEffect(() => {
    wsService.send({ type: "get_warehouses" });

    const cleanupWarehousesData = wsService.onMessage<{
      warehouses?: WarehouseData[];
    }>("warehouses_data", (message) => {
      if (message.warehouses) {
        setWarehouses(message.warehouses);
        setIsLoading(false);
      }
    });

    const cleanupWarehouseCreated = wsService.onMessage(
      "warehouse_created",
      () => {
        setIsSaving(false);
        toast({
          title: "Warehouse Created",
          description: "New warehouse has been added successfully",
        });
      }
    );

    const cleanupWarehouseUpdated = wsService.onMessage(
      "warehouse_updated",
      () => {
        setIsSaving(false);
        toast({
          title: "Warehouse Updated",
          description: "Warehouse has been updated successfully",
        });
      }
    );

    const cleanupWarehouseDeleted = wsService.onMessage(
      "warehouse_deleted",
      () => {
        setIsSaving(false);
        toast({
          title: "Warehouse Deleted",
          description: "Warehouse has been deleted successfully",
        });
      }
    );

    const cleanupError = wsService.onMessage<WsErrorData>("error", (data) => {
      setIsLoading(false);
      setIsSaving(false);
      toast({
        title: "Error",
        description: data.message || "An error occurred",
        variant: "destructive",
      });
    });

    return () => {
      cleanupWarehousesData();
      cleanupWarehouseCreated();
      cleanupWarehouseUpdated();
      cleanupWarehouseDeleted();
      cleanupError();
    };
  }, [toast]);

  const filteredWarehouses = warehouses.filter((w) => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      (w.name || "").toLowerCase().includes(searchTerm) ||
      (w.id || "").toLowerCase().includes(searchTerm) ||
      (w.address || "").toLowerCase().includes(searchTerm) ||
      (w.city || "").toLowerCase().includes(searchTerm) ||
      (w.state || "").toLowerCase().includes(searchTerm)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setIsSaving(true);

    if (editingWarehouse) {
      wsService.send({
        type: "update_warehouse",
        data: {
          id: editingWarehouse.id,
          name: formData.name,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          latitude: formData.latitude,
          longitude: formData.longitude,
          status: formData.status,
        },
      });
    } else {
      wsService.send({
        type: "create_warehouse",
        data: {
          name: formData.name,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          latitude: formData.latitude,
          longitude: formData.longitude,
          status: formData.status,
        },
      });
    }

    resetForm();
  };

  const handleEdit = (warehouse: WarehouseData) => {
    setFormData({
      name: warehouse.name,
      address: warehouse.address,
      city: warehouse.city,
      state: warehouse.state,
      latitude: warehouse.latitude?.toString() || "",
      longitude: warehouse.longitude?.toString() || "",
      status: warehouse.status,
    });
    setEditingWarehouse(warehouse);
    setTimeout(() => setShowAddModal(true), 0);
  };

  const handleDelete = (warehouse: WarehouseData) => {
    if (
      confirm(
        `Are you sure you want to delete warehouse "${warehouse.name}"? This cannot be undone.`
      )
    ) {
      setIsSaving(true);
      wsService.send({
        type: "delete_warehouse",
        data: { id: warehouse.id },
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${text} copied to clipboard` });
  };

  const resetForm = () => {
    setEditingWarehouse(null);
    setFormData({
      name: "",
      address: "",
      city: "",
      state: "",
      latitude: "",
      longitude: "",
      status: true,
    });
    setShowAddModal(false);
  };

  const handleModalClose = (open: boolean) => {
    setShowAddModal(open);
    if (!open) resetForm();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <WarehouseIcon className="h-8 w-8" />
            Warehouses
          </h1>
          <p className="text-muted-foreground">
            Manage pickup locations for products
          </p>
        </div>

        <Dialog open={showAddModal} onOpenChange={handleModalClose}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingWarehouse(null);
                setFormData({
                  name: "",
                  address: "",
                  city: "",
                  state: "",
                  latitude: "",
                  longitude: "",
                  status: true,
                });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Warehouse
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingWarehouse ? "Edit Warehouse" : "Add New Warehouse"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Warehouse Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Main Street Warehouse"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    placeholder="Full street address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="City name"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        city: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    placeholder="State name"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        state: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="e.g. 30.3752"
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        latitude: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="e.g. 75.5685"
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        longitude: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Label htmlFor="status">Status</Label>
                  <Switch
                    id="status"
                    checked={formData.status}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, status: checked }))
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.status ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleModalClose(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingWarehouse ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      {editingWarehouse
                        ? "Update Warehouse"
                        : "Create Warehouse"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Warehouse Management</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading..."
              : `${filteredWarehouses.length} warehouse(s) found`}
          </CardDescription>

          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1 flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search warehouses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading warehouses...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWarehouses.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {w.id}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(w.id || "")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{w.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {w.address}
                    </TableCell>
                    <TableCell>{w.city}</TableCell>
                    <TableCell>{w.state}</TableCell>
                    <TableCell>
                      {w.latitude && w.longitude ? (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {Number(w.latitude).toFixed(4)},{" "}
                          {Number(w.longitude).toFixed(4)}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Not set
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={w.status ? "active" : "inactive"}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(w)}
                          disabled={isSaving}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(w)}
                          disabled={isSaving}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && filteredWarehouses.length === 0 && (
            <div className="text-center py-8">
              <WarehouseIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No warehouses found.</p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Click 'Add Warehouse' to create your first warehouse"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
