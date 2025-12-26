import { CheckCircle, AlertTriangle, XCircle, Clock, Eye } from "lucide-react";

interface ScanData {
  id: string;
  status: 'empty' | 'half-filled' | 'overflowing';
  percentage: number;
  recommendation: string;
  timestamp: Date;
  address?: string;
}

interface ScanHistoryProps {
  scans: ScanData[];
}

/**
 * ScanHistory Component
 * Displays a table of scanned bins (not reported as complaints)
 */
const ScanHistory = ({ scans }: ScanHistoryProps) => {
  // Status configuration for icons and colors
  const getStatusConfig = (status: 'empty' | 'half-filled' | 'overflowing') => {
    switch (status) {
      case "empty":
        return {
          icon: CheckCircle,
          label: "Empty",
          color: "text-neon-green",
          bgColor: "bg-neon-green/10",
        };
      case "half-filled":
        return {
          icon: AlertTriangle,
          label: "Half Filled",
          color: "text-warning",
          bgColor: "bg-warning/10",
        };
      case "overflowing":
        return {
          icon: XCircle,
          label: "Overflowing",
          color: "text-destructive",
          bgColor: "bg-destructive/10",
        };
    }
  };

  // Format timestamp for display
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    }).format(date);
  };

  // Empty state
  if (scans.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-lg font-semibold text-foreground mb-2">
          No Scans Yet
        </h3>
        <p className="text-muted-foreground text-sm">
          Analyze bin images on the home page to see your scan history here
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-muted/30 border-b border-border">
        <div className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
          Bin Status
        </div>
        <div className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
          Fill Level
        </div>
        <div className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
          Time
        </div>
      </div>

      {/* Table rows */}
      <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
        {scans.map((scan, index) => {
          const config = getStatusConfig(scan.status);
          const StatusIcon = config.icon;

          return (
            <div
              key={scan.id}
              className="grid grid-cols-3 gap-4 px-6 py-4 hover:bg-muted/20 transition-colors duration-200"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Bin Status column */}
              <div className="flex items-center gap-3">
                <div className={`${config.bgColor} p-2 rounded-lg`}>
                  <StatusIcon className={`w-4 h-4 ${config.color}`} />
                </div>
                <p className={`font-medium ${config.color}`}>{config.label}</p>
              </div>

              {/* Fill Level column */}
              <div className="flex items-center">
                <div className="w-full max-w-[100px]">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        scan.percentage >= 75 ? 'bg-destructive' : 
                        scan.percentage >= 25 ? 'bg-warning' : 'bg-neon-green'
                      }`}
                      style={{ width: `${scan.percentage}%` }}
                    />
                  </div>
                  <p className="text-muted-foreground text-xs mt-1">{scan.percentage}% filled</p>
                </div>
              </div>

              {/* Time column */}
              <div className="flex items-center text-muted-foreground text-sm">
                <Clock className="w-4 h-4 mr-2" />
                {formatTime(scan.timestamp)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScanHistory;