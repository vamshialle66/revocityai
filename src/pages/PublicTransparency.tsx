import { useState, useEffect } from "react";
import { 
  BarChart3, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Award,
  Users,
  Leaf,
  Building
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import GoogleMap from "@/components/GoogleMap";
import { supabase } from "@/integrations/supabase/client";

interface AreaStat {
  area_name: string;
  total: number;
  resolved: number;
  pending: number;
}

interface TransparencyStats {
  totalComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
  escalatedComplaints: number;
  avgResolutionHours: number;
  cityCleanlinessScore: number;
  topCleanAreas: AreaStat[];
  problemHotspots: AreaStat[];
  weeklyTrend: 'up' | 'down' | 'stable';
  weeklyChange: number;
}

const PublicTransparency = () => {
  const [stats, setStats] = useState<TransparencyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [hotspotLocations, setHotspotLocations] = useState<{
    id: string;
    lat: number;
    lng: number;
    status: 'empty' | 'half-filled' | 'overflowing';
    address: string;
  }[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Fetch all complaints
        const { data: complaints, error } = await supabase
          .from('complaints')
          .select('*');

        if (error) throw error;

        const allComplaints = complaints || [];
        const total = allComplaints.length;
        const resolved = allComplaints.filter(c => c.complaint_status === 'resolved').length;
        const pending = allComplaints.filter(c => c.complaint_status === 'pending').length;
        const escalated = allComplaints.filter(c => c.complaint_status === 'escalated').length;

        // Calculate avg resolution time
        const resolvedWithTime = allComplaints.filter(c => c.resolved_at && c.created_at);
        const avgHours = resolvedWithTime.length > 0
          ? resolvedWithTime.reduce((acc, c) => {
              const created = new Date(c.created_at!);
              const resolved = new Date(c.resolved_at!);
              return acc + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
            }, 0) / resolvedWithTime.length
          : 0;

        // Calculate cleanliness score (100 - pending percentage - escalation penalty)
        const resolutionRate = total > 0 ? (resolved / total) * 100 : 100;
        const escalationPenalty = total > 0 ? (escalated / total) * 20 : 0;
        const cleanlinessScore = Math.max(0, Math.min(100, resolutionRate - escalationPenalty));

        // Group by area
        const areaMap = new Map<string, AreaStat>();
        allComplaints.forEach(c => {
          const area = c.area_name || 'Unknown Area';
          const existing = areaMap.get(area) || { area_name: area, total: 0, resolved: 0, pending: 0 };
          existing.total++;
          if (c.complaint_status === 'resolved') existing.resolved++;
          else existing.pending++;
          areaMap.set(area, existing);
        });

        const areas = Array.from(areaMap.values());
        const topClean = areas
          .filter(a => a.total >= 1)
          .sort((a, b) => (b.resolved / b.total) - (a.resolved / a.total))
          .slice(0, 5);
        const hotspots = areas
          .filter(a => a.pending > 0)
          .sort((a, b) => b.pending - a.pending)
          .slice(0, 5);

        // Weekly trend
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        const thisWeek = allComplaints.filter(c => new Date(c.created_at!) >= oneWeekAgo).length;
        const lastWeek = allComplaints.filter(c => {
          const d = new Date(c.created_at!);
          return d >= twoWeeksAgo && d < oneWeekAgo;
        }).length;

        const weeklyChange = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;

        setStats({
          totalComplaints: total,
          resolvedComplaints: resolved,
          pendingComplaints: pending,
          escalatedComplaints: escalated,
          avgResolutionHours: Math.round(avgHours),
          cityCleanlinessScore: Math.round(cleanlinessScore),
          topCleanAreas: topClean,
          problemHotspots: hotspots,
          weeklyTrend: weeklyChange > 5 ? 'up' : weeklyChange < -5 ? 'down' : 'stable',
          weeklyChange: Math.abs(Math.round(weeklyChange)),
        });

        // Load hotspot locations for map
        const pendingComplaints = allComplaints.filter(c => c.complaint_status !== 'resolved');
        const locations = pendingComplaints.map(c => ({
          id: c.id,
          lat: c.latitude,
          lng: c.longitude,
          status: c.fill_level >= 75 ? 'overflowing' as const : 
                  c.fill_level >= 25 ? 'half-filled' as const : 'empty' as const,
          address: c.address || c.area_name || 'Unknown',
        }));
        setHotspotLocations(locations);

      } catch (error) {
        console.error("Error loading transparency stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg pt-24 pb-12 px-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-neon-green';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Improvement';
    return 'Critical';
  };

  return (
    <div className="min-h-screen gradient-bg pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-4">
            <Building className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Public Dashboard</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            City Cleanliness Report
          </h1>
          <p className="text-muted-foreground">
            Real-time transparency on waste management performance
          </p>
        </div>

        {stats && (
          <>
            {/* City Cleanliness Score */}
            <Card className="glass-card mb-8 overflow-hidden">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left">
                    <h2 className="font-display text-lg text-muted-foreground mb-2">City Cleanliness Score</h2>
                    <div className="flex items-baseline gap-2">
                      <span className={`font-display text-6xl font-bold ${getScoreColor(stats.cityCleanlinessScore)}`}>
                        {stats.cityCleanlinessScore}
                      </span>
                      <span className="text-2xl text-muted-foreground">/100</span>
                    </div>
                    <Badge className={`mt-2 ${
                      stats.cityCleanlinessScore >= 80 ? 'bg-neon-green/20 text-neon-green border-neon-green/30' :
                      stats.cityCleanlinessScore >= 60 ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' :
                      'bg-red-500/20 text-red-500 border-red-500/30'
                    }`}>
                      {getScoreLabel(stats.cityCleanlinessScore)}
                    </Badge>
                  </div>
                  <div className="w-full md:w-1/2">
                    <Progress 
                      value={stats.cityCleanlinessScore} 
                      className="h-4"
                    />
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>Critical</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Total Reports</p>
                      <p className="font-display text-2xl font-bold">{stats.totalComplaints}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-neon-green/10 p-3 rounded-lg">
                      <CheckCircle2 className="w-6 h-6 text-neon-green" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Resolved</p>
                      <p className="font-display text-2xl font-bold text-neon-green">{stats.resolvedComplaints}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-yellow-500/10 p-3 rounded-lg">
                      <Clock className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Pending</p>
                      <p className="font-display text-2xl font-bold text-yellow-500">{stats.pendingComplaints}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-500/10 p-3 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Escalated</p>
                      <p className="font-display text-2xl font-bold text-orange-500">{stats.escalatedComplaints}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Trend & Resolution Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {stats.weeklyTrend === 'down' ? (
                      <TrendingDown className="w-5 h-5 text-neon-green" />
                    ) : stats.weeklyTrend === 'up' ? (
                      <TrendingUp className="w-5 h-5 text-red-500" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-muted-foreground" />
                    )}
                    Weekly Trend
                  </CardTitle>
                  <CardDescription>Complaint volume compared to last week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <span className={`font-display text-4xl font-bold ${
                      stats.weeklyTrend === 'down' ? 'text-neon-green' : 
                      stats.weeklyTrend === 'up' ? 'text-red-500' : 'text-muted-foreground'
                    }`}>
                      {stats.weeklyTrend === 'down' ? '-' : stats.weeklyTrend === 'up' ? '+' : ''}{stats.weeklyChange}%
                    </span>
                    <span className="text-muted-foreground">
                      {stats.weeklyTrend === 'down' ? 'Fewer complaints - Great improvement!' : 
                       stats.weeklyTrend === 'up' ? 'More complaints this week' : 'Stable complaint volume'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Avg Resolution Time
                  </CardTitle>
                  <CardDescription>Average time to resolve complaints</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-4xl font-bold text-primary">
                      {stats.avgResolutionHours}
                    </span>
                    <span className="text-muted-foreground">hours</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Areas Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Top Clean Areas */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-neon-green" />
                    Top Clean Areas
                  </CardTitle>
                  <CardDescription>Areas with highest resolution rates</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.topCleanAreas.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No data yet</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.topCleanAreas.map((area, idx) => (
                        <div key={area.area_name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-neon-green/20 text-neon-green flex items-center justify-center text-sm font-bold">
                              {idx + 1}
                            </span>
                            <span className="font-medium">{area.area_name}</span>
                          </div>
                          <Badge className="bg-neon-green/20 text-neon-green border-neon-green/30">
                            {Math.round((area.resolved / area.total) * 100)}% resolved
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Problem Hotspots */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Problem Hotspots
                  </CardTitle>
                  <CardDescription>Areas needing attention</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.problemHotspots.length === 0 ? (
                    <p className="text-muted-foreground text-sm flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-neon-green" />
                      All areas are clean!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {stats.problemHotspots.map((area) => (
                        <div key={area.area_name} className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                          <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-red-500" />
                            <span className="font-medium">{area.area_name}</span>
                          </div>
                          <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
                            {area.pending} pending
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Hotspots Map */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Live Complaint Map
                </CardTitle>
                <CardDescription>Current pending complaint locations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] rounded-lg overflow-hidden">
                  <GoogleMap bins={hotspotLocations} />
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="mt-8 text-center text-muted-foreground text-sm">
              <p>Data updated in real-time • Powered by CleanCity AI</p>
              <p className="mt-1 flex items-center justify-center gap-2">
                <Users className="w-4 h-4" />
                Citizen-powered transparency for a cleaner city
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PublicTransparency;