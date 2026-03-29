import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UsersTable } from "@/components/users/UsersTable";
import { wsService } from "@/services/websocket";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/types/user";
import { WsUsersData, WsErrorData } from "@/types/websocket";
import { Search, Shield, User as UserIcon, Truck, Store } from "lucide-react";

const roleIcons = { admin: Shield, customer: UserIcon, delivery_partner: Truck, vendor: Store };

export default function Users() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingUserIds, setLoadingUserIds] = useState<Set<string>>(new Set());

  const roleOptions = [
    { value: "all", label: "All Roles" },
    { value: "admin", label: "Admin" },
    { value: "customer", label: "Customer" },
    { value: "delivery_partner", label: "Delivery Partner" },
    { value: "vendor", label: "Vendor" },
  ];

  useEffect(() => {
    const handleUsersData = (data: WsUsersData) => {
      setUsers(data.users || []);
      setIsLoading(false);
    };

    const handleUserUpdated = () => {
      wsService.send({ type: 'get_users', filters: {} });
      setLoadingUserIds(new Set());
      toast({ title: "User Updated" });
    };

    const handleError = (data: WsErrorData) => {
      setIsLoading(false);
      setLoadingUserIds(new Set());
      if (!data.message?.includes('Unknown message type') && !data.message?.includes('not implemented')) {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    };

    const cleanups = [
      wsService.onMessage("users_data", handleUsersData),
      wsService.onMessage("user_updated", handleUserUpdated),
      wsService.onMessage("user_status_updated", handleUserUpdated),
      wsService.onMessage("error", handleError),
    ];

    wsService.send({ type: 'get_users', filters: {} });

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [toast]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    setLoadingUserIds(prev => new Set(prev).add(userId));
    wsService.send({ type: 'update_user_role', data: { user_id: userId, role: newRole } });
  };

  const handleStatusToggle = (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    setLoadingUserIds(prev => new Set(prev).add(userId));
    wsService.send({ type: 'update_user_status', data: { user_id: userId, status: newStatus } });
  };

  const getRoleStats = () => {
    const stats = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { role: 'admin', count: stats.admin || 0, label: 'Admins', icon: Shield },
      { role: 'customer', count: stats.customer || 0, label: 'Customers', icon: UserIcon },
      { role: 'delivery_partner', count: stats.delivery_partner || 0, label: 'Delivery Partners', icon: Truck },
      { role: 'vendor', count: stats.vendor || 0, label: 'Vendors', icon: Store },
    ];
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage user accounts</p>
      </div>

      {/* Role Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {getRoleStats().map((stat) => (
          <Card key={stat.role}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>{filteredUsers.length} users found</CardDescription>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <UsersTable
            users={filteredUsers}
            isLoading={isLoading}
            loadingUserIds={loadingUserIds}
            onRoleChange={handleRoleChange}
            onStatusToggle={handleStatusToggle}
          />
        </CardContent>
      </Card>
    </div>
  );
}