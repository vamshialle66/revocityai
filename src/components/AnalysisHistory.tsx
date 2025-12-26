import { CheckCircle, AlertTriangle, XCircle, Clock, Loader2, CheckCheck } from "lucide-react";

type BinStatus = 'empty' | 'half-filled' | 'overflowing';

interface ComplaintHistoryItem {
  status: BinStatus;
  percentage: number;
  recommendation: string;
  timestamp: Date;
  complaintStatus: 'pending' | 'in_progress' | 'resolved';
  complaintId: string;
  address: string;
}

interface AnalysisHistoryProps {
  history: ComplaintHistoryItem[];
}

/**
 * AnalysisHistory Component
 * Displays a table of previous waste bin analyses
 */
const AnalysisHistory = ({ history }: AnalysisHistoryProps) => {
  // Status configuration for icons and colors
  const getStatusConfig = (status: BinStatus) => {
    switch (status) {
      case "empty":
        return {
          icon: CheckCircle,
          label: "Empty",
          color: "text-neon-green",
          bgColor: "bg-neon-green/10",
          priority: "Low",
          priorityColor: "text-neon-green",
        };
      case "half-filled":
        return {
          icon: AlertTriangle,
          label: "Half Filled",
          color: "text-warning",
          bgColor: "bg-warning/10",
          priority: "Medium",
          priorityColor: "text-warning",
        };
      case "overflowing":
        return {
          icon: XCircle,
          label: "Overflowing",
          color: "text-destructive",
          bgColor: "bg-destructive/10",
          priority: "High",
          priorityColor: "text-destructive",
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

  // Get complaint status config
  const getComplaintStatusConfig = (status?: 'pending' | 'in_progress' | 'resolved') => {
    switch (status) {
      case 'resolved':
        return {
          icon: CheckCheck,
          label: 'Resolved',
          color: 'text-neon-green',
          bgColor: 'bg-neon-green/10',
        };
      case 'in_progress':
        return {
          icon: Loader2,
          label: 'In Progress',
          color: 'text-primary',
          bgColor: 'bg-primary/10',
        };
      default:
        return {
          icon: Clock,
          label: 'Pending',
          color: 'text-warning',
          bgColor: 'bg-warning/10',
        };
    }
  };

  // Empty state
  if (history.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-lg font-semibold text-foreground mb-2">
          No Complaints Yet
        </h3>
        <p className="text-muted-foreground text-sm">
          Report an issue from the home page to see your complaints here
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-4 gap-4 px-6 py-4 bg-muted/30 border-b border-border">
        <div className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
          Bin Status
        </div>
        <div className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
          Complaint Status
        </div>
        <div className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
          Location
        </div>
        <div className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
          Time
        </div>
      </div>

      {/* Table rows */}
      <div className="divide-y divide-border">
        {history.map((item, index) => {
          const config = getStatusConfig(item.status);
          const StatusIcon = config.icon;
          const complaintConfig = getComplaintStatusConfig(item.complaintStatus);
          const ComplaintStatusIcon = complaintConfig.icon;

          return (
            <div
              key={index}
              className="grid grid-cols-4 gap-4 px-6 py-4 hover:bg-muted/20 transition-colors duration-200"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Bin Status column */}
              <div className="flex items-center gap-3">
                <div className={`${config.bgColor} p-2 rounded-lg`}>
                  <StatusIcon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div>
                  <p className={`font-medium ${config.color}`}>{config.label}</p>
                  <p className="text-muted-foreground text-xs">{item.percentage}% filled</p>
                </div>
              </div>

              {/* Complaint Status column */}
              <div className="flex items-center gap-2">
                <div className={`${complaintConfig.bgColor} p-1.5 rounded-lg`}>
                  <ComplaintStatusIcon className={`w-4 h-4 ${complaintConfig.color} ${item.complaintStatus === 'in_progress' ? 'animate-spin' : ''}`} />
                </div>
                <span className={`font-medium text-sm ${complaintConfig.color}`}>
                  {complaintConfig.label}
                </span>
              </div>

              {/* Location column */}
              <div className="flex items-center text-muted-foreground text-sm truncate">
                {item.address || 'Unknown'}
              </div>

              {/* Time column */}
              <div className="flex items-center text-muted-foreground text-sm">
                <Clock className="w-4 h-4 mr-2" />
                {formatTime(item.timestamp)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalysisHistory;
