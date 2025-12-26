import { useEffect, useState } from "react";
import { Trophy, Medal, Crown, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface LeaderboardEntry {
  id: string;
  firebase_uid: string;
  points: number;
  total_reports: number;
  badges: string[];
}

interface UserInfo {
  firebase_uid: string;
  display_name: string | null;
  email: string | null;
}

export const Leaderboard = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<(LeaderboardEntry & { userName: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        // Get top 10 users by points
        const { data: rewards, error } = await supabase
          .from("user_rewards")
          .select("*")
          .order("points", { ascending: false })
          .limit(10);

        if (error) {
          console.error("Error loading leaderboard:", error);
          return;
        }

        if (!rewards || rewards.length === 0) {
          setEntries([]);
          return;
        }

        // Get user info for these firebase_uids
        const firebaseUids = rewards.map((r) => r.firebase_uid);
        const { data: users } = await supabase
          .from("users")
          .select("firebase_uid, display_name, email")
          .in("firebase_uid", firebaseUids);

        const userMap = new Map<string, UserInfo>();
        users?.forEach((u) => userMap.set(u.firebase_uid, u));

        const enriched = rewards.map((r) => {
          const userInfo = userMap.get(r.firebase_uid);
          return {
            ...r,
            userName: userInfo?.display_name || userInfo?.email?.split("@")[0] || "Anonymous",
          };
        });

        setEntries(enriched);
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-6 w-32 bg-muted rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Leaderboard
        </h3>
        <p className="text-muted-foreground text-sm">
          No data yet. Be the first to report an issue!
        </p>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-amber-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 text-center text-muted-foreground font-medium">{rank}</span>;
    }
  };

  return (
    <div className="glass-card p-6">
      <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-primary" />
        Top Contributors
      </h3>

      <div className="space-y-2">
        {entries.map((entry, index) => {
          const isCurrentUser = entry.firebase_uid === user?.uid;
          const rank = index + 1;

          return (
            <div
              key={entry.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isCurrentUser
                  ? "bg-primary/10 border border-primary/30"
                  : "bg-card/50 border border-border/30 hover:bg-card/80"
              }`}
            >
              <div className="flex items-center justify-center w-8">
                {getRankIcon(rank)}
              </div>

              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {entry.userName}
                    {isCurrentUser && <span className="text-primary ml-1">(You)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.total_reports} reports
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-bold text-primary">{entry.points}</p>
                <p className="text-xs text-muted-foreground">pts</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Leaderboard;
