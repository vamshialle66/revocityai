import {
  collection,
  query,
  orderBy,
  getDocs,
  limit,
  Timestamp,
} from "firebase/firestore";
import { getDbAsync } from "@/lib/firebase";

export interface AdminAnalysisRecord {
  id: string;
  userId: string;
  status: "empty" | "half-filled" | "overflowing";
  confidence: number;
  recommendations: string[];
  timestamp: Date;
  priority: "low" | "medium" | "high";
}

export const getAllAnalyses = async (limitCount: number = 100): Promise<AdminAnalysisRecord[]> => {
  try {
    const db = await getDbAsync();
    const q = query(
      collection(db, "analyses"),
      orderBy("timestamp", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const analyses: AdminAnalysisRecord[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const status = data.status as "empty" | "half-filled" | "overflowing";
      
      // Determine priority based on status
      let priority: "low" | "medium" | "high" = "low";
      if (status === "overflowing") {
        priority = "high";
      } else if (status === "half-filled") {
        priority = "medium";
      }

      analyses.push({
        id: doc.id,
        userId: data.userId,
        status,
        confidence: data.confidence,
        recommendations: data.recommendations || [],
        timestamp: data.timestamp instanceof Timestamp 
          ? data.timestamp.toDate() 
          : new Date(data.timestamp),
        priority,
      });
    });

    return analyses;
  } catch (error) {
    console.error("Error fetching all analyses:", error);
    return [];
  }
};
