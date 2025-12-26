import { Bug, Wind, Activity, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HealthRisks {
  mosquito_risk?: string;
  odor_risk?: string;
  disease_risk?: string;
  public_hygiene_impact?: string;
}

interface HealthRiskBadgesProps {
  risks: HealthRisks;
  compact?: boolean;
}

const riskColors = {
  low: "bg-neon-green/20 text-neon-green border-neon-green/30",
  medium: "bg-warning/20 text-warning border-warning/30",
  moderate: "bg-warning/20 text-warning border-warning/30",
  high: "bg-destructive/20 text-destructive border-destructive/30",
  severe: "bg-destructive/20 text-destructive border-destructive/30",
};

const getRiskColor = (level?: string) => {
  return riskColors[level as keyof typeof riskColors] || riskColors.low;
};

export const HealthRiskBadges = ({ risks, compact = false }: HealthRiskBadgesProps) => {
  const riskItems = [
    { key: "mosquito_risk", label: "Mosquito Risk", icon: Bug, value: risks.mosquito_risk },
    { key: "odor_risk", label: "Odor Risk", icon: Wind, value: risks.odor_risk },
    { key: "disease_risk", label: "Disease Risk", icon: Activity, value: risks.disease_risk },
    { key: "public_hygiene_impact", label: "Hygiene Impact", icon: AlertTriangle, value: risks.public_hygiene_impact },
  ];

  if (compact) {
    // Show only high-risk items in compact mode
    const highRisks = riskItems.filter(
      (r) => r.value === "high" || r.value === "severe"
    );
    
    if (highRisks.length === 0) return null;

    return (
      <TooltipProvider>
        <div className="flex gap-1">
          {highRisks.map((risk) => {
            const Icon = risk.icon;
            return (
              <Tooltip key={risk.key}>
                <TooltipTrigger>
                  <Badge variant="outline" className={`${getRiskColor(risk.value)} px-1.5 py-0.5`}>
                    <Icon className="w-3 h-3" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{risk.label}: {risk.value?.toUpperCase()}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {riskItems.map((risk) => {
        const Icon = risk.icon;
        return (
          <div
            key={risk.key}
            className={`flex items-center gap-2 p-2 rounded-lg border ${getRiskColor(risk.value)}`}
          >
            <Icon className="w-4 h-4" />
            <div className="text-xs">
              <p className="font-medium">{risk.label}</p>
              <p className="capitalize">{risk.value || "Low"}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default HealthRiskBadges;
