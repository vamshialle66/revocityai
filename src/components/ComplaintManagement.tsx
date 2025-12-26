import { useState, useEffect, useRef } from "react";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  MapPin,
  User,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  Wrench,
  Bug,
  Wind,
  Shield,
  ImageIcon,
  MessageSquare,
  Gauge,
  Upload,
  ArrowUpCircle,
  Building,
  Timer,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Complaint {
  id: string;
  complaint_id: string;
  reporter_email: string | null;
  reporter_notes: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  area_name: string | null;
  image_url: string | null;
  cleanup_image_url: string | null;
  cleanup_verified: boolean | null;
  status: string;
  fill_level: number;
  priority: string;
  complaint_status: string;
  assigned_to: string | null;
  assigned_department: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  escalation_level: number | null;
  escalated_at: string | null;
  sla_hours: number | null;
  ai_recommendations: string[];
  ai_confidence: number | null;
  hygiene_risk: string | null;
  mosquito_risk: string | null;
  odor_risk: string | null;
  disease_risk: string | null;
  public_hygiene_impact: string | null;
  is_high_risk_area: boolean | null;
}

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  areaStats: Record<string, number>;
}

const ComplaintManagement = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [editAssignee, setEditAssignee] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [cleanupImage, setCleanupImage] = useState<string | null>(null);
  const [isVerifyingCleanup, setIsVerifyingCleanup] = useState(false);
  const [cleanupVerificationResult, setCleanupVerificationResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const [complaintsRes, statsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/complaints`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "list",
            status: filterStatus !== "all" ? filterStatus : undefined,
            priority: filterPriority !== "all" ? filterPriority : undefined,
          }),
        }),
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/complaints`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "stats" }),
        }),
      ]);

      const complaintsData = await complaintsRes.json();
      const statsData = await statsRes.json();

      setComplaints(complaintsData.complaints || []);
      setStats(statsData.stats || null);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch complaints");
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    init();
  }, [filterStatus, filterPriority]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success("Data refreshed");
  };

  const handleUpdateComplaint = async () => {
    if (!selectedComplaint || !user) return;

    setIsUpdating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/complaints`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            complaintId: selectedComplaint.id,
            adminFirebaseUid: user.uid,
            updates: {
              complaintStatus: editStatus || undefined,
              assignedTo: editAssignee || undefined,
              adminNotes: editNotes || undefined,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update");
      }

      toast.success("Complaint updated successfully");
      setSelectedComplaint(null);
      await fetchData();
    } catch (error) {
      toast.error("Failed to update complaint");
    } finally {
      setIsUpdating(false);
    }
  };

  const openComplaintDetail = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setEditNotes(complaint.admin_notes || "");
    setEditAssignee(complaint.assigned_to || "");
    setEditStatus(complaint.complaint_status);
    setCleanupImage(null);
    setCleanupVerificationResult(null);
  };

  // Handle cleanup image upload
  const handleCleanupImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setCleanupImage(e.target?.result as string);
      setCleanupVerificationResult(null);
    };
    reader.readAsDataURL(file);
  };

  // Verify cleanup with AI
  const handleVerifyCleanup = async () => {
    if (!cleanupImage || !selectedComplaint) return;

    setIsVerifyingCleanup(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-cleanup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: cleanupImage,
            complaintId: selectedComplaint.id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Verification failed");
      }

      const result = await response.json();
      setCleanupVerificationResult(result);

      if (result.recommendation === 'approve') {
        toast.success("Cleanup verified! You can now mark as resolved.");
      } else if (result.recommendation === 'reject') {
        toast.error(`Cleanup rejected: ${result.rejection_reason}`);
      } else {
        toast.warning("Cleanup needs re-inspection");
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Failed to verify cleanup");
    } finally {
      setIsVerifyingCleanup(false);
    }
  };

  // Calculate days pending
  const getDaysPending = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

  // Get escalation level label
  const getEscalationBadge = (level: number | null) => {
    switch (level) {
      case 1:
        return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 gap-1"><ArrowUpCircle className="w-3 h-3" />Level 1</Badge>;
      case 2:
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30 gap-1"><ArrowUpCircle className="w-3 h-3" />Level 2</Badge>;
      case 3:
        return <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30 gap-1"><ArrowUpCircle className="w-3 h-3" />Commissioner</Badge>;
      default:
        return null;
    }
  };

  const getDepartmentLabel = (dept: string | null) => {
    switch (dept) {
      case 'sanitation': return 'Sanitation Dept';
      case 'sanitation_supervisor': return 'Sanitation Supervisor';
      case 'health_department': return 'Health Department';
      case 'municipal_commissioner': return 'Municipal Commissioner';
      default: return dept || 'Sanitation Dept';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30 gap-1"><AlertCircle className="w-3 h-3" />Critical</Badge>;
      case "high":
        return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Medium</Badge>;
      default:
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Low</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" />Pending</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30 gap-1"><Wrench className="w-3 h-3" />In Progress</Badge>;
      case "escalated":
        return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 gap-1"><ArrowUpCircle className="w-3 h-3" />Escalated</Badge>;
      case "resolved":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30 gap-1"><CheckCircle2 className="w-3 h-3" />Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatTime = (dateStr: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  };

  const statCards = stats ? [
    { icon: AlertTriangle, label: "Pending", value: stats.pending, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
    { icon: Wrench, label: "In Progress", value: stats.inProgress, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { icon: CheckCircle2, label: "Resolved", value: stats.resolved, color: "text-green-500", bgColor: "bg-green-500/10" },
    { icon: AlertCircle, label: "Critical", value: stats.critical, color: "text-red-500", bgColor: "bg-red-500/10" },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="glass-card">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className={`${stat.bgColor} p-2 rounded-lg`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">{stat.label}</p>
                      <p className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filters and Table */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Complaint Reports</CardTitle>
              <CardDescription>Manage and track citizen complaints</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleRefresh} variant="outline" size="icon" disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No complaints found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reported</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((complaint) => (
                    <TableRow key={complaint.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openComplaintDetail(complaint)}>
                      <TableCell className="font-mono text-sm">{complaint.complaint_id}</TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="truncate">{complaint.area_name || "Unknown Area"}</p>
                          <p className="text-xs text-muted-foreground truncate">{complaint.address || `${complaint.latitude.toFixed(4)}, ${complaint.longitude.toFixed(4)}`}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(complaint.priority)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {getStatusBadge(complaint.complaint_status)}
                          {complaint.cleanup_verified && (
                            <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 gap-1 text-xs">
                              <CheckCircle2 className="w-3 h-3" />Verified
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{formatTime(complaint.created_at)}</TableCell>
                      <TableCell>
                        {complaint.assigned_to ? (
                          <Badge variant="outline" className="gap-1"><User className="w-3 h-3" />{complaint.assigned_to}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              {selectedComplaint?.complaint_id}
            </DialogTitle>
            <DialogDescription>
              Reported: {selectedComplaint && formatTime(selectedComplaint.created_at)}
            </DialogDescription>
          </DialogHeader>

          {selectedComplaint && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Bin Image */}
              {selectedComplaint.image_url && (
                <div className="rounded-lg overflow-hidden border border-border">
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/50">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Reported Bin Image</span>
                  </div>
                  <img 
                    src={selectedComplaint.image_url} 
                    alt="Reported bin" 
                    className="w-full max-h-48 object-contain bg-black/5"
                  />
                </div>
              )}

              {/* Priority & Fill Level */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <Label className="text-muted-foreground text-xs">Priority</Label>
                  <div className="mt-1">{getPriorityBadge(selectedComplaint.priority)}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <Label className="text-muted-foreground text-xs">Fill Level</Label>
                  <p className="mt-1 font-bold text-lg">{selectedComplaint.fill_level}%</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <Label className="text-muted-foreground text-xs flex items-center gap-1"><Gauge className="w-3 h-3" />Confidence</Label>
                  <p className="mt-1 font-bold text-lg">{selectedComplaint.ai_confidence || 0}%</p>
                </div>
              </div>

              {/* Health Risks */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <Label className="text-muted-foreground text-xs mb-2 block">Health & Hygiene Risks</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Bug className="w-4 h-4 text-orange-500" />
                    <span>Pest: <strong className="capitalize">{selectedComplaint.mosquito_risk || 'N/A'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Wind className="w-4 h-4 text-blue-500" />
                    <span>Odor: <strong className="capitalize">{selectedComplaint.odor_risk || 'N/A'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-red-500" />
                    <span>Disease: <strong className="capitalize">{selectedComplaint.disease_risk || 'N/A'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span>Impact: <strong className="capitalize">{selectedComplaint.public_hygiene_impact || 'N/A'}</strong></span>
                  </div>
                </div>
                {selectedComplaint.is_high_risk_area && (
                  <Badge className="mt-2 bg-red-500/20 text-red-500 border-red-500/30">
                    ⚠️ High Risk Area
                  </Badge>
                )}
              </div>

              {/* Location */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <Label className="text-muted-foreground text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />Location</Label>
                <p className="mt-1 text-sm">{selectedComplaint.address || `${selectedComplaint.latitude}, ${selectedComplaint.longitude}`}</p>
                <p className="text-sm text-muted-foreground">{selectedComplaint.area_name}</p>
              </div>

              {/* Reporter Notes */}
              {selectedComplaint.reporter_notes && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <Label className="text-blue-500 text-xs flex items-center gap-1"><MessageSquare className="w-3 h-3" />Reporter's Notes</Label>
                  <p className="mt-1 text-sm">{selectedComplaint.reporter_notes}</p>
                </div>
              )}

              {/* AI Recommendations */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <Label className="text-muted-foreground text-xs">AI Recommendations</Label>
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedComplaint.ai_recommendations?.length > 0 ? (
                    selectedComplaint.ai_recommendations.map((rec, idx) => (
                      <Badge key={idx} variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                        {rec}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No recommendations</p>
                  )}
                </div>
              </div>

              {/* Escalation Info */}
              {(selectedComplaint.escalation_level && selectedComplaint.escalation_level > 0) && (
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <Label className="text-orange-500 text-xs flex items-center gap-1">
                    <ArrowUpCircle className="w-3 h-3" />Escalation Status
                  </Label>
                  <div className="mt-2 flex items-center gap-3">
                    {getEscalationBadge(selectedComplaint.escalation_level)}
                    <span className="text-sm">
                      → <Building className="w-3 h-3 inline" /> {getDepartmentLabel(selectedComplaint.assigned_department)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    Pending for {getDaysPending(selectedComplaint.created_at)} days
                  </p>
                </div>
              )}

              {/* Cleanup Verification Section - Optional when marking as resolved */}
              {editStatus === "resolved" && !selectedComplaint.cleanup_verified && (
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Cleanup Verification (Optional)
                    </Label>
                    <Badge variant="outline" className="text-xs">Recommended</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Optionally upload an "after cleanup" photo for AI verification. This helps ensure genuine cleanups.
                  </p>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleCleanupImageSelect}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Upload button or preview */}
                  {!cleanupImage ? (
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full gap-2"
                      size="sm"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Cleanup Photo (Optional)
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded-lg overflow-hidden border border-primary/30">
                        <div className="flex items-center gap-2 px-3 py-2 bg-primary/10">
                          <Camera className="w-4 h-4 text-primary" />
                          <span className="text-xs text-primary">Cleanup Photo</span>
                        </div>
                        <img 
                          src={cleanupImage} 
                          alt="Cleanup evidence" 
                          className="w-full max-h-48 object-contain bg-black/5"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setCleanupImage(null);
                            setCleanupVerificationResult(null);
                          }}
                          className="flex-1"
                          size="sm"
                        >
                          Remove
                        </Button>
                        <Button 
                          onClick={handleVerifyCleanup}
                          disabled={isVerifyingCleanup}
                          className="flex-1 gap-2"
                          size="sm"
                        >
                          {isVerifyingCleanup ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4" />
                              Verify Cleanup
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Verification Result */}
                  {cleanupVerificationResult && (
                    <div className={`p-3 rounded-lg border ${
                      cleanupVerificationResult.recommendation === 'approve' 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : cleanupVerificationResult.recommendation === 'reject'
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-yellow-500/10 border-yellow-500/30'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {cleanupVerificationResult.recommendation === 'approve' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : cleanupVerificationResult.recommendation === 'reject' ? (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        )}
                        <span className={`font-semibold capitalize ${
                          cleanupVerificationResult.recommendation === 'approve' 
                            ? 'text-green-500' 
                            : cleanupVerificationResult.recommendation === 'reject'
                            ? 'text-red-500'
                            : 'text-yellow-500'
                        }`}>
                          {cleanupVerificationResult.recommendation === 'approve' 
                            ? 'Cleanup Verified ✓' 
                            : cleanupVerificationResult.recommendation === 'reject'
                            ? 'Cleanup Rejected'
                            : 'Needs Re-inspection'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        <div>
                          <span className="text-muted-foreground">Cleanliness Score:</span>
                          <span className="ml-1 font-bold">{cleanupVerificationResult.cleanliness_score}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Bin Status:</span>
                          <span className="ml-1 font-bold capitalize">{cleanupVerificationResult.bin_status?.replace('_', ' ')}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Surroundings:</span>
                          <span className="ml-1 font-bold capitalize">{cleanupVerificationResult.surrounding_cleanliness?.replace('_', ' ')}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Confidence:</span>
                          <span className="ml-1 font-bold">{cleanupVerificationResult.confidence}%</span>
                        </div>
                      </div>

                      {cleanupVerificationResult.issues_found?.length > 0 && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Issues: </span>
                          {cleanupVerificationResult.issues_found.join(', ')}
                        </div>
                      )}

                      <p className="text-xs mt-2 italic">{cleanupVerificationResult.summary}</p>

                      {cleanupVerificationResult.rejection_reason && (
                        <p className="text-xs mt-2 text-red-500">
                          <strong>Reason:</strong> {cleanupVerificationResult.rejection_reason}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Show if already verified */}
              {selectedComplaint.cleanup_verified && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-green-500 font-semibold">Cleanup Already Verified</span>
                  </div>
                  {selectedComplaint.cleanup_image_url && (
                    <img 
                      src={selectedComplaint.cleanup_image_url} 
                      alt="Verified cleanup" 
                      className="w-full max-h-32 object-contain rounded mt-2"
                    />
                  )}
                </div>
              )}

              {/* Admin Controls */}
              <div className="border-t pt-4 space-y-3">
                <div>
                  <Label>Update Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Assign To</Label>
                  <Input
                    value={editAssignee}
                    onChange={(e) => setEditAssignee(e.target.value)}
                    placeholder="Team name or ID"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Admin Notes</Label>
                  <Textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Add notes..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={handleUpdateComplaint} 
                  disabled={isUpdating} 
                  className="w-full"
                >
                  {isUpdating ? "Updating..." : "Update Complaint"}
                </Button>
                
                {editStatus === "resolved" && !cleanupVerificationResult && !selectedComplaint.cleanup_verified && (
                  <p className="text-xs text-muted-foreground text-center">
                    Tip: Upload a cleanup photo for verified resolution
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComplaintManagement;
