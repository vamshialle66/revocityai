import { useEffect, useState } from "react";
import { Trophy, Medal, Star, Shield, Award, Leaf } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface UserReward {
  id: string;
  firebase_uid: string;
  points: number;
  badges: string[];
  total_reports: number;
  valid_critical_reports: number;
}

const badgeIcons: Record<string, React.ElementType> = {
  "First Reporter": Star,
  "Active Citizen": Medal,
  "City Guardian": Shield,
  "Clean Hero": Trophy,
  "Eco Champion": Leaf,
};

const badgeColors: Record<string, string> = {
  "First Reporter": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Active Citizen": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "City Guardian": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Clean Hero": "bg-neon-green/20 text-neon-green border-neon-green/30",
  "Eco Champion": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const nextBadgeThresholds = [
  { badge: "First Reporter", reports: 1 },
  { badge: "Active Citizen", reports: 10 },
  { badge: "City Guardian", reports: 25 },
  { badge: "Clean Hero", criticalReports: 5 },
  { badge: "Eco Champion", points: 500 },
];

export const CitizenRewards = () => {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<UserReward | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRewards = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("user_rewards")
          .select("*")
          .eq("firebase_uid", user.uid)
          .maybeSingle();

        if (error) {
          console.error("Error loading rewards:", error);
          return;
        }

        setRewards(data);
      } catch (err) {
        console.error("Failed to load rewards:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRewards();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("rewards-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_rewards",
          filter: `firebase_uid=eq.${user?.uid}`,
        },
        (payload) => {
          if (payload.new) {
            setRewards(payload.new as UserReward);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-6 w-32 bg-muted rounded mb-4" />
        <div className="h-16 bg-muted rounded" />
      </div>
    );
  }

  if (!rewards) {
    return (
      <div className="glass-card p-6">
        <h3 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Your Rewards
        </h3>
        <p className="text-muted-foreground text-sm">
          Start reporting issues to earn points and badges!
        </p>
      </div>
    );
  }

  // Calculate progress to next badge
  const badges = rewards.badges || [];
  let nextGoal = { label: "", progress: 0, target: 0, current: 0 };
  
  if (!badges.includes("Active Citizen")) {
    nextGoal = {
      label: "Active Citizen",
      progress: (rewards.total_reports / 10) * 100,
      target: 10,
      current: rewards.total_reports,
    };
  } else if (!badges.includes("City Guardian")) {
    nextGoal = {
      label: "City Guardian",
      progress: (rewards.total_reports / 25) * 100,
      target: 25,
      current: rewards.total_reports,
    };
  } else if (!badges.includes("Eco Champion")) {
    nextGoal = {
      label: "Eco Champion",
      progress: (rewards.points / 500) * 100,
      target: 500,
      current: rewards.points,
    };
  }

  return (
    <div className="glass-card p-6">
      <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-primary" />
        Your Rewards
      </h3>

      {/* Points Display */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-3xl font-bold text-primary">{rewards.points}</p>
          <p className="text-sm text-muted-foreground">Total Points</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold text-foreground">{rewards.total_reports}</p>
          <p className="text-sm text-muted-foreground">Reports Made</p>
        </div>
      </div>

      {/* Badges */}
      <div className="mb-6">
        <p className="text-sm font-medium text-muted-foreground mb-2">Badges Earned</p>
        <div className="flex flex-wrap gap-2">
          {badges.length > 0 ? (
            badges.map((badge) => {
              const Icon = badgeIcons[badge] || Award;
              const colorClass = badgeColors[badge] || "bg-muted text-foreground";
              return (
                <Badge
                  key={badge}
                  variant="outline"
                  className={`${colorClass} flex items-center gap-1 px-3 py-1`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {badge}
                </Badge>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">No badges yet</p>
          )}
        </div>
      </div>

      {/* Progress to Next Badge */}
      {nextGoal.label && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">
              Next: {nextGoal.label}
            </p>
            <p className="text-xs text-muted-foreground">
              {nextGoal.current} / {nextGoal.target}
            </p>
          </div>
          <Progress value={Math.min(nextGoal.progress, 100)} className="h-2" />
        </div>
      )}
    </div>
  );
};

export default CitizenRewards;
