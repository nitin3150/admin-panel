import { useEffect, useState } from "react";
import { wsService } from "@/services/websocket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Bell, Send, Trash2, Users, Filter, Radio } from "lucide-react";
import { format } from "date-fns";

interface Notification {
  id: string;
  user_id?: string;
  user_name: string;
  user_email: string;
  title: string;
  message: string;
  type: string;
  all_users: boolean;
  created_at: string;
  created_by: string;
  order_id?: string;
  recipient_count?: number;
}

interface NotificationStats {
  total: number;
  broadcast: number;
  single_user: number;
  unread: number;
  read: number;
  by_type: Record<string, number>;
}

export default function NotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);
  
  // Form states
  const [selectedUserId, setSelectedUserId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notificationType, setNotificationType] = useState("system");
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [audienceFilter, setAudienceFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadNotifications();
    loadStats();

    // Register WebSocket message handlers
    wsService.onMessage("notifications_data", (data) => {
      setNotifications(data.notifications || []);
      setLoading(false);
    });

    wsService.onMessage("notification_stats", (data) => {
      setStats(data.stats);
    });

    wsService.onMessage("notification_sent", (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      setSendDialogOpen(false);
      resetForm();
      loadNotifications();
      loadStats();
    });

    wsService.onMessage("notification_broadcast_sent", (data) => {
      toast({
        title: "Broadcast Sent ✅",
        description: data.message,
      });
      setBroadcastDialogOpen(false);
      resetForm();
      loadNotifications();
      loadStats();
    });

    wsService.onMessage("notification_deleted", (data) => {
      toast({
        title: "Deleted",
        description: data.message,
      });
      loadNotifications();
      loadStats();
    });

    wsService.onMessage("error", (data) => {
      // silently ignore
    });
  }, []);

  const loadNotifications = () => {
    setLoading(true);
    const filters: any = {};
    
    if (typeFilter !== "all") {
      filters.type = typeFilter;
    }
    
    if (audienceFilter === "broadcast") {
      filters.all_users = true;
    } else if (audienceFilter === "individual") {
      filters.all_users = false;
    }

    wsService.send({
      type: "get_notifications",
      filters,
    });
  };

  const loadStats = () => {
    wsService.send({
      type: "get_notification_stats",
    });
  };

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setNotificationType("system");
    setSelectedUserId("");
  };

  const handleSendToUser = () => {
    if (!selectedUserId || !title || !message) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    wsService.send({
      type: "send_notification_to_user",
      data: {
        user_id: selectedUserId,
        title,
        message,
        type: notificationType,
      },
    });
  };

  const handleBroadcast = () => {
    if (!title || !message) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    wsService.send({
      type: "send_notification_to_all",
      data: {
        title,
        message,
        type: notificationType,
        user_filter: {
          active_only: true,
        },
      },
    });
  };

  const handleDelete = (notification: Notification) => {
    const confirmMessage = notification.all_users
      ? `This will delete the broadcast notification sent to ${notification.recipient_count || 'all'} users. Are you sure?`
      : `Delete notification sent to ${notification.user_name}?`;
    
    if (confirm(confirmMessage)) {
      wsService.send({
        type: "delete_notification",
        data: {
          notification_id: notification.id,
        },
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "order":
        return "bg-blue-500";
      case "promotion":
        return "bg-green-500";
      case "system":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        notif.title.toLowerCase().includes(query) ||
        notif.message.toLowerCase().includes(query) ||
        notif.user_name.toLowerCase().includes(query) ||
        notif.created_by.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notifications Management</h1>
          <p className="text-muted-foreground">
            Send and manage user notifications (Admin only)
          </p>
        </div>
        <div className="flex gap-2">
          {/* <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Send className="mr-2 h-4 w-4" />
                Send to User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Notification to User</DialogTitle>
                <DialogDescription>
                  Send a notification to a specific user
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">User ID</label>
                  <Input
                    placeholder="Enter user ID (MongoDB ObjectId)"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Find user ID from the Users page
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Notification title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    placeholder="Notification message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select value={notificationType} onValueChange={setNotificationType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="order">Order</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendToUser}>Send</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog> */}

          <Dialog open={broadcastDialogOpen} onOpenChange={setBroadcastDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary">
                <Radio className="mr-2 h-4 w-4" />
                Broadcast to All
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Broadcast Notification</DialogTitle>
                <DialogDescription>
                  Send a notification to all active users. This will create individual notifications for each user.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Notification title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    placeholder="Notification message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select value={notificationType} onValueChange={setNotificationType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="order">Order</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    💡 This will send the notification to all active customers in the system.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBroadcastDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBroadcast}>Broadcast Now</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                All notifications created
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Broadcast</CardTitle>
              <Radio className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.broadcast}</div>
              <p className="text-xs text-muted-foreground">
                Sent to all users
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Individual</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.single_user}</div>
              <p className="text-xs text-muted-foreground">
                Sent to specific users
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <Bell className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unread}</div>
              <p className="text-xs text-muted-foreground">
                Not yet opened
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Read</CardTitle>
              <Bell className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.read}</div>
              <p className="text-xs text-muted-foreground">
                Opened by users
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by title, message, admin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={audienceFilter} onValueChange={setAudienceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Audiences</SelectItem>
                <SelectItem value="broadcast">Broadcast Only</SelectItem>
                <SelectItem value="individual">Individual Only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="order">Order</SelectItem>
                <SelectItem value="promotion">Promotion</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadNotifications}>
              <Filter className="mr-2 h-4 w-4" />
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Notifications</CardTitle>
          <CardDescription>
            View and manage all notifications created by admins
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading notifications...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications found</p>
              <p className="text-sm">Create your first notification using the buttons above</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Audience</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {notification.all_users ? (
                          <>
                            <Radio className="h-4 w-4 text-blue-500" />
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                <span>All Users</span>
                                <Badge variant="secondary" className="text-xs">
                                  Broadcast
                                </Badge>
                              </div>
                              {notification.recipient_count && (
                                <div className="text-xs text-muted-foreground">
                                  {notification.recipient_count} recipients
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <Users className="h-4 w-4 text-gray-500" />
                            <div>
                              <div className="font-medium">{notification.user_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {notification.user_email}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium max-w-xs">
                      {notification.title}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="truncate" title={notification.message}>
                        {notification.message}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(notification.type)}>
                        {notification.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{notification.created_by}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(notification.created_at), "MMM dd, yyyy")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(notification.created_at), "HH:mm")}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(notification)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}