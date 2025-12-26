import { useEffect, useState } from "react";
import { MapPin, AlertTriangle, TrendingUp, Clock, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";

interface AreaStats {
  id: string;
  area_name: string;
  latitude: number;
  longitude: number;
  total_complaints: number;
  overflow_count: number;
  avg_fill_level: number;
  risk_level: string;
  last_complaint_at: string;
  predicted_next_overflow: string | null;
}

const riskColors = {
  low: "bg-neon-green/20 text-neon-green border-neon-green/30",
  medium: "bg-warning/20 text-warning border-warning/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  critical: "bg-destructive/20 text-destructive border-destructive/30",
};

const riskLabels = {
  low: "Low Risk",
  medium: "Moderate",
  high: "High Risk Area",
  critical: "Critical Zone",
};

export const AreaRiskAnalytics = () => {
  const [areas, setAreas] = useState<AreaStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAreas = async () => {
      try {
        const { data, error } = await supabase
          .from("area_statistics")
          .select("*")
          .order("overflow_count", { ascending: false })
          .limit(10);

        if (error) {
          console.error("Error loading area stats:", error);
          return;
        }

        setAreas(data || []);
      } catch (err) {
        console.error("Failed to load area stats:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAreas();
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-6 w-48 bg-muted rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (areas.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Area Risk Analysis
        </h3>
        <p className="text-muted-foreground text-sm">
          No area data yet. Submit reports to build analytics.
        </p>
      </div>
    );
  }

  const highRiskAreas = areas.filter(
    (a) => a.risk_level === "high" || a.risk_level === "critical"
  );

  return (
    <div className="glass-card p-6">
      <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary" />
        Area Risk Analysis
      </h3>

      {/* High Risk Summary */}
      {highRiskAreas.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="font-medium text-destructive">
              {highRiskAreas.length} High Risk {highRiskAreas.length === 1 ? "Area" : "Areas"} Detected
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            These areas show frequent overflow patterns and need attention.
          </p>
        </div>
      )}

      {/* Area List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {areas.map((area) => {
          const riskColor = riskColors[area.risk_level as keyof typeof riskColors] || riskColors.low;
          const riskLabel = riskLabels[area.risk_level as keyof typeof riskLabels] || "Low Risk";

          return (
            <div
              key={area.id}
              className="bg-card/50 border border-border/50 rounded-lg p-3"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground text-sm truncate max-w-[150px]">
                    {area.area_name}
                  </span>
                </div>
                <Badge variant="outline" className={riskColor}>
                  {riskLabel}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Complaints</p>
                  <p className="font-semibold text-foreground">{area.total_complaints}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Overflows</p>
                  <p className="font-semibold text-destructive">{area.overflow_count}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg Fill</p>
                  <p className="font-semibold text-foreground">{area.avg_fill_level}%</p>
                </div>
              </div>

              {/* Prediction */}
              {area.predicted_next_overflow && (
                <div className="mt-2 pt-2 border-t border-border/30">
                  <div className="flex items-center gap-1 text-xs text-warning">
                    <TrendingUp className="w-3 h-3" />
                    <span>
                      Predicted overflow:{" "}
                      {formatDistanceToNow(new Date(area.predicted_next_overflow), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              )}

              {area.last_complaint_at && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    Last report: {formatDistanceToNow(new Date(area.last_complaint_at), { addSuffix: true })}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AreaRiskAnalytics;
