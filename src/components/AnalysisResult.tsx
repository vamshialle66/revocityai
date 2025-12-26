import { CheckCircle, AlertTriangle, XCircle, Trash2, ArrowRight } from "lucide-react";

// Types for analysis status
export type BinStatus = "empty" | "half-filled" | "overflowing";

export interface AnalysisData {
  status: BinStatus;
  percentage: number;
  recommendation: string;
  timestamp: Date;
}

interface AnalysisResultProps {
  data: AnalysisData | null;
  isAnalyzing: boolean;
}

/**
 * AnalysisResult Component
 * Displays the AI analysis results with animated status indicators
 */
const AnalysisResult = ({ data, isAnalyzing }: AnalysisResultProps) => {
  // Configuration for each status type
  const statusConfig = {
    empty: {
      icon: CheckCircle,
      label: "Empty",
      color: "text-neon-green",
      bgColor: "bg-neon-green/10",
      borderColor: "border-neon-green/50",
      glowColor: "shadow-[0_0_20px_hsl(142,76%,45%,0.3)]",
    },
    "half-filled": {
      icon: AlertTriangle,
      label: "Half Filled",
      color: "text-warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/50",
      glowColor: "shadow-[0_0_20px_hsl(38,92%,50%,0.3)]",
    },
    overflowing: {
      icon: XCircle,
      label: "Overflowing",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      borderColor: "border-destructive/50",
      glowColor: "shadow-[0_0_20px_hsl(0,72%,51%,0.3)]",
    },
  };

  // Analyzing state - show loading animation
  if (isAnalyzing) {
    return (
      <div className="w-full max-w-xl mx-auto">
        <div className="glass-card p-8 text-center">
          {/* Animated scanning effect */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-primary/30 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin" />
            <Trash2 className="absolute inset-0 m-auto w-10 h-10 text-primary animate-pulse" />
          </div>
          
          <h3 className="font-display text-xl font-semibold text-foreground mb-2">
            Analyzing Bin Status...
          </h3>
          <p className="text-muted-foreground text-sm">
            AI is processing your image
          </p>
          
          {/* Progress bar animation */}
          <div className="mt-6 h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full shimmer w-full" />
          </div>
        </div>
      </div>
    );
  }

  // No data yet
  if (!data) {
    return null;
  }

  const config = statusConfig[data.status];
  const StatusIcon = config.icon;

  return (
    <div className="w-full max-w-xl mx-auto animate-fade-in">
      <div className={`glass-card overflow-hidden ${config.glowColor}`}>
        {/* Status header */}
        <div className={`${config.bgColor} border-b ${config.borderColor} p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`${config.bgColor} p-3 rounded-xl border ${config.borderColor}`}>
                <StatusIcon className={`w-8 h-8 ${config.color}`} />
              </div>
              <div>
                <p className="text-muted-foreground text-sm uppercase tracking-wider">Status</p>
                <h3 className={`font-display text-2xl font-bold ${config.color}`}>
                  {config.label}
                </h3>
              </div>
            </div>
            
            {/* Percentage badge */}
            <div className={`${config.bgColor} border ${config.borderColor} rounded-xl px-4 py-2`}>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Fill Level</p>
              <p className={`font-display text-3xl font-bold ${config.color}`}>
                {data.percentage}%
              </p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-4 bg-muted/20">
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full ${config.bgColor} border-r-2 ${config.borderColor} transition-all duration-1000 ease-out`}
              style={{ width: `${data.percentage}%` }}
            >
              <div className={`h-full ${config.color.replace('text-', 'bg-')} opacity-50`} />
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="p-6">
          <div className="flex items-start gap-3">
            <ArrowRight className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-muted-foreground text-sm uppercase tracking-wider mb-1">
                Recommendation
              </p>
              <p className="text-foreground font-medium">
                {data.recommendation}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;
