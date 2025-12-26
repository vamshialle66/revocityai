import { 
  Trash2, Bug, Wind, Activity, AlertTriangle, Shield, Leaf, 
  Clock, Zap, CheckCircle2, XCircle, AlertCircle, ThermometerSun,
  Droplets, Eye, TrendingUp, Lightbulb, Gauge, Send
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface BinStatus {
  status: string;
  fill_percentage: number;
  condition_clarity: string;
}

interface HygieneAssessment {
  odor_risk: string;
  pest_risk: string;
  public_health_threat: string;
  surrounding_cleanliness: string;
}

interface EnvironmentalImpact {
  pollution_chance: string;
  litter_spread_risk: string;
  impact_level: string;
}

interface PriorityUrgency {
  priority_level: string;
  urgency_hours: number;
  urgency_message: string;
}

interface Confidence {
  score: number;
  quality_note?: string;
}

export interface ComprehensiveAnalysis {
  bin_status: BinStatus;
  hygiene_assessment: HygieneAssessment;
  environmental_impact: EnvironmentalImpact;
  priority_urgency: PriorityUrgency;
  suggested_actions: string[];
  confidence: Confidence;
  smart_insights: string[];
  recommendation: string;
  details: string;
}

interface AnalysisResultPanelProps {
  data: ComprehensiveAnalysis | null;
  isAnalyzing: boolean;
  onReportIssue?: () => void;
  showReportButton?: boolean;
}

const getRiskColor = (level: string) => {
  switch (level?.toLowerCase()) {
    case "low":
    case "none":
    case "minor":
    case "clean":
      return "bg-neon-green/20 text-neon-green border-neon-green/30";
    case "medium":
    case "partial":
    case "concerning":
    case "litter_present":
    case "partially_visible":
      return "bg-warning/20 text-warning border-warning/30";
    case "high":
    case "severe":
    case "dangerous":
    case "dirty":
    case "full":
    case "overflowing":
    case "critical":
    case "hazardous":
    case "low_confidence":
      return "bg-destructive/20 text-destructive border-destructive/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case "empty":
      return <CheckCircle2 className="w-5 h-5 text-neon-green" />;
    case "partial":
      return <Gauge className="w-5 h-5 text-warning" />;
    case "full":
      return <AlertCircle className="w-5 h-5 text-orange-400" />;
    case "overflowing":
      return <AlertTriangle className="w-5 h-5 text-destructive" />;
    case "hazardous":
      return <XCircle className="w-5 h-5 text-destructive" />;
    default:
      return <Trash2 className="w-5 h-5 text-muted-foreground" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case "low":
      return "bg-neon-green text-neon-green-foreground";
    case "medium":
      return "bg-warning text-warning-foreground";
    case "high":
      return "bg-orange-500 text-white";
    case "critical":
      return "bg-destructive text-destructive-foreground animate-pulse";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const AnalysisResultPanel = ({ data, isAnalyzing, onReportIssue, showReportButton = true }: AnalysisResultPanelProps) => {
  // Loading state
  if (isAnalyzing) {
    return (
      <div className="w-full max-w-xl mx-auto">
        <div className="glass-card p-8 text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-primary/30 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin" />
            <Trash2 className="absolute inset-0 m-auto w-10 h-10 text-primary animate-pulse" />
          </div>
          <h3 className="font-display text-xl font-semibold text-foreground mb-2">
            Analyzing Bin Status...
          </h3>
          <p className="text-muted-foreground text-sm">
            AI is processing your image with comprehensive assessment
          </p>
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

  const { 
    bin_status, 
    hygiene_assessment, 
    environmental_impact, 
    priority_urgency, 
    suggested_actions, 
    confidence, 
    smart_insights,
    recommendation 
  } = data;

  return (
    <div className="space-y-4">
      {/* Section 1: Bin Status */}
      <div className="p-4 bg-card/50 rounded-lg border border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Trash2 className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-foreground text-sm">Bin Status</h4>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              {getStatusIcon(bin_status.status)}
            </div>
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge variant="outline" className={`${getRiskColor(bin_status.status)} capitalize mt-1`}>
              {bin_status.status}
            </Badge>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{bin_status.fill_percentage}%</p>
            <p className="text-xs text-muted-foreground">Fill Level</p>
            <Progress value={bin_status.fill_percentage} className="h-1.5 mt-1" />
          </div>
          <div className="text-center">
            <Eye className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Clarity</p>
            <Badge variant="outline" className={`${getRiskColor(bin_status.condition_clarity)} capitalize mt-1 text-xs`}>
              {bin_status.condition_clarity?.replace("_", " ")}
            </Badge>
          </div>
        </div>
      </div>

      {/* Section 2: Hygiene & Health Assessment */}
      <div className="p-4 bg-card/50 rounded-lg border border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-foreground text-sm">Hygiene & Health Assessment</h4>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className={`flex items-center gap-2 p-2 rounded-lg border ${getRiskColor(hygiene_assessment.odor_risk)}`}>
            <Wind className="w-4 h-4" />
            <div className="text-xs">
              <p className="font-medium">Odor Risk</p>
              <p className="capitalize">{hygiene_assessment.odor_risk}</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 p-2 rounded-lg border ${getRiskColor(hygiene_assessment.pest_risk)}`}>
            <Bug className="w-4 h-4" />
            <div className="text-xs">
              <p className="font-medium">Pest Risk</p>
              <p className="capitalize">{hygiene_assessment.pest_risk}</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 p-2 rounded-lg border ${getRiskColor(hygiene_assessment.public_health_threat)}`}>
            <Shield className="w-4 h-4" />
            <div className="text-xs">
              <p className="font-medium">Health Threat</p>
              <p className="capitalize">{hygiene_assessment.public_health_threat}</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 p-2 rounded-lg border ${getRiskColor(hygiene_assessment.surrounding_cleanliness)}`}>
            <ThermometerSun className="w-4 h-4" />
            <div className="text-xs">
              <p className="font-medium">Surroundings</p>
              <p className="capitalize">{hygiene_assessment.surrounding_cleanliness?.replace("_", " ")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Environmental Impact */}
      <div className="p-4 bg-card/50 rounded-lg border border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Leaf className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-foreground text-sm">Environmental Impact</h4>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className={`p-2 rounded-lg border text-center ${getRiskColor(environmental_impact.pollution_chance)}`}>
            <Droplets className="w-4 h-4 mx-auto mb-1" />
            <p className="text-xs font-medium">Pollution</p>
            <p className="text-xs capitalize">{environmental_impact.pollution_chance}</p>
          </div>
          <div className={`p-2 rounded-lg border text-center ${getRiskColor(environmental_impact.litter_spread_risk)}`}>
            <TrendingUp className="w-4 h-4 mx-auto mb-1" />
            <p className="text-xs font-medium">Litter Spread</p>
            <p className="text-xs capitalize">{environmental_impact.litter_spread_risk}</p>
          </div>
          <div className={`p-2 rounded-lg border text-center ${getRiskColor(environmental_impact.impact_level)}`}>
            <AlertTriangle className="w-4 h-4 mx-auto mb-1" />
            <p className="text-xs font-medium">Impact</p>
            <p className="text-xs capitalize">{environmental_impact.impact_level}</p>
          </div>
        </div>
      </div>

      {/* Section 4: Priority & Urgency */}
      <div className="p-4 bg-card/50 rounded-lg border border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-foreground text-sm">Priority & Urgency</h4>
        </div>
        <div className="flex items-center justify-between mb-3">
          <Badge className={`${getPriorityColor(priority_urgency.priority_level)} text-sm px-3 py-1`}>
            {priority_urgency.priority_level?.toUpperCase()} PRIORITY
          </Badge>
          <div className="flex items-center gap-1 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-medium">
              {priority_urgency.urgency_hours <= 2 ? "Immediate" : 
               priority_urgency.urgency_hours <= 12 ? `Within ${priority_urgency.urgency_hours}h` :
               priority_urgency.urgency_hours <= 48 ? `${Math.round(priority_urgency.urgency_hours / 24)} day(s)` :
               "Scheduled"}
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-2">
          ⏱️ {priority_urgency.urgency_message}
        </p>
      </div>

      {/* Section 5: Suggested Actions */}
      <div className="p-4 bg-card/50 rounded-lg border border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-foreground text-sm">Suggested Actions</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggested_actions?.map((action, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="bg-primary/10 text-primary border-primary/30"
            >
              {action}
            </Badge>
          ))}
        </div>
      </div>

      {/* Section 6: Confidence Score */}
      <div className="p-4 bg-card/50 rounded-lg border border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Gauge className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-foreground text-sm">AI Confidence</h4>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Confidence Score</span>
              <span className={`text-lg font-bold ${confidence.score >= 80 ? 'text-neon-green' : confidence.score >= 60 ? 'text-warning' : 'text-destructive'}`}>
                {confidence.score}%
              </span>
            </div>
            <Progress value={confidence.score} className="h-2" />
          </div>
        </div>
        {confidence.quality_note && confidence.score < 80 && (
          <p className="text-xs text-muted-foreground mt-2 bg-warning/10 rounded p-2 border border-warning/30">
            ⚠️ {confidence.quality_note}
          </p>
        )}
      </div>

      {/* Section 7: Smart Insights */}
      {smart_insights && smart_insights.length > 0 && (
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/30">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-foreground text-sm">Smart Insights</h4>
          </div>
          <ul className="space-y-2">
            {smart_insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-primary">💡</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Separator />

      {/* Primary Recommendation */}
      <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
        <p className="text-sm font-medium text-foreground">
          📋 <span className="text-primary">Recommendation:</span> {recommendation}
        </p>
      </div>

      {/* Report Issue Button */}
      {showReportButton && onReportIssue && (
        <Button
          onClick={onReportIssue}
          variant="neon"
          size="lg"
          className="w-full mt-4"
        >
          <Send className="w-4 h-4 mr-2" />
          Report This Issue
        </Button>
      )}
    </div>
  );
};

export default AnalysisResultPanel;
