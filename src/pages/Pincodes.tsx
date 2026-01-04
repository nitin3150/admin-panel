import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { wsService } from "@/services/websocket";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Ticket, Edit, Loader2 } from "lucide-react";

interface PincodeData {
  pincodeId?: string;
  pincode: string;
  city: string;
  state: string;
  status: boolean;
}

export default function PincodesPage() {
  const { toast } = useToast();
  const [pincodes, setPincodes] = useState<PincodeData[]>([]);
  const [editingPincode, setEditingPincode] = useState<PincodeData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<PincodeData>({
    pincode: "",
    city: "",
    state: "",
    status: true,
  });

  const statusOptions = [
    { value: "all", label: "All Pincodes" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  useEffect(() => {
    console.log("Pincode component mounted, requesting data...");
    
    // Request pincodes data
    wsService.send({ type: "get_pincodes" });

    // Register handlers and store cleanup functions
    const cleanupPincodesData = wsService.onMessage("pincodes_data", (message: any) => {
      console.log("Received pincodes data:", message);
      if (message.available_pincodes) {
        const mapped = message.available_pincodes.map((p: PincodeData) => ({
          ...p
        }));
        setPincodes(mapped);
        setIsLoading(false);
      }
    });

    const cleanupPincodeCreated = wsService.onMessage("pincode_created", (message: any) => {
      console.log("Pincode created:", message);
      // Backend sends { type: "pincode_created", data: {...} }
      const data = message.data || message;
      const newPincode = { 
        ...data,
        pincodeId: data.pincodeId || data._id,
        _id: data.pincodeId || data._id
      };
      
      setPincodes((prevPincodes) => [...prevPincodes, newPincode]);
      
      setIsSaving(false);
      toast({
        title: "Pincode Created",
        description: "New pincode has been added successfully",
      });
    });

    const cleanupPincodeUpdated = wsService.onMessage("pincode_updated", (message: any) => {
      console.log("Pincode updated:", message);
      // Backend sends { type: "pincode_updated", data: {...} }
      // But wsService strips 'type' and passes the rest
      const data = message.data || message;
      const updatedPincode = { 
        ...data,
        pincodeId: data.pincodeId,
      };
      
      setPincodes((prevPincodes) =>
        prevPincodes.map((p) =>
          (p.pincodeId === updatedPincode.pincodeId) 
            ? updatedPincode 
            : p
        )
      );
      
      setIsSaving(false);
      toast({
        title: "Pincode Updated",
        description: "Pincode has been updated successfully",
      });
    });

    const cleanupError = wsService.onMessage("error", (data: any) => {
      console.error("WebSocket error:", data);
      setIsLoading(false);
      setIsSaving(false);
      toast({
        title: "Error",
        description: data.message || "An error occurred",
        variant: "destructive",
      });
    });

    // Cleanup all handlers when component unmounts
    return () => {
      console.log("Cleaning up WebSocket handlers");
      cleanupPincodesData();
      cleanupPincodeCreated();
      cleanupPincodeUpdated();
      cleanupError();
    };
  }, [toast]);

  const filteredPincodes = pincodes.filter((p) => {
    const searchTerm = searchQuery.toLowerCase();
    const matchesSearch =
      (p.pincode || "").toLowerCase().includes(searchTerm) ||
      (p.city || "").toLowerCase().includes(searchTerm) ||
      (p.state || "").toLowerCase().includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && p.status) ||
      (statusFilter === "inactive" && !p.status);

    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const pincodeData = {
      pincode: formData.pincode,
      city: formData.city,
      state: formData.state,
      status: formData.status,
    };

    setIsSaving(true);

    if (editingPincode) {
      wsService.send({
        type: "update_pincodes",
        data: { _id: editingPincode.pincodeId, ...pincodeData },
      });
      toast({ title: "Updating Data", description: "Please wait..." });
    } else {
      wsService.send({
        type: "add_pincode",
        data: pincodeData,
      });
      toast({ title: "Creating New Pincode", description: "Please wait..." });
    }

    resetForm();
  };

  const handleEdit = (data: PincodeData) => {
    console.log("Edit clicked for:", data);
    
    // Set the form data first
    const newFormData = {
      pincode: data.pincode,
      city: data.city,
      state: data.state,
      status: data.status,
    };
    
    setFormData(newFormData);
    setEditingPincode(data);
    
    // Use setTimeout to ensure state updates before modal opens
    setTimeout(() => {
      setShowAddModal(true);
    }, 0);
  };

  const handleToggleStatus = (pincode: PincodeData) => {
    setIsSaving(true);
    
    wsService.send({
      type: "update_pincodes",
      data: { 
        id: pincode.pincodeId,
        pincode: pincode.pincode,
        city: pincode.city,
        state: pincode.state,
        status: !pincode.status 
      },
    });

    toast({
      title: pincode.status ? "Deactivating Pincode" : "Activating Pincode",
      description: "Please wait...",
    });
  };

  const resetForm = () => {
    setEditingPincode(null);
    setFormData({ pincode: "", city: "", state: "", status: true });
    setShowAddModal(false);
  };

  const handleModalClose = (open: boolean) => {
    setShowAddModal(open);
    if (!open) {
      resetForm();
    }
  };

  const handleAddNewClick = () => {
    setEditingPincode(null);
    setFormData({ pincode: "", city: "", state: "", status: true });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Ticket className="h-8 w-8" />
            Pincodes
          </h1>
          <p className="text-muted-foreground">Add and manage Pincodes</p>
        </div>

        <Dialog open={showAddModal} onOpenChange={handleModalClose}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNewClick}>
              <Plus className="h-4 w-4 mr-2" />
              Add Pincode
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPincode ? "Edit Pincode" : "Add New Pincode"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pincode">PinCode</Label>
                  <Input
                    id="pincode"
                    value={formData.pincode}
                    onChange={(e) =>
                      setFormData((prev) => ({ 
                        ...prev, 
                        pincode: e.target.value.toUpperCase() 
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => 
                      setFormData((prev) => ({ 
                        ...prev, 
                        city: e.target.value 
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => 
                      setFormData((prev) => ({ 
                        ...prev, 
                        state: e.target.value 
                      }))
                    }
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="status">Status</Label>
                  <Switch
                    id="status"
                    checked={formData.status}
                    onCheckedChange={(checked) => 
                      setFormData((prev) => ({ 
                        ...prev, 
                        status: checked 
                      }))
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
                      {editingPincode ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>{editingPincode ? "Update Pincode" : "Create Pincode"}</>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pincode Management</CardTitle>
          <CardDescription>
            {isLoading ? "Loading..." : `${filteredPincodes.length} pincodes found`}
          </CardDescription>

          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1 flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Pincodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <Select 
              value={statusFilter} 
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
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
              <p className="text-muted-foreground">Loading Pincodes...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PinCode</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPincodes.map((p) => (
                  <TableRow key={p.pincodeId}>
                    <TableCell className="font-medium">{p.pincode}</TableCell>
                    <TableCell>{p.city}</TableCell>
                    <TableCell>{p.state}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={p.status ? "active" : "inactive"} />
                        <Switch
                          checked={p.status}
                          onCheckedChange={() => handleToggleStatus(p)}
                          disabled={isSaving}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEdit(p)} 
                        disabled={isSaving}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && filteredPincodes.length === 0 && (
            <div className="text-center py-8">
              <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No Pincodes found.</p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your search or filters"
                  : "Click 'Add Pincode' to create your first pincode"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}