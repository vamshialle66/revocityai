import { useState, useEffect, useCallback } from "react";
import { BarChart3, Trash2, TrendingUp, AlertCircle, FileText, Eye } from "lucide-react";
import AnalysisHistory from "@/components/AnalysisHistory";
import ScanHistory from "@/components/ScanHistory";
import GoogleMap from "@/components/GoogleMap";
import CitizenRewards from "@/components/CitizenRewards";
import AreaRiskAnalytics from "@/components/AreaRiskAnalytics";
import Leaderboard from "@/components/Leaderboard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Complaint data type (extended from AnalysisData)
interface ComplaintData {
  status: 'empty' | 'half-filled' | 'overflowing';
  percentage: number;
  recommendation: string;
  timestamp: Date;
  complaintStatus: 'pending' | 'in_progress' | 'resolved';
  complaintId: string;
  address: string;
}

// Scan data type
interface ScanData {
  id: string;
  status: 'empty' | 'half-filled' | 'overflowing';
  percentage: number;
  recommendation: string;
  timestamp: Date;
  address?: string;
}

/**
 * Dashboard Page Component
 * Shows analysis history, statistics, and map view
 */
const Dashboard = () => {
  const { user } = useAuth();
  // State for complaints
  const [complaints, setComplaints] = useState<ComplaintData[]>([]);
  // State for scans (not reported)
  const [scans, setScans] = useState<ScanData[]>([]);
  const [loading, setLoading] = useState(true);

  // Load complaints from Supabase
  const loadComplaints = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('reporter_firebase_uid', user.uid)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading complaints:', error);
        return;
      }

      // Map to AnalysisData format with complaint status
      const mapped = (data || []).map((complaint) => ({
        status: complaint.fill_level >= 75 ? 'overflowing' : 
                complaint.fill_level >= 25 ? 'half-filled' : 'empty' as 'empty' | 'half-filled' | 'overflowing',
        percentage: complaint.fill_level,
        recommendation: complaint.ai_recommendations?.[0] || '',
        timestamp: new Date(complaint.created_at || ''),
        complaintStatus: complaint.complaint_status as 'pending' | 'in_progress' | 'resolved',
        complaintId: complaint.complaint_id,
        address: complaint.address || complaint.area_name || 'Unknown location',
      }));
      setComplaints(mapped);
    } catch (error) {
      console.error('Error loading complaints:', error);
    }
  }, [user]);

  // Load scans via edge function (secure - bypasses restrictive RLS)
  const loadScans = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-scans`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firebaseUid: user.uid }),
        }
      );

      if (!response.ok) {
        console.error('Error loading scans:', response.statusText);
        return;
      }

      const result = await response.json();
      const data = result.scans || [];

      const mapped = data.map((scan: any) => ({
        id: scan.id,
        status: scan.status as 'empty' | 'half-filled' | 'overflowing',
        percentage: scan.fill_level,
        recommendation: scan.recommendation || '',
        timestamp: new Date(scan.created_at || ''),
        address: scan.address || scan.area_name || undefined,
      }));
      setScans(mapped);
    } catch (error) {
      console.error('Error loading scans:', error);
    }
  }, [user]);

  // Load data on mount
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadComplaints(), loadScans()]);
      setLoading(false);
    };
    init();
  }, [loadComplaints, loadScans]);

  // Subscribe to real-time updates for complaints
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('complaints-status-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'complaints',
          filter: `reporter_firebase_uid=eq.${user.uid}`,
        },
        (payload) => {
          const updated = payload.new as { complaint_status: string; complaint_id: string; address?: string };
          const oldStatus = (payload.old as { complaint_status: string })?.complaint_status;
          
          // Only notify if status actually changed
          if (updated.complaint_status !== oldStatus) {
            const statusLabels: Record<string, string> = {
              pending: 'Pending',
              in_progress: 'In Progress',
              resolved: 'Resolved',
            };
            
            toast({
              title: "Complaint Status Updated",
              description: `Complaint #${updated.complaint_id.slice(0, 8)} at ${updated.address || 'Unknown location'} is now ${statusLabels[updated.complaint_status] || updated.complaint_status}`,
            });
          }
          
          // Refresh the data
          loadComplaints();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadComplaints]);

  // State for user's complaint locations
  const [complaintLocations, setComplaintLocations] = useState<{
    id: string;
    lat: number;
    lng: number;
    status: 'empty' | 'half-filled' | 'overflowing';
    address: string;
  }[]>([]);

  // Load complaint locations from Supabase
  useEffect(() => {
    const loadLocations = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('complaints')
          .select('id, latitude, longitude, fill_level, address, area_name')
          .eq('reporter_firebase_uid', user.uid);

        if (error) {
          console.error('Error loading locations:', error);
          return;
        }

        const mapped = (data || []).map((complaint) => ({
          id: complaint.id,
          lat: complaint.latitude,
          lng: complaint.longitude,
          status: complaint.fill_level >= 75 ? 'overflowing' as const : 
                  complaint.fill_level >= 25 ? 'half-filled' as const : 'empty' as const,
          address: complaint.address || complaint.area_name || 'Unknown location',
        }));
        setComplaintLocations(mapped);
      } catch (error) {
        console.error('Error loading locations:', error);
      }
    };

    loadLocations();
  }, [user]);

  // Calculate statistics - now based on complaints only
  const stats = {
    totalComplaints: complaints.length,
    totalScans: scans.length,
    pendingComplaints: complaints.filter((c) => c.complaintStatus === 'pending').length,
    resolvedComplaints: complaints.filter((c) => c.complaintStatus === 'resolved').length,
  };

  // Stat cards data
  const statCards = [
    {
      icon: FileText,
      label: "My Complaints",
      value: stats.totalComplaints,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Eye,
      label: "My Scans",
      value: stats.totalScans,
      color: "text-neon-green",
      bgColor: "bg-neon-green/10",
    },
    {
      icon: TrendingUp,
      label: "Pending",
      value: stats.pendingComplaints,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      icon: AlertCircle,
      label: "Resolved",
      value: stats.resolvedComplaints,
      color: "text-neon-green",
      bgColor: "bg-neon-green/10",
    },
  ];

  return (
    <div className="min-h-screen gradient-bg pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor your complaints and scanned bins
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
                  {loading ? '...' : stat.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Rewards & Leaderboard Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
            <CitizenRewards />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: "300ms" }}>
            <Leaderboard />
          </div>
          <div className="animate-fade-in md:col-span-2 lg:col-span-1" style={{ animationDelay: "350ms" }}>
            <AreaRiskAnalytics />
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* History Section with Tabs */}
          <div className="animate-fade-in" style={{ animationDelay: "400ms" }}>
            <Tabs defaultValue="complaints" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="complaints" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  My Complaints ({complaints.length})
                </TabsTrigger>
                <TabsTrigger value="scans" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  My Scans ({scans.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="complaints">
                {loading ? (
                  <div className="glass-card p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-4">Loading complaints...</p>
                  </div>
                ) : (
                  <AnalysisHistory history={complaints} />
                )}
              </TabsContent>
              
              <TabsContent value="scans">
                {loading ? (
                  <div className="glass-card p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-4">Loading scans...</p>
                  </div>
                ) : (
                  <ScanHistory scans={scans} />
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Map Section */}
          <div className="animate-fade-in" style={{ animationDelay: "500ms" }}>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">
              Complaint Locations
            </h2>
            <div className="h-[400px]">
              <GoogleMap bins={complaintLocations} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
