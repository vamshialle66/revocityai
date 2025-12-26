import { useState, useEffect, useCallback } from "react";
import { 
  BarChart3, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Trash2,
  RefreshCw,
  TrendingUp,
  Map,
  FileText,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserRoleManagement from "@/components/UserRoleManagement";
import ComplaintManagement from "@/components/ComplaintManagement";
import CityMap from "@/components/CityMap";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Complaint {
  id: string;
  complaint_id: string;
  latitude: number;
  longitude: number;
  status: string;
  priority: string;
  complaint_status: string;
  area_name: string | null;
  address: string | null;
  created_at: string;
  fill_level: number;
  reporter_email: string | null;
  ai_confidence: number | null;
}

// Analytics record derived from complaints
interface AnalyticsRecord {
  id: string;
  complaintId: string;
  status: 'empty' | 'half-filled' | 'overflowing';
  priority: 'low' | 'medium' | 'high' | 'critical';
  fillLevel: number;
  address: string;
  timestamp: Date;
  reporterEmail: string;
}

const AdminDashboard = () => {
  const [analyticsRecords, setAnalyticsRecords] = useState<AnalyticsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMapComplaint, setSelectedMapComplaint] = useState<Complaint | null>(null);

  const loadAnalyticsData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error loading complaints:", error);
        toast.error("Failed to load complaint records");
        return;
      }

      const records: AnalyticsRecord[] = (data || []).map((complaint) => ({
        id: complaint.id,
        complaintId: complaint.complaint_id,
        status: complaint.fill_level >= 75 ? 'overflowing' : 
                complaint.fill_level >= 25 ? 'half-filled' : 'empty' as const,
        priority: complaint.priority as 'low' | 'medium' | 'high' | 'critical',
        fillLevel: complaint.fill_level,
        address: complaint.address || complaint.area_name || 'Unknown location',
        timestamp: new Date(complaint.created_at || ''),
        reporterEmail: complaint.reporter_email || 'Unknown',
      }));

      setAnalyticsRecords(records);
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Failed to load analytics data");
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadAnalyticsData();
      setLoading(false);
    };
    init();
  }, [loadAnalyticsData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
    toast.success("Data refreshed");
  };

  // Calculate statistics from complaints
  const stats = {
    total: analyticsRecords.length,
    high: analyticsRecords.filter((a) => a.priority === "high" || a.priority === "critical").length,
    medium: analyticsRecords.filter((a) => a.priority === "medium").length,
    low: analyticsRecords.filter((a) => a.priority === "low").length,
  };

  const statCards = [
    {
      icon: BarChart3,
      label: "Total Records",
      value: stats.total,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: AlertTriangle,
      label: "High Priority",
      value: stats.high,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      icon: TrendingUp,
      label: "Medium Priority",
      value: stats.medium,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      icon: CheckCircle2,
      label: "Low Priority",
      value: stats.low,
      color: "text-neon-green",
      bgColor: "bg-neon-green/10",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "overflowing":
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" /> Overflowing</Badge>;
      case "half-filled":
        return <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/30 gap-1"><Trash2 className="w-3 h-3" /> Half-Filled</Badge>;
      case "empty":
        return <Badge variant="secondary" className="bg-neon-green/20 text-neon-green border-neon-green/30 gap-1"><CheckCircle2 className="w-3 h-3" /> Empty</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">High</Badge>;
      case "medium":
        return <Badge className="bg-warning/20 text-warning border-warning/30">Medium</Badge>;
      case "low":
        return <Badge className="bg-neon-green/20 text-neon-green border-neon-green/30">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleMapComplaintSelect = (complaint: Complaint) => {
    setSelectedMapComplaint(complaint);
    toast.info(`Selected: ${complaint.complaint_id} - ${complaint.area_name || 'Unknown area'}`);
  };

  return (
    <div className="min-h-screen gradient-bg pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Municipality & Waste Management Overview
          </p>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="map" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="map" className="gap-2">
              <Map className="w-4 h-4" />
              <span className="hidden sm:inline">City Map</span>
            </TabsTrigger>
            <TabsTrigger value="complaints" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Complaints</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
          </TabsList>

          {/* City Map Tab */}
          <TabsContent value="map" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="w-5 h-5 text-primary" />
                  City Complaints Map
                </CardTitle>
                <CardDescription>
                  Real-time view of all complaint locations with priority indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CityMap onComplaintSelect={handleMapComplaintSelect} />
                
                {/* Selected complaint info */}
                {selectedMapComplaint && (
                  <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border/50 animate-fade-in">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{selectedMapComplaint.complaint_id}</h3>
                        <p className="text-sm text-muted-foreground">{selectedMapComplaint.area_name || 'Unknown area'}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={
                          selectedMapComplaint.priority === 'critical' ? 'bg-red-500/20 text-red-500' :
                          selectedMapComplaint.priority === 'high' ? 'bg-orange-500/20 text-orange-500' :
                          selectedMapComplaint.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                          'bg-green-500/20 text-green-500'
                        }>
                          {selectedMapComplaint.priority}
                        </Badge>
                        <Badge variant="outline">{selectedMapComplaint.complaint_status}</Badge>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Fill Level:</span>
                        <span className="ml-2 font-medium">{selectedMapComplaint.fill_level}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <span className="ml-2 font-medium capitalize">{selectedMapComplaint.status}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Complaints Management Tab */}
          <TabsContent value="complaints" className="space-y-6">
            <ComplaintManagement />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Refresh button */}
            <div className="flex justify-end">
              <Button 
                onClick={handleRefresh} 
                disabled={refreshing}
                variant="outline"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="glass-card p-5 animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`${stat.bgColor} p-2 rounded-lg`}>
                        <Icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <span className="text-muted-foreground text-sm">{stat.label}</span>
                    </div>
                    <p className={`font-display text-3xl font-bold ${stat.color}`}>
                      {loading ? "..." : stat.value}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Records Table */}
            <Card className="glass-card border-border/50 animate-fade-in" style={{ animationDelay: "400ms" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Complaint Records
                </CardTitle>
                <CardDescription>
                  Recent complaint records with status and priority levels (only reported issues)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : analyticsRecords.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Trash2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No complaint records found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Complaint ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Fill Level</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analyticsRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-mono text-sm">
                              {record.complaintId.slice(0, 12)}...
                            </TableCell>
                            <TableCell>{getStatusBadge(record.status)}</TableCell>
                            <TableCell>{getPriorityBadge(record.priority)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      record.fillLevel >= 75 
                                        ? "bg-destructive" 
                                        : record.fillLevel >= 25 
                                        ? "bg-warning" 
                                        : "bg-neon-green"
                                    }`}
                                    style={{ width: `${record.fillLevel}%` }}
                                  />
                                </div>
                                <span className="text-sm text-muted-foreground">{record.fillLevel}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm truncate max-w-[150px]">
                              {record.address}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {getTimeAgo(record.timestamp)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <UserRoleManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
