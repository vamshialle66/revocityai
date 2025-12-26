import { useState, useEffect } from "react";
import { Users, UserPlus, Shield, Trash2, RefreshCw, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface UserWithRole {
  id: string;
  firebase_uid: string;
  email: string | null;
  display_name: string | null;
  last_login: string;
  created_at: string;
  role: "admin" | "user" | null;
  role_id: string | null;
  role_created_at: string | null;
}

const UserRoleManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "user">("user");
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const apiCall = async (action: string, params: Record<string, string> = {}) => {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-roles`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          adminFirebaseUid: user?.uid,
          ...params,
        }),
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "API call failed");
    }

    return response.json();
  };

  const loadUsers = async () => {
    try {
      const data = await apiCall("list");
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadUsers();
      setLoading(false);
    };
    init();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
    toast.success("Users refreshed");
  };

  const handleAddUser = async () => {
    if (!newUserId.trim()) {
      toast.error("Please enter a user ID");
      return;
    }

    setAdding(true);
    try {
      await apiCall("add", { targetUserId: newUserId.trim(), role: newRole });
      toast.success(`User added with ${newRole} role`);
      setNewUserId("");
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add user");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await apiCall("remove", { targetUserId: userId });
      toast.success("User role removed");
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove user");
    }
  };

  const handleChangeRole = async (userId: string, role: "admin" | "user") => {
    try {
      await apiCall("add", { targetUserId: userId, role });
      toast.success(`Role updated to ${role}`);
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  };

  const getTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return "";
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Card className="glass-card border-border/50 animate-fade-in">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              User Role Management
            </CardTitle>
            <CardDescription>
              Manage user access and permissions
            </CardDescription>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add User Form - Manual entry for users not in system */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {showAddForm ? "Hide Manual Add" : "Add User Manually"}
          </Button>
          <span className="text-xs text-muted-foreground">
            (For users not yet logged in)
          </span>
        </div>

        {showAddForm && (
          <div className="flex flex-col md:flex-row gap-3 p-4 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex-1">
              <Input
                placeholder="Enter Firebase User ID"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                className="bg-background"
              />
            </div>
            <Select value={newRole} onValueChange={(v) => setNewRole(v as "admin" | "user")}>
              <SelectTrigger className="w-full md:w-32 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddUser} disabled={adding}>
              <UserPlus className="w-4 h-4 mr-2" />
              {adding ? "Adding..." : "Add"}
            </Button>
          </div>
        )}

        {/* Users Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No users with assigned roles</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((userRecord) => (
                  <TableRow key={userRecord.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {userRecord.email ? (
                            <span className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="font-medium">{userRecord.email}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">No email</span>
                          )}
                          {userRecord.firebase_uid === user?.uid && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                          {userRecord.firebase_uid}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={userRecord.role || "none"}
                        onValueChange={(v) => {
                          if (v === "none") {
                            handleRemoveUser(userRecord.firebase_uid);
                          } else {
                            handleChangeRole(userRecord.firebase_uid, v as "admin" | "user");
                          }
                        }}
                        disabled={userRecord.firebase_uid === user?.uid}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue placeholder="No role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            <span className="text-muted-foreground">No role</span>
                          </SelectItem>
                          <SelectItem value="user">
                            <span className="flex items-center gap-2">
                              <Users className="w-3 h-3" /> User
                            </span>
                          </SelectItem>
                          <SelectItem value="admin">
                            <span className="flex items-center gap-2">
                              <Shield className="w-3 h-3" /> Admin
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-sm">{getTimeAgo(userRecord.last_login)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {userRecord.role && userRecord.firebase_uid !== user?.uid && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove User Role?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove all roles from {userRecord.email || "this user"}. They will lose access to protected features.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveUser(userRecord.firebase_uid)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserRoleManagement;
